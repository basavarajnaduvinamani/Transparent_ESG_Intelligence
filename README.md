# Transparent ESG Intelligence: Multi-Agent Materiality & Sustainability Analytics

[![Competition Winner](https://img.shields.io/badge/Award-Winner%20%7C%20Maxwell%20Data%20Challenge-gold.svg)](https://www.imperial.ac.uk/)
[![Institution](https://img.shields.io/badge/Institution-Imperial%20College%20London-blue.svg)](https://www.imperial.ac.uk/)
[![Network](https://img.shields.io/badge/Sponsored%20by-UKFin%2B%20Network-purple.svg)](https://ukfinplus.org/)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Node.js%20%7C%20Python-61DAFB.svg)](#)
[![License](https://img.shields.io/badge/License-Academic%20Research-green.svg)](#)

A multi-agent quantitative ESG evaluation engine developed for the **Maxwell Data Challenge at Imperial College London** (supported by the **UKFin+ Network**). 

Transparent ESG Intelligence bridges the gap between opaque corporate sustainability narratives and verifiable financial materiality. By employing an orchestrated multi-agent AI architecture, the system systematically audits FTSE 100 corporate disclosures, detects greenwashing divergence, and generates evidence-grounded sustainability scores.

---

> [!IMPORTANT]
> ### 🔒 Confidentiality & Non-Disclosure Notice (NDA)
> **Please Note:** A formal **Non-Disclosure Agreement (NDA)** has been executed governing proprietary valuation models, private institutional benchmarks, and internal corporate datasets utilized in this competition. Consequently, specific proprietary weights, production API keys, and commercial financial data have been omitted or sanitized in this public repository.
> 
> For authorized evaluation inquiries, academic discussions, or verification, please **contact the author directly**.

---

## 🏛️ System Architecture

```text
                               ┌─────────────────────────────────────────┐
                               │        Corporate Filings & Reports      │
                               │        (FTSE 100 Annual Disclosures)    │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │       Multi-Agent Chat Orchestrator     │
                               │        (Node.js / TypeScript API)       │
                               └─────────┬───────────────────┬───────────┘
                                         │                   │
                     ┌───────────────────┴──┐             ┌──┴───────────────────┐
                     ▼                      ▼             ▼                      ▼
           ┌──────────────────┐   ┌──────────────────┐  ┌──────────────────┐   ┌──────────────────┐
           │ Divergence Engine│   │Three-Body Engine │  │Forward Signal Ag.│   │ Conviction Engine│
           ├──────────────────┤   ├──────────────────┤  ├──────────────────┤   ├──────────────────┤
           │ Identifies gaps  │   │ Triangulates     │  │ Evaluates future │   │ Analyzes board   │
           │ between claims & │   │ Corporate Claim, │  │ capital targets  │   │ commitments vs   │
           │ baseline metrics │   │ Peer Benchmark & │  │ vs historic KPIs │   │ vague rhetoric   │
           │                  │   │ Financial Reality│  │                  │   │                  │
           └─────────┬────────┘   └─────────┬────────┘  └────────┬─────────┘   └────────┬─────────┘
                     │                      │                    │                      │
                     └──────────────────────┼────────────────────┴──────────────────────┘
                                            ▼
                               ┌─────────────────────────────────────────┐
                               │       Evidence Provenance Resolver      │
                               │  (Source paragraph anchors & grounding) │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │       Clinician / Analyst Portal        │
                               │    (React + TypeScript + Tailwind UI)   │
                               └─────────────────────────────────────────┘
```

---

## 💡 Key Analytical Frameworks

### 1. The "Three-Body Problem" of ESG
Traditional ESG ratings evaluate company disclosures in a vacuum. Transparent ESG Intelligence models corporate sustainability as a **three-body interaction**:
1. **Self-Reported Narrative:** Qualitative corporate ESG disclosures and commitments.
2. **Peer Benchmark Baseline:** Sector-wide materiality norms across FTSE 100 constituents.
3. **Audited Financial Realities:** Capex allocations, emissions intensity, and verifiable financial metrics.

### 2. Forward Signal & Conviction Analysis
- Evaluates whether forward-looking climate transition plans contain quantitative capital expenditure (CapEx) backing or mere aspirational prose.
- Automatically calculates an evidence-grounded **Conviction Index** to flag ambiguous claims requiring human analyst scrutiny.

### 3. Strict Evidence Grounding (Anti-Hallucination)
- Every insight surfaces qualitative source excerpts, section references, and metric provenance to ensure 100% auditability for portfolio managers and regulators.

---

## 📁 Repository Structure

```text
Transparent_ESG_Intelligence/
├── frontend/                        # Modern React + TypeScript + Vite web interface
│   ├── src/                         # Analytics views, interactive charts, and panels
│   ├── package.json                 # Frontend dependencies
│   └── vite.config.ts               # Vite configuration
│
├── backend/                         # Node.js + TypeScript multi-agent orchestration backend
│   ├── src/
│   │   ├── orchestrator/            # Multi-agent chat orchestrator & intent resolver
│   │   ├── analysis/                # Divergence, Three-Body, and Conviction engines
│   │   ├── gemini/                  # LLM prose agent integration & grounding
│   │   ├── routes/                  # Express REST API endpoints (companies, chat, tools)
│   │   └── services/                # Company context & retrieval services
│   ├── data/                        # Peer benchmarks, taxonomy, and company metadata
│   ├── tsconfig.json                # TypeScript compiler configuration
│   └── package.json                 # Backend dependencies
│
├── dashboard/                       # Interactive Streamlit analytics dashboard
│   └── esg_dashboard.py             # Python-based multi-metric exploration application
│
├── docs/                            # Competition challenge reports and presentations
│   ├── BHX_Quant_Redesign.pptx      # Official challenge presentation deck
│   ├── UKFin_problem_selection.pdf  # UKFin+ Challenge brief & guidelines
│   ├── ESG_framework_overview.pdf   # Theoretical framework documentation
│   └── Maxwell_challenge_report.pdf # Technical evaluation report
│
├── data/                            # Curated FTSE 100 materiality matrices and projections
│   ├── FTSE100 financial materiality March 2025.xlsx
│   ├── NEW FTSE100 financial materiality March 2025.xlsx
│   └── projections.xlsx
│
├── .gitignore                       # Clean environment and build exclusions
└── README.md                        # Project documentation & NDA notice
```

---

## ⚡ Quick Start Guide

### 1. Backend Orchestrator Setup (Node.js & TypeScript)

```bash
cd backend
npm install
npm run dev
```
The API orchestrator will start on `http://localhost:3000`.

### 2. Frontend Analyst Portal Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to explore corporate profiles, divergence signals, and agent insights.

### 3. Standalone Python Analytics Dashboard

```bash
# Set up Python environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

pip install streamlit pandas openpyxl plotly

# Run the Streamlit dashboard
cd dashboard
streamlit run esg_dashboard.py
```

---

## 🏆 Competition Honors

- **Winner, Maxwell Data Challenge (2026)**
- Organized by **Imperial College London** and backed by the **UKFin+ Network**.
- Evaluated on mathematical rigor, explainability, multi-agent system design, and practical financial utility.

---

## 👨‍💻 Author

**Basavaraj A Naduvinamani**  
- **Academic:** Joint M.S. in Data Science and Artificial Intelligence — *IIT Madras & University of Birmingham*  
- **Undergraduate:** B.Tech. in Computer Science Engineering — *Dayananda Sagar University*  
- **Profiles:** [LinkedIn](https://linkedin.com/in/basavarajnaduvinamani) • [GitHub](https://github.com/basavarajnaduvinamani)

---

## 📬 Inquiries & Collaboration
Due to the active Non-Disclosure Agreement (NDA), private demonstrations and detailed methodology walk-throughs are available upon request. Please connect via [LinkedIn](https://linkedin.com/in/basavarajnaduvinamani) or email `da25c005@smail.iitm.ac.in`.
