/** Thresholds applied to Maxwell March 2025 workbook scores only. */
export const THRESHOLDS = {
  outlierPeer: 0.1,
  outlierBench: 0.15,
  emergingPeerMin: 0.45,
  emergingLagGap: 0.1,
  sectorNormGap: 0.08,
  highConvictionPeer: 0.1,
  highConvictionBench: 0.15,
} as const;

export const PERSISTENT_DRIVERS = new Set([
  'Management of the Legal & Regulatory Environment',
  'Business Ethics',
  'Business Model Resilience',
  'Critical Incidence Risk Management',
]);

export const REGIME_SENSITIVE_DRIVERS = new Set([
  'Physical Impacts of Climate Change',
  'GHG Emissions',
  'Ecological Impacts',
  'Energy Management',
]);

export type DriverClass = 'Persistent' | 'RegimeSensitive' | 'Mixed';
export type DivergencePattern =
  | 'IdiosyncraticOutlier'
  | 'EmergingLag'
  | 'SectorNorm'
  | 'Aligned';
export type ConvictionTier = 'HIGH' | 'MEDIUM' | 'WATCH' | 'LOW';
export type ForwardSignalLabel =
  | '↑ High watch'
  | '↑ Medium watch'
  | '→ Persistent'
  | '↑ or ↓ Monitor'
  | '→ Stable'
  | '↑ Likely material within 12mo'
  | '→ Persistent risk'
  | '? Uncertain'
  | '→ Sector baseline';

export function driverClass(driver: string): DriverClass {
  if (PERSISTENT_DRIVERS.has(driver)) return 'Persistent';
  if (REGIME_SENSITIVE_DRIVERS.has(driver)) return 'RegimeSensitive';
  return 'Mixed';
}
