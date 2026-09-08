export const DATASET = {
  sourceFile: 'FTSE100 financial materiality March 2025.xlsx',
  sheetName: 'FSE100 results',
  snapshotLabel: 'March 2025',
  coveragePeriod: 'Apr 2023 – Mar 2025',
  provider: 'Maxwell',
  universe: 'FTSE100',
} as const;

export function datasetCitation(short = false): string {
  if (short) {
    return `${DATASET.provider} · ${DATASET.snapshotLabel} snapshot`;
  }
  return `All figures are from **${DATASET.sourceFile}** (${DATASET.coveragePeriod} outcomes, ${DATASET.snapshotLabel} release) — ${DATASET.universe} companies only.`;
}

export function datasetScopeNote(): string {
  return 'No live feeds, news, or sustainability reports — only Maxwell materiality scores in this workbook.';
}
