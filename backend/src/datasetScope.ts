import type { DivergencePattern } from './constants.js';
import type { DataStore } from './dataStore.js';
import { analyzeThreeBody } from './analysis/threeBody.js';
import type { CompanyRecord } from './types.js';

export interface IndustryPeerRow {
  companyName: string;
  score: number | null;
  peerAvg: number;
  benchmarkAvg: number;
  pattern: DivergencePattern;
}

export function scanIndustryPeers(
  store: DataStore,
  company: CompanyRecord,
  focusDriver: string,
  focusPattern: DivergencePattern,
): IndustryPeerRow[] {
  const industryPeers = store.companies.filter(
    (c) => c.industry === company.industry && c.name !== company.name,
  );

  return industryPeers
    .map((peer) => {
      const peerData = store.peerBenchmarks[peer.name];
      if (!peerData) return null;

      const analysis = analyzeThreeBody(peer, peerData, store.pillarMap).find(
        (d) => d.driver === focusDriver,
      );
      if (!analysis) return null;

      return {
        companyName: peer.name,
        score: analysis.companyScore,
        peerAvg: analysis.peerAvg,
        benchmarkAvg: analysis.benchmarkAvg,
        pattern: analysis.pattern,
      };
    })
    .filter((row): row is IndustryPeerRow => row !== null)
    .filter((row) => row.pattern === focusPattern)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
