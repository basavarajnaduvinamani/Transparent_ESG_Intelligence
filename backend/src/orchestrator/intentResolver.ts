import type { Audience, Horizon } from '../types.js';
import type { DataStore } from '../dataStore.js';
import type { CompanyRecord } from '../types.js';
import { requireCompany } from '../services/companyContext.js';

export type AnalyzeIntent = {
  kind: 'analyze';
  company: CompanyRecord;
  audience: Audience;
  horizon: Horizon;
};

export type CompanyRequiredIntent = {
  kind: 'company_required';
};

export type InvalidCompanyIntent = {
  kind: 'invalid_company';
  name: string;
};

export type ResolvedIntent =
  | AnalyzeIntent
  | CompanyRequiredIntent
  | InvalidCompanyIntent;

const TOOL_PRESET_MAP: Record<string, { audience: Audience; horizon: Horizon }> = {
  'investor-3': { audience: 'investor', horizon: 3 },
  'investor-12': { audience: 'investor', horizon: 12 },
  'auditor-3': { audience: 'auditor', horizon: 3 },
  'auditor-12': { audience: 'auditor', horizon: 12 },
};

export function resolveIntent(
  store: DataStore,
  message: string,
  context?: {
    companyName?: string;
    audience?: Audience;
    horizon?: Horizon;
    activeToolKey?: string;
  },
): ResolvedIntent {
  const trimmed = context?.companyName?.trim();
  if (!trimmed) {
    return { kind: 'company_required' };
  }

  const company = store.findCompany(trimmed);
  if (!company || !store.hasPeerData(company.name)) {
    return { kind: 'invalid_company', name: trimmed };
  }

  const lower = message.toLowerCase();
  const preset = context?.activeToolKey
    ? TOOL_PRESET_MAP[context.activeToolKey]
    : undefined;

  const wantsInvestor =
    lower.includes('investor') ||
    lower.includes('analyse') ||
    lower.includes('analyze') ||
    !lower.includes('auditor');

  const audience =
    context?.audience ?? preset?.audience ?? (wantsInvestor ? 'investor' : 'auditor');
  const horizon =
    context?.horizon ?? preset?.horizon ?? (wantsInvestor ? 3 : 12);

  return { kind: 'analyze', company, audience, horizon };
}

export function resolveToolAudienceHorizon(
  toolId: import('../types.js').ToolId,
  activeToolKey?: string,
): { audience: Audience; horizon: Horizon } {
  const preset = activeToolKey ? TOOL_PRESET_MAP[activeToolKey] : undefined;

  if (toolId === 'forward_signal') {
    return { audience: 'auditor', horizon: 12 };
  }

  return preset ?? { audience: 'investor', horizon: 3 };
}
