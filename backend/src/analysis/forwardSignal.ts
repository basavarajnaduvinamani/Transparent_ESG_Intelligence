import type { Audience, Horizon } from '../types.js';
import type { ForwardSignalLabel } from '../constants.js';
import type { DriverAnalysis } from './threeBody.js';

export function forwardSignalFor(
  driver: DriverAnalysis,
  horizon: Horizon,
  audience: Audience,
): ForwardSignalLabel {
  const { pattern, driverClass } = driver;

  if (horizon === 3 && audience === 'investor') {
    if (pattern === 'EmergingLag') {
      return driverClass === 'RegimeSensitive' ? '↑ High watch' : '↑ Medium watch';
    }
    if (pattern === 'IdiosyncraticOutlier') {
      return driverClass === 'Persistent' ? '→ Persistent' : '↑ or ↓ Monitor';
    }
    return '→ Stable';
  }

  if (pattern === 'EmergingLag') return '↑ Likely material within 12mo';
  if (pattern === 'IdiosyncraticOutlier') {
    return driverClass === 'Persistent' ? '→ Persistent risk' : '? Uncertain';
  }
  if (pattern === 'SectorNorm') return '→ Sector baseline';
  return '→ Stable';
}

export function synthesizeTrend(
  now: number | null,
  peerAvg: number,
  pattern: DriverAnalysis['pattern'],
  horizon: Horizon,
): Array<number | null> {
  const current = now ?? 0;

  if (pattern === 'EmergingLag') {
    const target = peerAvg * 0.85;
    if (horizon === 3) {
      return [current, current + (target - current) * 0.4, null];
    }
    return [current, current + (target - current) * 0.4, current + (target - current) * 0.75];
  }

  return [current, current, horizon === 12 ? current : null];
}
