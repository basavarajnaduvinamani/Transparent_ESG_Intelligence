import type { AnalysisBundle } from './divergence.js';
import type { PanelSpec, ToolId } from '../types.js';

export function composeInvestorPanels(analysis: AnalysisBundle): PanelSpec[] {
  const topBars = analysis.drivers
    .filter((d) => d.companyScore != null)
    .slice(0, 8)
    .map((d) => ({
      driver: d.driver,
      score: d.companyScore as number,
      pillar: d.pillar,
    }));

  return [
    {
      type: 'materiality_bars',
      title: `${analysis.companyName} — top material drivers (now)`,
      data: { items: topBars },
    },
    {
      type: 'three_body_table',
      title: 'Three-body comparison — company · peers · benchmark',
      data: {
        company: analysis.companyName,
        industry: analysis.industry,
        peerCount: analysis.peerCount,
        rows: analysis.drivers.map((d) => ({
          driver: d.driver,
          company: d.companyScore,
          peer: d.peerAvg,
          benchmark: d.benchmarkAvg,
          deltaPeer: d.deltaPeer,
          deltaBench: d.deltaBench,
          pattern: d.pattern,
        })),
      },
    },
    {
      type: 'conviction_heatmap',
      title: 'Investor conviction ranking',
      data: {
        rows: analysis.drivers.map((d) => ({
          driver: d.driver,
          conviction: d.conviction,
          forwardSignal: d.forwardSignal,
        })),
      },
    },
    {
      type: 'forward_timeline',
      title: `Quarterly watch signal (${analysis.horizon}mo · synthesised)`,
      data: {
        driver: analysis.focusDriver.driver,
        labels: ['Now', '+3mo', analysis.horizon === 12 ? '+12mo' : ''],
        values: analysis.focusDriver.trend,
        signal: analysis.focusDriver.forwardSignal,
        disclaimer:
          'Derived from March 2025 workbook scores only — rule-based direction, not a forecast',
      },
    },
    {
      type: 'investigate_card',
      title: 'Key question for investor',
      data: {
        audience: analysis.audience,
        horizon: analysis.horizon,
        question: analysis.keyQuestion,
        focusDriver: analysis.focusDriver.driver,
        pattern: analysis.focusDriver.pattern,
      },
    },
  ];
}

export function composeToolPanels(toolId: ToolId, analysis: AnalysisBundle): PanelSpec[] {
  switch (toolId) {
    case 'three_body_compare':
      return composeInvestorPanels(analysis).filter((p) =>
        ['materiality_bars', 'three_body_table', 'investigate_card'].includes(p.type),
      );
    case 'scan_peers':
      return [
        composeInvestorPanels(analysis).find((p) => p.type === 'three_body_table')!,
        {
          type: 'peer_scan_table',
          title: 'Peers with same pattern (workbook only)',
          data: {
            industry: analysis.industry,
            focusDriver: analysis.focusDriver.driver,
            peers: analysis.industryPeers.map((peer) => ({
              companyName: peer.companyName,
              score: peer.score,
              peerAvg: peer.peerAvg,
              pattern: peer.pattern,
            })),
          },
        },
        composeInvestorPanels(analysis).find((p) => p.type === 'investigate_card')!,
      ];
    case 'conviction_rank':
      return composeInvestorPanels(analysis).filter((p) =>
        ['conviction_heatmap', 'investigate_card'].includes(p.type),
      );
    case 'forward_signal':
      return composeInvestorPanels(analysis).filter((p) =>
        ['forward_timeline', 'investigate_card'].includes(p.type),
      );
    case 'divergence_narrative':
      return composeInvestorPanels(analysis).filter((p) => p.type === 'investigate_card');
    default:
      return [];
  }
}
