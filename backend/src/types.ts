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

export interface CompanyRecord {
  id: number;
  name: string;
  symbol: string;
  wikipedia: string;
  industry: string;
  drivers: Record<string, number | null>;
}

export interface PeerBenchmarkRecord {
  peerAvg: Record<string, number>;
  benchmarkAvg: Record<string, number>;
  peerCount: number;
}

export interface DatasetManifest {
  sourceFile: string;
  sheetName: string;
  snapshotLabel: string;
  coveragePeriod: string;
  provider: string;
  universe: string;
  companyCount: number;
  driverCount: number;
  industries: number;
  generatedAt: string;
}

export interface TaxonomyEntry {
  col: number;
  driver: string;
  pillar: string;
}

export interface ChatContext {
  companyName?: string;
  audience?: Audience;
  horizon?: Horizon;
  activeToolKey?: string;
}

export interface AssistantTurnPayload {
  messageId: string;
  content: string;
  keyQuestion?: string;
  panels?: PanelSpec[];
  agentSteps?: string[];
  suggestedChips?: string[];
  activeCompany?: string;
}

export type SseEventType =
  | 'agent_step'
  | 'panels'
  | 'text_delta'
  | 'key_question'
  | 'chips'
  | 'context'
  | 'done'
  | 'error';

export interface SseEvent {
  type: SseEventType;
  data: Record<string, unknown>;
}
