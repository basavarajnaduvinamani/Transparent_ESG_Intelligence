import type { Audience, Horizon } from '../types.js';
import type { ConvictionTier, ForwardSignalLabel } from '../constants.js';
import type { DataStore } from '../dataStore.js';
import { scanIndustryPeers, type IndustryPeerRow } from '../datasetScope.js';
import { convictionFor } from './conviction.js';
import { forwardSignalFor, synthesizeTrend } from './forwardSignal.js';
import { analyzeThreeBody, type DriverAnalysis } from './threeBody.js';
import type { CompanyRecord } from '../types.js';

export interface EnrichedDriver extends DriverAnalysis {
  conviction: ConvictionTier;
  forwardSignal: ForwardSignalLabel;
  trend: Array<number | null>;
}

export interface AnalysisBundle {
  companyName: string;
  industry: string;
  peerCount: number;
  audience: Audience;
  horizon: Horizon;
  drivers: EnrichedDriver[];
  focusDriver: EnrichedDriver;
  industryPeers: IndustryPeerRow[];
  keyQuestion: string;
  suggestedChips: string[];
}

function shortName(name: string) {
  return name.replace(/\s+plc$/i, '').replace(/\s+Group$/i, '');
}

function pickFocusDriver(drivers: EnrichedDriver[]): EnrichedDriver {
  const priority: ConvictionTier[] = ['WATCH', 'HIGH', 'MEDIUM', 'LOW'];
  const watchDrivers = drivers.filter((d) => d.conviction === 'WATCH' && d.pattern !== 'Aligned');

  const ghgLag = watchDrivers.find((d) => d.driver === 'GHG Emissions');
  if (ghgLag) return ghgLag;

  const regimeWatch = watchDrivers.find((d) => d.driverClass === 'RegimeSensitive');
  if (regimeWatch) return regimeWatch;

  for (const tier of priority) {
    const match = drivers.find((d) => d.conviction === tier && d.pattern !== 'Aligned');
    if (match) return match;
  }
  return drivers[0];
}

function buildKeyQuestion(
  company: string,
  focus: EnrichedDriver,
  audience: Audience,
  horizon: Horizon,
): string {
  const co = shortName(company);
  const d = focus.driver.toLowerCase();
  const peer = focus.peerAvg.toFixed(2);
  const bench = focus.benchmarkAvg.toFixed(2);
  const score =
    focus.companyScore != null ? focus.companyScore.toFixed(2) : 'not flagged';

  if (audience === 'investor' && horizon === 3) {
    if (focus.pattern === 'EmergingLag') {
      return `The key question for an institutional investor is: ${co} does not currently price ${d} (${score}) while peers sit around ${peer} — is this gap likely to begin closing within the next quarter as peer discourse intensifies, or does ${co}'s model justify sustained divergence?`;
    }
    if (focus.pattern === 'IdiosyncraticOutlier') {
      return `The key question for an institutional investor is: does ${co}'s elevated ${d} materiality (${score} vs peer ${peer}, benchmark ${bench}) reflect persistent idiosyncratic risk to watch this quarter, or a temporary spike in market conversation?`;
    }
    return `The key question for an institutional investor is: relative to peers (${peer}) and the FTSE100 benchmark (${bench}), is ${co}'s ${d} profile stable for quarterly conviction, or is there an emerging divergence worth rotating around?`;
  }

  return `The key question for an auditor is: if ${co}'s sustainability narrative on ${d} diverges from Maxwell materiality (company ${score}, peers ${peer}), should audit procedures test whether disclosed targets are reflected in price-relevant market discourse over the next 12 months?`;
}

function buildChips(
  companyName: string,
  focus: EnrichedDriver,
  industryPeers: IndustryPeerRow[],
): string[] {
  const co = shortName(companyName);
  const peerChip =
    industryPeers.length > 0
      ? `Compare ${co} vs ${shortName(industryPeers[0].companyName)}`
      : `Which peers share the ${focus.driver} pattern?`;

  return [
    peerChip,
    'Explain the three-body table',
    'Switch to Auditor 12mo view',
    `Show ${focus.driver} in the workbook`,
  ];
}

export function runInvestorAnalysis(
  store: DataStore,
  company: CompanyRecord,
  audience: Audience = 'investor',
  horizon: Horizon = 3,
): AnalysisBundle {
  const peerData = store.peerBenchmarks[company.name];
  const base = analyzeThreeBody(company, peerData, store.pillarMap);
  const drivers: EnrichedDriver[] = base.map((driver) => ({
    ...driver,
    conviction: convictionFor(driver),
    forwardSignal: forwardSignalFor(driver, horizon, audience),
    trend: synthesizeTrend(driver.companyScore, driver.peerAvg, driver.pattern, horizon),
  }));

  const focusDriver = pickFocusDriver(drivers);
  const industryPeers = scanIndustryPeers(
    store,
    company,
    focusDriver.driver,
    focusDriver.pattern,
  );

  return {
    companyName: company.name,
    industry: company.industry,
    peerCount: peerData.peerCount,
    audience,
    horizon,
    drivers,
    focusDriver,
    industryPeers,
    keyQuestion: buildKeyQuestion(company.name, focusDriver, audience, horizon),
    suggestedChips: buildChips(company.name, focusDriver, industryPeers),
  };
}

export function factsForGemini(analysis: AnalysisBundle) {
  return {
    company: analysis.companyName,
    industry: analysis.industry,
    peer_count: analysis.peerCount,
    audience: analysis.audience,
    horizon_months: analysis.horizon,
    dataset: 'FTSE100 financial materiality March 2025.xlsx',
    focus_driver: {
      name: analysis.focusDriver.driver,
      company_score: analysis.focusDriver.companyScore,
      peer_avg: analysis.focusDriver.peerAvg,
      benchmark_avg: analysis.focusDriver.benchmarkAvg,
      delta_peer: analysis.focusDriver.deltaPeer,
      delta_bench: analysis.focusDriver.deltaBench,
      conviction: analysis.focusDriver.conviction,
      pattern: analysis.focusDriver.pattern,
      forward_signal: analysis.focusDriver.forwardSignal,
    },
    drivers: analysis.drivers.map((d) => ({
      name: d.driver,
      company_score: d.companyScore,
      peer_avg: d.peerAvg,
      benchmark_avg: d.benchmarkAvg,
      delta_peer: d.deltaPeer,
      delta_bench: d.deltaBench,
      conviction: d.conviction,
      pattern: d.pattern,
      forward_signal: d.forwardSignal,
    })),
    industry_peers: analysis.industryPeers,
    draft_key_question: analysis.keyQuestion,
  };
}
