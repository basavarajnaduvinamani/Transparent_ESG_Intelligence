"""
ESG Materiality Dashboard — Maxwell / FTSE 100
================================================
Requirements:  pip install dash plotly pandas openpyxl

Usage:
    1. Put this file in the same folder as your Excel file.
    2. Set EXCEL_FILE below (or pass --file path/to/file.xlsx on the command line).
    3. Run:  python esg_dashboard.py
    4. Open  http://127.0.0.1:8050  in your browser.
"""

import sys
import os
import argparse
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import dash
from dash import dcc, html, Input, Output, callback

# ── CONFIG ──────────────────────────────────────────────────────────────────
EXCEL_FILE = "FTSE100_financial_materiality_March_2025.xlsx"   # ← change this if needed
HEADER_ROW = 1          # row index (0-based) that contains column names
MATERIALITY_THRESHOLD = 0.6   # scores above this are "material"
TOP_N_DRIVERS = 6       # how many drivers to show per company

# ── PILLAR TAXONOMY ─────────────────────────────────────────────────────────
PILLAR_MAP = {
    "Air Quality": "E", "Ecological Impacts": "E", "Energy Management": "E",
    "GHG Emissions": "E", "Water & Hazardous Materials": "E",
    "Waste & Wastewater Management": "E",
    "Access & Affordability": "S", "Customer Privacy": "S",
    "Customer Welfare": "S", "Data Security": "S",
    "Employee Engagement": "S", "Employee Health & Safety": "S",
    "Human Rights & Community Relations": "S", "Labor Practices": "S",
    "Product Quality & Safety": "S", "Selling Practices & Product Labeling": "S",
    "Business Ethics": "G", "Business Model Resilience": "G",
    "Competitive Behavior": "G", "Critical Incidence Risk Management": "G",
    "Management of the Legal & Regulatory Environment": "G",
    "Materials Sourcing & Efficiency": "G",
    "Product Design & Lifecycle Management": "G",
    "Physical Impacts of Climate Change": "G",
    "Supply Chain Management": "G", "Systemic Risk Management": "G",
}

PILLAR_COLORS = {"E": "#1d9e75", "S": "#378add", "G": "#ba7517"}
PILLAR_FULL  = {"E": "Environment", "S": "Social", "G": "Governance"}

SCORE_BANDS = [
    (0.75, "#1d9e75", "High materiality"),
    (0.60, "#378add", "Moderate"),
    (0.45, "#ba7517", "Low signal"),
    (0.00, "#aaaaaa", "Minimal"),
]

def score_color(v):
    for threshold, color, _ in SCORE_BANDS:
        if v >= threshold:
            return color
    return "#aaaaaa"

def score_label(v):
    for threshold, _, label in SCORE_BANDS:
        if v >= threshold:
            return label
    return "Minimal"


# ── DATA LOADING ─────────────────────────────────────────────────────────────
def load_data(path):
    df = pd.read_excel(path, skiprows=HEADER_ROW)
    esg_cols = [c for c in df.columns if c in PILLAR_MAP]
    for col in esg_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    # drop companies with no ESG data at all
    df = df[df[esg_cols].count(axis=1) > 0].copy()
    df["Name"] = df["Name"].astype(str).str.strip()
    df["Industry"] = df["Industry"].astype(str).str.strip()
    df["Symbol"] = df["Symbol"].astype(str).str.strip()
    return df, esg_cols


# ── ANALYTICS ────────────────────────────────────────────────────────────────
def top_drivers(row, esg_cols, n=TOP_N_DRIVERS):
    s = row[esg_cols].dropna().sort_values(ascending=False)
    return s.head(n)

def pillar_avg(row, esg_cols):
    avgs = {}
    for p in ["E", "S", "G"]:
        drivers = [c for c in esg_cols if PILLAR_MAP.get(c) == p]
        vals = row[drivers].dropna()
        avgs[p] = vals.mean() if len(vals) else 0
    return avgs


# ── PLOT BUILDERS ─────────────────────────────────────────────────────────────
def build_driver_bar(company_row, industry_avg, esg_cols):
    top = top_drivers(company_row, esg_cols)
    drivers = top.index.tolist()
    scores  = top.values.tolist()
    peers   = [industry_avg.get(d, None) for d in drivers]
    pillars = [PILLAR_MAP.get(d, "G") for d in drivers]
    colors  = [PILLAR_COLORS[p] for p in pillars]

    # shorten long driver names for y-axis
    short = [d.replace(" & ", " & ").replace("Management of the Legal & Regulatory Environment", "Legal & Reg. Env.") for d in drivers]

    fig = go.Figure()

    # company bars
    fig.add_trace(go.Bar(
        x=scores, y=short, orientation="h",
        marker_color=colors, opacity=0.85,
        name="Company score",
        text=[f"{v:.2f}" for v in scores],
        textposition="outside", textfont=dict(size=11),
        hovertemplate="<b>%{y}</b><br>Score: %{x:.3f}<extra></extra>",
    ))

    # peer average markers
    peer_x, peer_y, peer_text = [], [], []
    for i, (d, p) in enumerate(zip(drivers, peers)):
        if p is not None:
            peer_x.append(p)
            peer_y.append(short[i])
            peer_text.append(f"Peer avg: {p:.2f}")

    fig.add_trace(go.Scatter(
        x=peer_x, y=peer_y, mode="markers",
        marker=dict(symbol="line-ns", size=14, color="#555555",
                    line=dict(width=2, color="#555555")),
        name="Sector peer avg",
        hovertemplate="<b>%{y}</b><br>%{text}<extra></extra>",
        text=peer_text,
    ))

    fig.update_layout(
        title=dict(text="Top material ESG drivers", font=dict(size=14), x=0),
        xaxis=dict(range=[0.3, 1.0], title="Materiality score",
                   showgrid=True, gridcolor="#f0f0f0"),
        yaxis=dict(autorange="reversed", tickfont=dict(size=11)),
        plot_bgcolor="white", paper_bgcolor="white",
        legend=dict(orientation="h", y=-0.18, x=0, font=dict(size=11)),
        margin=dict(l=10, r=80, t=40, b=40),
        height=320,
        barmode="overlay",
        shapes=[
            dict(type="line", x0=MATERIALITY_THRESHOLD, x1=MATERIALITY_THRESHOLD,
                 y0=-0.5, y1=len(drivers) - 0.5,
                 line=dict(color="#cc3333", width=1, dash="dot")),
        ],
        annotations=[dict(x=MATERIALITY_THRESHOLD, y=len(drivers) - 0.5,
                          text="materiality<br>threshold", showarrow=False,
                          font=dict(size=9, color="#cc3333"), xanchor="left")],
    )
    return fig


def build_radar(company_row, industry_avg_row, esg_cols):
    categories = ["Environment", "Social", "Governance"]
    pillars = ["E", "S", "G"]
    comp_vals, peer_vals = [], []
    for p in pillars:
        drivers = [c for c in esg_cols if PILLAR_MAP.get(c) == p]
        c_vals = company_row[drivers].dropna()
        comp_vals.append(c_vals.mean() if len(c_vals) else 0)
        if industry_avg_row is not None:
            p_vals = industry_avg_row[drivers].dropna()
            peer_vals.append(p_vals.mean() if len(p_vals) else 0)

    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=peer_vals + [peer_vals[0]], theta=categories + [categories[0]],
        fill="toself", name="Sector peers",
        line=dict(color="#aaaaaa", dash="dot", width=1.5),
        fillcolor="rgba(170,170,170,0.15)",
    ))
    fig.add_trace(go.Scatterpolar(
        r=comp_vals + [comp_vals[0]], theta=categories + [categories[0]],
        fill="toself", name="This company",
        line=dict(color="#378add", width=2),
        fillcolor="rgba(55,138,221,0.18)",
        marker=dict(size=7, color=[PILLAR_COLORS[p] for p in pillars] + [PILLAR_COLORS["E"]]),
    ))
    fig.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0.3, 1.0], tickfont=dict(size=9),
                            gridcolor="#e8e8e8"),
            angularaxis=dict(tickfont=dict(size=12)),
            bgcolor="white",
        ),
        legend=dict(orientation="h", y=-0.12, font=dict(size=11)),
        plot_bgcolor="white", paper_bgcolor="white",
        margin=dict(l=30, r=30, t=30, b=40),
        height=280,
        title=dict(text="E / S / G pillar balance", font=dict(size=14), x=0),
    )
    return fig


def build_peer_gap(company_row, industry_avg, esg_cols):
    top = top_drivers(company_row, esg_cols, n=8)
    rows = []
    for d, v in top.items():
        peer = industry_avg.get(d)
        if peer is not None:
            rows.append({"Driver": d, "Company": v, "Peers": peer, "Gap": v - peer})

    if not rows:
        return go.Figure()

    df_gap = pd.DataFrame(rows).sort_values("Gap")
    colors = ["#1d9e75" if g >= 0 else "#a32d2d" for g in df_gap["Gap"]]
    short = [d.replace("Management of the Legal & Regulatory Environment", "Legal & Reg. Env.") for d in df_gap["Driver"]]

    fig = go.Figure(go.Bar(
        x=df_gap["Gap"], y=short, orientation="h",
        marker_color=colors, opacity=0.8,
        text=[f"{'+' if g >= 0 else ''}{g:.2f}" for g in df_gap["Gap"]],
        textposition="outside",
        textfont=dict(size=10),
        hovertemplate="<b>%{y}</b><br>Gap vs peers: %{x:+.3f}<extra></extra>",
        name="Gap vs sector avg",
    ))
    fig.update_layout(
        title=dict(text="Gap vs sector peer average", font=dict(size=14), x=0),
        xaxis=dict(title="Score gap (positive = above peers)", showgrid=True,
                   gridcolor="#f0f0f0", zeroline=True, zerolinecolor="#333",
                   zerolinewidth=1.5),
        yaxis=dict(autorange="reversed", tickfont=dict(size=11)),
        plot_bgcolor="white", paper_bgcolor="white",
        margin=dict(l=10, r=80, t=40, b=40),
        height=300,
    )
    return fig


def build_heatmap(df, esg_cols, highlight_name=None):
    # use top 25 companies sorted by mean score
    df_sorted = df.copy()
    df_sorted["mean_score"] = df_sorted[esg_cols].mean(axis=1)
    df_sorted = df_sorted.sort_values("mean_score", ascending=False).head(25)

    z = df_sorted[esg_cols].values
    y_labels = df_sorted["Symbol"].tolist()
    x_labels = [c[:18] for c in esg_cols]
    pillar_colors_list = [PILLAR_COLORS[PILLAR_MAP.get(c, "G")] for c in esg_cols]

    # highlight selected company row
    highlight_idx = None
    if highlight_name:
        names = df_sorted["Name"].tolist()
        if highlight_name in names:
            highlight_idx = names.index(highlight_name)

    fig = go.Figure(go.Heatmap(
        z=z, x=x_labels, y=y_labels,
        colorscale=[
            [0.0, "#f5f5f5"],
            [0.2, "#faeeda"],
            [0.45, "#e6f1fb"],
            [0.7, "#e1f5ee"],
            [1.0, "#0a5c42"],
        ],
        zmin=0.35, zmax=1.0,
        text=np.where(np.isnan(z), "", np.round(z, 2).astype(str)),
        texttemplate="%{text}",
        textfont=dict(size=8),
        hoverongaps=False,
        hovertemplate="<b>%{y}</b> · %{x}<br>Score: %{z:.3f}<extra></extra>",
        colorbar=dict(title="Score", thickness=12, len=0.8),
    ))

    # highlight box around selected company
    if highlight_idx is not None:
        fig.add_shape(
            type="rect",
            x0=-0.5, x1=len(esg_cols) - 0.5,
            y0=highlight_idx - 0.5, y1=highlight_idx + 0.5,
            line=dict(color="#cc3333", width=2),
        )

    # pillar separator lines
    e_count = sum(1 for c in esg_cols if PILLAR_MAP.get(c) == "E")
    s_count = sum(1 for c in esg_cols if PILLAR_MAP.get(c) == "S")
    for x_pos, label in [(e_count - 0.5, "← E | S →"), (e_count + s_count - 0.5, "← S | G →")]:
        fig.add_vline(x=x_pos, line_width=1.5, line_color="#555", line_dash="dot")

    fig.update_layout(
        title=dict(text="FTSE 100 ESG materiality heatmap (top 25 by avg score)", font=dict(size=14), x=0),
        xaxis=dict(side="bottom", tickangle=-50, tickfont=dict(size=9)),
        yaxis=dict(tickfont=dict(size=10)),
        plot_bgcolor="white", paper_bgcolor="white",
        margin=dict(l=20, r=20, t=50, b=120),
        height=600,
    )
    return fig


def build_industry_comparison(df, esg_cols, selected_company_row=None):
    ind_avgs = df.groupby("Industry")[esg_cols].mean()
    ind_mean = ind_avgs.mean(axis=1).sort_values(ascending=False)
    colors = ["#378add"] * len(ind_mean)
    if selected_company_row is not None:
        sel_ind = selected_company_row["Industry"]
        if sel_ind in ind_mean.index:
            colors[list(ind_mean.index).index(sel_ind)] = "#1d9e75"

    fig = go.Figure(go.Bar(
        x=ind_mean.values, y=ind_mean.index,
        orientation="h", marker_color=colors, opacity=0.8,
        text=[f"{v:.2f}" for v in ind_mean.values],
        textposition="outside", textfont=dict(size=10),
        hovertemplate="<b>%{y}</b><br>Avg materiality: %{x:.3f}<extra></extra>",
    ))
    fig.update_layout(
        title=dict(text="Average ESG materiality by industry (green = selected)", font=dict(size=14), x=0),
        xaxis=dict(range=[0.4, 0.85], title="Mean materiality score",
                   showgrid=True, gridcolor="#f0f0f0"),
        yaxis=dict(autorange="reversed", tickfont=dict(size=10)),
        plot_bgcolor="white", paper_bgcolor="white",
        margin=dict(l=10, r=80, t=40, b=40),
        height=680,
    )
    return fig


def build_disclosure_table(company_row, industry_avg, esg_cols):
    top = top_drivers(company_row, esg_cols, n=TOP_N_DRIVERS)
    rows = []
    for d, v in top.items():
        p = PILLAR_MAP.get(d, "G")
        peer = industry_avg.get(d)
        gap = (v - peer) if peer else None
        rows.append({
            "Pillar": PILLAR_FULL[p],
            "Driver": d,
            "Score": round(v, 3),
            "Peer avg": round(peer, 3) if peer else "—",
            "Gap": f"{'+' if gap and gap >= 0 else ''}{round(gap, 3)}" if gap is not None else "—",
            "Materiality": score_label(v),
            "CSRD priority": "✓ Report" if v >= MATERIALITY_THRESHOLD else "Consider",
        })
    return pd.DataFrame(rows)


# ── DASH APP ──────────────────────────────────────────────────────────────────
def build_app(df, esg_cols):
    industry_avgs = df.groupby("Industry")[esg_cols].mean()
    companies = df["Name"].sort_values().tolist()
    default_company = "BP Plc" if "BP Plc" in companies else companies[0]

    app = dash.Dash(__name__, title="ESG Materiality · Maxwell FTSE 100")

    # ── STYLES ──
    CARD = {
        "background": "white",
        "border": "1px solid #e8e8e8",
        "borderRadius": "10px",
        "padding": "18px 20px",
        "marginBottom": "16px",
        "boxShadow": "0 1px 4px rgba(0,0,0,0.05)",
    }
    SIDEBAR = {"width": "260px", "minWidth": "260px", "padding": "20px 16px",
               "background": "#fafafa", "borderRight": "1px solid #eee",
               "height": "100vh", "overflowY": "auto", "position": "sticky", "top": 0}

    # ── LAYOUT ──
    app.layout = html.Div([
        # Header
        html.Div([
            html.Div([
                html.Span("Maxwell", style={"color": "#1d9e75", "fontWeight": "600"}),
                html.Span(" · FTSE 100 ESG Materiality Platform",
                          style={"color": "#333", "fontWeight": "500"}),
            ], style={"fontSize": "18px", "marginBottom": "4px"}),
            html.Div("Financially material ESG drivers · March 2025 · "
                     "Source: Jangani, Date & Tucker (2026) + Mettle Capital OSINT",
                     style={"fontSize": "12px", "color": "#888"}),
            html.Div([
                html.Span("● Environment (E)", style={"color": PILLAR_COLORS["E"], "marginRight": "16px", "fontSize": "12px"}),
                html.Span("● Social (S)",       style={"color": PILLAR_COLORS["S"], "marginRight": "16px", "fontSize": "12px"}),
                html.Span("● Governance (G)",   style={"color": PILLAR_COLORS["G"], "fontSize": "12px"}),
            ], style={"marginTop": "8px"}),
        ], style={"background": "white", "padding": "16px 24px",
                  "borderBottom": "1px solid #eee", "position": "sticky",
                  "top": 0, "zIndex": 100}),

        # Body
        html.Div([

            # ── SIDEBAR ──
            html.Div([
                html.Label("Select company", style={"fontSize": "11px", "color": "#888",
                                                     "textTransform": "uppercase",
                                                     "letterSpacing": "0.06em",
                                                     "marginBottom": "6px", "display": "block"}),
                dcc.Dropdown(
                    id="company-selector",
                    options=[{"label": f"{row['Symbol']} — {row['Name']}", "value": row["Name"]}
                             for _, row in df.sort_values("Name").iterrows()],
                    value=default_company,
                    clearable=False,
                    style={"fontSize": "13px", "marginBottom": "16px"},
                ),

                html.Label("Filter by industry", style={"fontSize": "11px", "color": "#888",
                                                          "textTransform": "uppercase",
                                                          "letterSpacing": "0.06em",
                                                          "marginBottom": "6px", "display": "block"}),
                dcc.Dropdown(
                    id="industry-filter",
                    options=[{"label": "All industries", "value": "ALL"}] +
                            [{"label": i, "value": i} for i in sorted(df["Industry"].unique())],
                    value="ALL", clearable=False,
                    style={"fontSize": "12px", "marginBottom": "20px"},
                ),

                html.Div(id="sidebar-company-card"),

                html.Hr(style={"borderColor": "#eee", "margin": "16px 0"}),
                html.Div([
                    html.Div("Score guide", style={"fontSize": "11px", "color": "#888",
                                                    "textTransform": "uppercase",
                                                    "letterSpacing": "0.06em", "marginBottom": "8px"}),
                    *[html.Div([
                        html.Span("●", style={"color": color, "marginRight": "6px"}),
                        html.Span(f"≥{threshold:.2f}  {label}",
                                  style={"fontSize": "12px", "color": "#555"}),
                    ], style={"marginBottom": "5px"})
                      for threshold, color, label in SCORE_BANDS],
                    html.Div("│ = sector peer average",
                             style={"fontSize": "11px", "color": "#888", "marginTop": "10px"}),
                    html.Div("Red dashed = materiality threshold (0.60)",
                             style={"fontSize": "11px", "color": "#cc3333", "marginTop": "4px"}),
                ]),
            ], style=SIDEBAR),

            # ── MAIN CONTENT ──
            html.Div([
                dcc.Tabs(id="main-tabs", value="profile", children=[
                    dcc.Tab(label="Company profile", value="profile"),
                    dcc.Tab(label="Peer gap analysis", value="peer"),
                    dcc.Tab(label="FTSE 100 heatmap", value="heatmap"),
                    dcc.Tab(label="Industry ranking", value="industry"),
                    dcc.Tab(label="Disclosure checklist", value="disclosure"),
                ], style={"marginBottom": "16px"}),

                html.Div(id="tab-content"),
            ], style={"flex": "1", "padding": "20px 24px", "overflowY": "auto",
                      "maxWidth": "1100px"}),

        ], style={"display": "flex", "alignItems": "flex-start",
                  "minHeight": "calc(100vh - 80px)"}),
    ], style={"fontFamily": "'Segoe UI', Arial, sans-serif", "background": "#f7f7f7"})

    # ── CALLBACKS ──────────────────────────────────────────────────────────────

    @app.callback(
        Output("sidebar-company-card", "children"),
        Input("company-selector", "value"),
    )
    def update_sidebar_card(company_name):
        if not company_name:
            return []
        row = df[df["Name"] == company_name].iloc[0]
        pa = pillar_avg(row, esg_cols)
        top = top_drivers(row, esg_cols, n=3)
        ind = row["Industry"]
        peer = industry_avgs.loc[ind] if ind in industry_avgs.index else None

        def metric_box(pillar, val):
            return html.Div([
                html.Div(f"{val:.0%}", style={"fontSize": "18px", "fontWeight": "600",
                                               "color": score_color(val)}),
                html.Div(PILLAR_FULL[pillar][:3],
                         style={"fontSize": "10px", "color": PILLAR_COLORS[pillar]}),
            ], style={"textAlign": "center", "padding": "8px 10px",
                      "borderRadius": "8px", "flex": "1",
                      "background": "#f0f0f0"})

        return html.Div([
            html.Div(row["Name"], style={"fontSize": "13px", "fontWeight": "600",
                                          "color": "#222", "marginBottom": "4px"}),
            html.Div(f"{row['Symbol']} · {ind}",
                     style={"fontSize": "11px", "color": "#888", "marginBottom": "12px"}),
            html.Div([metric_box(p, pa[p]) for p in ["E","S","G"] if pa[p] > 0],
                     style={"display": "flex", "gap": "6px", "marginBottom": "12px"}),
            html.Div("Top drivers:", style={"fontSize": "11px", "color": "#888",
                                             "marginBottom": "5px"}),
            *[html.Div([
                html.Span(PILLAR_MAP.get(d, "G"),
                          style={"fontSize": "10px", "fontWeight": "600",
                                 "color": PILLAR_COLORS[PILLAR_MAP.get(d,"G")],
                                 "marginRight": "5px"}),
                html.Span(d[:22], style={"fontSize": "11px", "color": "#444"}),
                html.Span(f"{v:.2f}", style={"fontSize": "11px",
                                               "color": score_color(v),
                                               "fontWeight": "600",
                                               "float": "right"}),
            ], style={"marginBottom": "4px", "overflow": "hidden"})
              for d, v in top.items()],
        ])

    @app.callback(
        Output("tab-content", "children"),
        Input("main-tabs", "value"),
        Input("company-selector", "value"),
        Input("industry-filter", "value"),
    )
    def update_tab(tab, company_name, industry_filter):
        if not company_name:
            return html.Div("Select a company to begin.", style={"color": "#888"})

        row = df[df["Name"] == company_name].iloc[0]
        ind = row["Industry"]
        ind_avg = industry_avgs.loc[ind].to_dict() if ind in industry_avgs.index else {}

        # filter df for heatmap/industry views
        df_filtered = df if industry_filter == "ALL" else df[df["Industry"] == industry_filter]

        # ── PROFILE TAB ──
        if tab == "profile":
            fig_bar   = build_driver_bar(row, ind_avg, esg_cols)
            fig_radar = build_radar(row, industry_avgs.loc[ind] if ind in industry_avgs.index else None, esg_cols)

            # stat cards
            top = top_drivers(row, esg_cols)
            n_material = sum(1 for v in top.values if v >= MATERIALITY_THRESHOLD)
            mean_score = row[esg_cols].dropna().mean()
            pa = pillar_avg(row, esg_cols)
            strongest_p = max(pa, key=pa.get)

            stat_style = {**CARD, "textAlign": "center", "flex": "1", "marginBottom": 0}

            return html.Div([
                # stat row
                html.Div([
                    html.Div([
                        html.Div(f"{mean_score:.2f}", style={"fontSize": "28px", "fontWeight": "600",
                                                               "color": score_color(mean_score)}),
                        html.Div("Mean score", style={"fontSize": "11px", "color": "#888"}),
                    ], style=stat_style),
                    html.Div([
                        html.Div(str(n_material), style={"fontSize": "28px", "fontWeight": "600",
                                                          "color": "#378add"}),
                        html.Div(f"Material drivers (≥{MATERIALITY_THRESHOLD})", style={"fontSize": "11px", "color": "#888"}),
                    ], style=stat_style),
                    html.Div([
                        html.Div(len(top), style={"fontSize": "28px", "fontWeight": "600",
                                                     "color": "#444"}),
                        html.Div("Active drivers", style={"fontSize": "11px", "color": "#888"}),
                    ], style=stat_style),
                    html.Div([
                        html.Div(PILLAR_FULL[strongest_p],
                                 style={"fontSize": "20px", "fontWeight": "600",
                                        "color": PILLAR_COLORS[strongest_p]}),
                        html.Div("Strongest pillar", style={"fontSize": "11px", "color": "#888"}),
                    ], style=stat_style),
                ], style={"display": "flex", "gap": "12px", "marginBottom": "16px"}),

                # charts row
                html.Div([
                    html.Div(dcc.Graph(figure=fig_bar, config={"displayModeBar": False}),
                             style={**CARD, "flex": "1.6"}),
                    html.Div(dcc.Graph(figure=fig_radar, config={"displayModeBar": False}),
                             style={**CARD, "flex": "1"}),
                ], style={"display": "flex", "gap": "16px"}),

                # context blurb
                html.Div([
                    html.Div("How to read this:", style={"fontSize": "12px", "fontWeight": "600",
                                                          "color": "#555", "marginBottom": "6px"}),
                    html.Div(
                        "Scores are Polarity-Based Sentiment (PBS) values from Mettle Capital's OSINT pipeline, "
                        "ranging from 0.355 (low signal) to 0.983 (highest materiality). "
                        "Scores above 0.60 indicate the market consistently links this ESG driver to financial "
                        "performance. The vertical tick on each bar shows your sector's peer average — "
                        "a gap above it is a competitive ESG strength; below is a disclosure risk.",
                        style={"fontSize": "12px", "color": "#777", "lineHeight": "1.6"}),
                ], style={**CARD, "background": "#fafff8", "borderLeft": "3px solid #1d9e75"}),
            ])

        # ── PEER GAP TAB ──
        elif tab == "peer":
            fig_gap = build_peer_gap(row, ind_avg, esg_cols)
            top = top_drivers(row, esg_cols)

            rows_html = []
            for d, v in top.items():
                peer = ind_avg.get(d)
                gap = v - peer if peer else None
                p = PILLAR_MAP.get(d, "G")
                rows_html.append(html.Tr([
                    html.Td(html.Span(PILLAR_FULL[p],
                                     style={"color": PILLAR_COLORS[p], "fontWeight": "600",
                                            "fontSize": "11px"}), style={"padding": "8px 10px"}),
                    html.Td(d, style={"padding": "8px 10px", "fontSize": "12px"}),
                    html.Td(f"{v:.3f}", style={"padding": "8px 10px", "textAlign": "right",
                                                "fontWeight": "600", "color": score_color(v)}),
                    html.Td(f"{peer:.3f}" if peer else "—", style={"padding": "8px 10px",
                                                                     "textAlign": "right", "color": "#888"}),
                    html.Td(
                        html.Span(f"{'+' if gap and gap >= 0 else ''}{gap:.3f}" if gap else "—",
                                  style={"color": "#1d9e75" if gap and gap >= 0 else "#a32d2d",
                                         "fontWeight": "600"}),
                        style={"padding": "8px 10px", "textAlign": "right"}),
                    html.Td(score_label(v), style={"padding": "8px 10px", "fontSize": "11px",
                                                    "color": score_color(v)}),
                ]))

            table = html.Table([
                html.Thead(html.Tr([
                    html.Th(h, style={"padding": "8px 10px", "textAlign": "left" if i < 2 else "right",
                                      "fontSize": "11px", "color": "#888",
                                      "borderBottom": "1px solid #eee",
                                      "background": "#f9f9f9"})
                    for i, h in enumerate(["Pillar","Driver","Company","Peer avg","Gap","Signal"])
                ])),
                html.Tbody(rows_html),
            ], style={"width": "100%", "borderCollapse": "collapse",
                      "fontSize": "13px", "background": "white"})

            return html.Div([
                html.Div(dcc.Graph(figure=fig_gap, config={"displayModeBar": False}),
                         style=CARD),
                html.Div([
                    html.Div("Detailed driver comparison", style={"fontSize": "13px",
                                                                   "fontWeight": "600",
                                                                   "marginBottom": "12px"}),
                    table,
                ], style=CARD),
            ])

        # ── HEATMAP TAB ──
        elif tab == "heatmap":
            fig_hm = build_heatmap(df_filtered, esg_cols, highlight_name=company_name)
            return html.Div([
                html.Div(dcc.Graph(figure=fig_hm, config={"displayModeBar": True}),
                         style=CARD),
                html.Div("Red outline = selected company. Green = high materiality (≥0.75), "
                         "Blue = moderate, Amber = low signal. Grey = minimal / no data. "
                         "Dashed verticals separate E | S | G pillars.",
                         style={"fontSize": "12px", "color": "#777", "marginTop": "8px"}),
            ])

        # ── INDUSTRY TAB ──
        elif tab == "industry":
            fig_ind = build_industry_comparison(df_filtered, esg_cols, selected_company_row=row)
            return html.Div(dcc.Graph(figure=fig_ind, config={"displayModeBar": False}),
                            style=CARD)

        # ── DISCLOSURE TAB ──
        elif tab == "disclosure":
            disc_df = build_disclosure_table(row, ind_avg, esg_cols)
            rows_html = []
            for _, r in disc_df.iterrows():
                csrd_color = "#1d9e75" if r["CSRD priority"] == "✓ Report" else "#ba7517"
                p = r["Pillar"][:3].upper()
                pc = PILLAR_COLORS.get({"ENV": "E", "SOC": "S", "GOV": "G"}.get(p[:3], "G"), "#888")
                rows_html.append(html.Tr([
                    html.Td(html.Span(r["Pillar"], style={"color": PILLAR_COLORS.get({"Environment":"E","Social":"S","Governance":"G"}.get(r["Pillar"],"G"), "#888"), "fontWeight": "600", "fontSize": "11px"}), style={"padding": "10px 12px"}),
                    html.Td(r["Driver"], style={"padding": "10px 12px", "fontSize": "13px"}),
                    html.Td(str(r["Score"]), style={"padding": "10px 12px", "textAlign": "right", "fontWeight": "600", "color": score_color(r["Score"])}),
                    html.Td(str(r["Peer avg"]), style={"padding": "10px 12px", "textAlign": "right", "color": "#888"}),
                    html.Td(str(r["Gap"]), style={"padding": "10px 12px", "textAlign": "right", "fontWeight": "600", "color": "#1d9e75" if "+" in str(r["Gap"]) else "#a32d2d"}),
                    html.Td(html.Span(r["CSRD priority"], style={"color": csrd_color, "fontWeight": "600", "fontSize": "12px"}), style={"padding": "10px 12px", "textAlign": "center"}),
                ], style={"borderBottom": "1px solid #f0f0f0"}))

            return html.Div([
                html.Div([
                    html.Div(f"Disclosure readiness — {company_name}",
                             style={"fontSize": "15px", "fontWeight": "600", "marginBottom": "6px"}),
                    html.Div(
                        "Based on the two-stage materiality pipeline (Mutual Information + Random Forest) from "
                        "Jangani, Date & Tucker (2026). Drivers scoring ≥0.60 are recommended for CSRD/ISSB "
                        "mandatory disclosure as financially material sustainability factors.",
                        style={"fontSize": "12px", "color": "#777", "marginBottom": "16px", "lineHeight": "1.6"}),
                    html.Table([
                        html.Thead(html.Tr([
                            html.Th(h, style={"padding": "10px 12px", "textAlign": "left" if i < 2 else "right" if i < 5 else "center",
                                              "fontSize": "11px", "color": "#888",
                                              "borderBottom": "2px solid #eee",
                                              "background": "#f9f9f9"})
                            for i, h in enumerate(["Pillar","Driver","Score","Peer avg","Gap vs peers","CSRD action"])
                        ])),
                        html.Tbody(rows_html),
                    ], style={"width": "100%", "borderCollapse": "collapse"}),
                    html.Div([
                        html.Div("✓ Report", style={"color": "#1d9e75", "fontWeight": "600",
                                                     "display": "inline", "marginRight": "8px"}),
                        html.Span("= score ≥ 0.60, CSRD/ISSB priority disclosure  ",
                                  style={"color": "#555", "fontSize": "12px"}),
                        html.Div("Consider", style={"color": "#ba7517", "fontWeight": "600",
                                                     "display": "inline", "marginRight": "8px",
                                                     "marginLeft": "16px"}),
                        html.Span("= score < 0.60, include if peer exposure is high",
                                  style={"color": "#555", "fontSize": "12px"}),
                    ], style={"marginTop": "16px"}),
                ], style=CARD),
            ])

        return html.Div("Select a tab.")

    return app


# ── ENTRY POINT ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ESG Materiality Dashboard")
    parser.add_argument("--file", default=EXCEL_FILE,
                        help="Path to the FTSE100 Excel file")
    parser.add_argument("--port", type=int, default=8050)
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    excel_path = args.file
    if not os.path.isabs(excel_path):
        excel_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), excel_path)

    if not os.path.exists(excel_path):
        print(f"\n  ✗  Excel file not found: {excel_path}")
        print(f"     Put the Excel file in the same folder as this script,")
        print(f"     or pass the path with --file path/to/your_file.xlsx\n")
        sys.exit(1)

    print(f"\n  Loading: {excel_path}")
    df, esg_cols = load_data(excel_path)
    print(f"  Loaded {len(df)} companies · {len(esg_cols)} ESG drivers · "
          f"{df['Industry'].nunique()} industries\n")

    app = build_app(df, esg_cols)
    print(f"  Dashboard running at  http://127.0.0.1:{args.port}\n")
    app.run(debug=args.debug, port=args.port)
