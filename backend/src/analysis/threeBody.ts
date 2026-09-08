import type { CompanyRecord, PeerBenchmarkRecord } from '../types.js';
import {
  driverClass,
  THRESHOLDS,
  type DivergencePattern,
  type DriverClass,
} from '../constants.js';

export interface DriverAnalysis {
  driver: string;
  pillar: string;
  companyScore: number | null;
  peerAvg: number;
  benchmarkAvg: number;
  deltaPeer: number;
  deltaBench: number;
  pattern: DivergencePattern;
  driverClass: DriverClass;
}

export function topDrivers(company: CompanyRecord, limit = 8) {
  return Object.entries(company.drivers)
    .filter(([, score]) => typeof score === 'number')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, limit)
    .map(([driver, score]) => ({ driver, score: score as number }));
}

function classifyPattern(
  companyScore: number | null,
  peerAvg: number,
  benchmarkAvg: number,
): DivergencePattern {
  const company = companyScore ?? 0;
  const deltaPeer = company - peerAvg;
  const deltaBench = company - benchmarkAvg;

  if (
    deltaPeer >= THRESHOLDS.outlierPeer &&
    deltaBench >= THRESHOLDS.outlierBench
  ) {
    return 'IdiosyncraticOutlier';
  }

  if (
    peerAvg >= THRESHOLDS.emergingPeerMin &&
    (companyScore == null || companyScore < peerAvg - THRESHOLDS.emergingLagGap)
  ) {
    return 'EmergingLag';
  }

  if (Math.abs(deltaPeer) < THRESHOLDS.sectorNormGap && peerAvg >= 0.35) {
    return 'SectorNorm';
  }

  return 'Aligned';
}

export function analyzeThreeBody(
  company: CompanyRecord,
  peerData: PeerBenchmarkRecord,
  pillarMap: Record<string, string>,
): DriverAnalysis[] {
  const top = topDrivers(company, 8);
  const extraDrivers = Object.entries(peerData.peerAvg)
    .filter(([driver, peerAvg]) => {
      if (top.some((t) => t.driver === driver)) return false;
      return (
        peerAvg >= THRESHOLDS.emergingPeerMin &&
        (company.drivers[driver] == null ||
          (company.drivers[driver] as number) < peerAvg - THRESHOLDS.emergingLagGap)
      );
    })
    .slice(0, 3)
    .map(([driver]) => driver);

  const allDrivers = [
    ...top.map((t) => t.driver),
    ...extraDrivers.filter((d) => !top.some((t) => t.driver === d)),
  ];

  return allDrivers.map((driver) => {
    const companyScore = company.drivers[driver] ?? null;
    const peerAvg = peerData.peerAvg[driver] ?? 0;
    const benchmarkAvg = peerData.benchmarkAvg[driver] ?? 0;

    return {
      driver,
      pillar: pillarMap[driver] ?? 'Unknown',
      companyScore,
      peerAvg,
      benchmarkAvg,
      deltaPeer: (companyScore ?? 0) - peerAvg,
      deltaBench: (companyScore ?? 0) - benchmarkAvg,
      pattern: classifyPattern(companyScore, peerAvg, benchmarkAvg),
      driverClass: driverClass(driver),
    };
  });
}
