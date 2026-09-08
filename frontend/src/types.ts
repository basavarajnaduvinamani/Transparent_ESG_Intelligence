export type Audience = 'investor' | 'auditor';
export type Horizon = 3 | 12;

export type ToolId =
  | 'three_body_compare'
  | 'scan_peers'
  | 'conviction_rank'
  | 'forward_signal'
  | 'divergence_narrative'
  | 'export_brief';

export type PanelType =
  | 'materiality_bars'
  | 'three_body_table'
  | 'conviction_heatmap'
  | 'forward_timeline'
  | 'investigate_card'
  | 'peer_scan_table';

export interface MaterialityBarsPanel {
  type: 'materiality_bars';
  title: string;
  data: {
    items: Array<{ driver: string; score: number; pillar: string }>;
  };
}

export interface ThreeBodyTablePanel {
  type: 'three_body_table';
  title: string;
  data: {
    company: string;
    industry: string;
    peerCount: number;
    rows: Array<{
      driver: string;
      company: number | null;
      peer: number;
      benchmark: number;
      deltaPeer: number;
      deltaBench: number;
      pattern: string;
    }>;
  };
}

export interface ConvictionHeatmapPanel {
  type: 'conviction_heatmap';
  title: string;
  data: {
    rows: Array<{
      driver: string;
      conviction: string;
      forwardSignal: string;
    }>;
  };
}

export interface ForwardTimelinePanel {
  type: 'forward_timeline';
  title: string;
  data: {
    driver: string;
    labels: string[];
    values: Array<number | null>;
    signal: string;
    disclaimer: string;
  };
}

export interface InvestigateCardPanel {
  type: 'investigate_card';
  title: string;
  data: {
    audience: Audience;
    horizon: Horizon;
    question: string;
    focusDriver: string;
    pattern: string;
  };
}

export interface PeerScanTablePanel {
  type: 'peer_scan_table';
  title: string;
  data: {
    industry: string;
    focusDriver: string;
    peers: Array<{
      companyName: string;
      score: number | null;
      peerAvg: number;
      pattern: string;
    }>;
  };
}

export type PanelSpec =
  | MaterialityBarsPanel
  | ThreeBodyTablePanel
  | ConvictionHeatmapPanel
  | ForwardTimelinePanel
  | InvestigateCardPanel
  | PeerScanTablePanel;

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolId?: ToolId;
  toolLabel?: string;
  panels?: PanelSpec[];
  agentSteps?: string[];
  suggestedChips?: string[];
  keyQuestion?: string;
}

export interface ToolPreset {
  key: string;
  toolId: ToolId;
  label: string;
  description: string;
  audience: Audience;
  horizon: Horizon;
}
