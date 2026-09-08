import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PanelSpec } from '../../types';
import styles from './Panels.module.css';

function MaterialityBars({
  title,
  data,
}: Extract<PanelSpec, { type: 'materiality_bars' }>) {
  const chartData = data.items.map((item) => ({
    name: item.driver.length > 22 ? `${item.driver.slice(0, 20)}…` : item.driver,
    score: item.score,
    full: item.driver,
  }));

  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>{title}</h3>
      <div className={styles.chartBox}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number' ? value.toFixed(2) : String(value ?? '')
              }
              labelFormatter={(_, payload) => payload?.[0]?.payload?.full as string}
            />
            <Bar dataKey="score" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ThreeBodyTable({
  title,
  data,
}: Extract<PanelSpec, { type: 'three_body_table' }>) {
  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>{title}</h3>
      <p className={styles.meta}>
        {data.company} · {data.industry} · {data.peerCount} peers
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Company</th>
              <th>Peers</th>
              <th>FTSE100</th>
              <th>Δ peer</th>
              <th>Pattern</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.driver}>
                <td>{row.driver}</td>
                <td>{row.company?.toFixed(2) ?? '—'}</td>
                <td>{row.peer.toFixed(2)}</td>
                <td>{row.benchmark.toFixed(2)}</td>
                <td className={row.deltaPeer >= 0.1 ? styles.pos : styles.neu}>
                  {row.deltaPeer >= 0 ? '+' : ''}
                  {row.deltaPeer.toFixed(2)}
                </td>
                <td>
                  <span className={styles.pattern}>{row.pattern}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ConvictionHeatmap({
  title,
  data,
}: Extract<PanelSpec, { type: 'conviction_heatmap' }>) {
  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>{title}</h3>
      <div className={styles.convictionGrid}>
        {data.rows.map((row) => (
          <div key={row.driver} className={styles.convictionRow}>
            <span className={styles.convictionDriver}>{row.driver}</span>
            <span className={`${styles.badge} ${styles[`tier${row.conviction}`]}`}>
              {row.conviction}
            </span>
            <span className={styles.signal}>{row.forwardSignal}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ForwardTimeline({
  title,
  data,
}: Extract<PanelSpec, { type: 'forward_timeline' }>) {
  const chartData = data.labels
    .map((label, idx) => ({
      label,
      value: data.values[idx],
    }))
    .filter((point) => point.label && point.value != null) as Array<{
    label: string;
    value: number;
  }>;

  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>{title}</h3>
      <p className={styles.meta}>
        Focus: {data.driver} · Signal: <strong>{data.signal}</strong>
      </p>
      <div className={styles.chartBox}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number' ? value.toFixed(2) : String(value ?? '')
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0f766e"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 4, fill: '#0f766e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className={styles.disclaimer}>{data.disclaimer}</p>
    </section>
  );
}

function InvestigateCard({
  title,
  data,
}: Extract<PanelSpec, { type: 'investigate_card' }>) {
  return (
    <section className={`${styles.panel} ${styles.investigate}`}>
      <h3 className={styles.panelTitle}>{title}</h3>
      <p className={styles.investigateMeta}>
        {data.audience} · {data.horizon}mo · {data.focusDriver} · {data.pattern}
      </p>
      <blockquote className={styles.keyQuestion}>{data.question}</blockquote>
    </section>
  );
}

function PeerScanTable({
  title,
  data,
}: Extract<PanelSpec, { type: 'peer_scan_table' }>) {
  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>{title}</h3>
      <p className={styles.meta}>
        {data.industry} · focus driver: {data.focusDriver}
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Peer (workbook)</th>
              <th>Score</th>
              <th>Sector avg</th>
              <th>Pattern</th>
            </tr>
          </thead>
          <tbody>
            {data.peers.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.meta}>
                  No other {data.industry} names share this pattern on {data.focusDriver} in the
                  workbook.
                </td>
              </tr>
            ) : (
              data.peers.map((row) => (
                <tr key={row.companyName}>
                  <td>{row.companyName}</td>
                  <td>{row.score?.toFixed(2) ?? '—'}</td>
                  <td>{row.peerAvg.toFixed(2)}</td>
                  <td>{row.pattern}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const REGISTRY: Record<PanelSpec['type'], (panel: PanelSpec) => React.ReactNode> = {
  materiality_bars: (p) => <MaterialityBars {...(p as Extract<PanelSpec, { type: 'materiality_bars' }>)} />,
  three_body_table: (p) => <ThreeBodyTable {...(p as Extract<PanelSpec, { type: 'three_body_table' }>)} />,
  conviction_heatmap: (p) => <ConvictionHeatmap {...(p as Extract<PanelSpec, { type: 'conviction_heatmap' }>)} />,
  forward_timeline: (p) => <ForwardTimeline {...(p as Extract<PanelSpec, { type: 'forward_timeline' }>)} />,
  investigate_card: (p) => <InvestigateCard {...(p as Extract<PanelSpec, { type: 'investigate_card' }>)} />,
  peer_scan_table: (p) => <PeerScanTable {...(p as Extract<PanelSpec, { type: 'peer_scan_table' }>)} />,
};

export function DynamicPanelRenderer({ panels }: { panels: PanelSpec[] }) {
  return (
    <div className={styles.stack}>
      {panels.map((panel, idx) => (
        <div key={`${panel.type}-${idx}`} className={styles.panelWrap}>
          {REGISTRY[panel.type]?.(panel)}
        </div>
      ))}
    </div>
  );
}
