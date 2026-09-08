import type { Audience, Horizon, ToolId } from '../types';

export interface ToolDefinition {
  id: ToolId;
  label: string;
  description: string;
  requiresCompany?: boolean;
}

export interface ToolPreset {
  key: string;
  toolId: ToolId;
  label: string;
  description: string;
  audience: Audience;
  horizon: Horizon;
}

export const TOOL_DEFINITIONS: Record<ToolId, ToolDefinition> = {
  three_body_compare: {
    id: 'three_body_compare',
    label: 'Analyze',
    description: 'Company vs peers vs FTSE100 benchmark',
    requiresCompany: true,
  },
  scan_peers: {
    id: 'scan_peers',
    label: 'Compare peers',
    description: 'Find sector companies with a similar pattern',
    requiresCompany: true,
  },
  conviction_rank: {
    id: 'conviction_rank',
    label: 'Investor view',
    description: 'Conviction heatmap per materiality driver',
    requiresCompany: true,
  },
  forward_signal: {
    id: 'forward_signal',
    label: 'Forward signal',
    description: '3-month or 12-month forward trend signals',
    requiresCompany: true,
  },
  divergence_narrative: {
    id: 'divergence_narrative',
    label: 'Divergence narrative',
    description: 'Audience-specific key question and pattern labels',
    requiresCompany: true,
  },
  export_brief: {
    id: 'export_brief',
    label: 'Export brief',
    description: 'Download pinned panels and key question as PDF',
    requiresCompany: false,
  },
};

export const TOOLBAR_ITEMS: Array<{
  toolId: ToolId;
  label: string;
  description: string;
}> = [
  {
    toolId: 'three_body_compare',
    label: 'Analyze',
    description: TOOL_DEFINITIONS.three_body_compare.description,
  },
  {
    toolId: 'scan_peers',
    label: 'Compare peers',
    description: TOOL_DEFINITIONS.scan_peers.description,
  },
  {
    toolId: 'conviction_rank',
    label: 'Investor view',
    description: TOOL_DEFINITIONS.conviction_rank.description,
  },
  {
    toolId: 'forward_signal',
    label: 'Auditor 12mo',
    description: '12-month forward signal · auditor lens',
  },
  {
    toolId: 'export_brief',
    label: 'Export brief',
    description: TOOL_DEFINITIONS.export_brief.description,
  },
];

export const TOOLBAR_TOOLS: ToolId[] = TOOLBAR_ITEMS.map((item) => item.toolId);

export const TOOL_PRESETS: ToolPreset[] = [
  {
    key: 'investor-3',
    toolId: 'divergence_narrative',
    label: 'Investor · 3mo',
    description: 'Short-horizon conviction signals',
    audience: 'investor',
    horizon: 3,
  },
  {
    key: 'investor-12',
    toolId: 'divergence_narrative',
    label: 'Investor · 12mo',
    description: 'Annual investor materiality view',
    audience: 'investor',
    horizon: 12,
  },
  {
    key: 'auditor-3',
    toolId: 'divergence_narrative',
    label: 'Auditor · 3mo',
    description: 'Near-term audit risk focus',
    audience: 'auditor',
    horizon: 3,
  },
  {
    key: 'auditor-12',
    toolId: 'divergence_narrative',
    label: 'Auditor · 12mo',
    description: 'Full-cycle assurance lens',
    audience: 'auditor',
    horizon: 12,
  },
];

export function getToolPreset(key: string): ToolPreset {
  return TOOL_PRESETS.find((preset) => preset.key === key) ?? TOOL_PRESETS[0];
}
