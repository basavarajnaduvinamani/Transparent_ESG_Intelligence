import { THRESHOLDS, type ConvictionTier } from '../constants.js';
import type { DriverAnalysis } from './threeBody.js';

export function convictionFor(driver: DriverAnalysis): ConvictionTier {
  if (
    driver.pattern === 'IdiosyncraticOutlier' &&
    driver.deltaPeer >= THRESHOLDS.highConvictionPeer &&
    driver.deltaBench >= THRESHOLDS.highConvictionBench
  ) {
    return 'HIGH';
  }

  if (driver.pattern === 'EmergingLag') return 'WATCH';

  if (driver.companyScore != null && driver.companyScore >= 0.55) return 'MEDIUM';

  if (driver.companyScore != null && driver.companyScore >= 0.35) return 'LOW';

  return 'LOW';
}
