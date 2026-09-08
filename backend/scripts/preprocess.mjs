import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const xlsxPath = path.join(root, 'FTSE100 financial materiality March 2025.xlsx');
const outDir = path.join(root, 'backend/data');

function pillarForColumn(col, pillarRow) {
  let pillar = 'Environment';
  for (let i = 5; i <= col; i++) {
    const cell = pillarRow[i];
    if (cell === 'Environment' || cell === 'Social' || cell === 'Governance') {
      pillar = cell;
    }
  }
  return pillar;
}

function main() {
  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets['FSE100 results'];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const pillarRow = matrix[0];
  const headerRow = matrix[1];
  const driverColumns = [];

  for (let col = 5; col < headerRow.length; col++) {
    const driver = headerRow[col];
    if (!driver || typeof driver !== 'string') continue;
    driverColumns.push({
      col,
      driver,
      pillar: pillarForColumn(col, pillarRow),
    });
  }

  const companies = [];

  for (let rowIdx = 2; rowIdx < matrix.length; rowIdx++) {
    const row = matrix[rowIdx];
    if (!row?.[1]) continue;

    const drivers = {};
    for (const { col, driver } of driverColumns) {
      const value = row[col];
      drivers[driver] = typeof value === 'number' ? value : null;
    }

    companies.push({
      id: Number(row[0]),
      name: String(row[1]),
      symbol: String(row[2] ?? ''),
      wikipedia: String(row[3] ?? ''),
      industry: String(row[4] ?? 'Unknown'),
      drivers,
    });
  }

  const peerBenchmarks = {};
  const allDriverNames = driverColumns.map((d) => d.driver);

  for (const company of companies) {
    const peers = companies.filter(
      (c) => c.industry === company.industry && c.name !== company.name,
    );

    const peerAvg = {};
    const benchmarkAvg = {};

    for (const driver of allDriverNames) {
      const peerValues = peers
        .map((p) => p.drivers[driver])
        .filter((v) => typeof v === 'number');
      const benchValues = companies
        .map((c) => c.drivers[driver])
        .filter((v) => typeof v === 'number');

      peerAvg[driver] =
        peerValues.length > 0
          ? peerValues.reduce((a, b) => a + b, 0) / peerValues.length
          : 0;
      benchmarkAvg[driver] =
        benchValues.length > 0
          ? benchValues.reduce((a, b) => a + b, 0) / benchValues.length
          : 0;
    }

    peerBenchmarks[company.name] = {
      peerAvg,
      benchmarkAvg,
      peerCount: peers.length,
    };
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'companies.json'), JSON.stringify(companies, null, 2));
  fs.writeFileSync(
    path.join(outDir, 'peer_benchmarks.json'),
    JSON.stringify(peerBenchmarks, null, 2),
  );
  fs.writeFileSync(path.join(outDir, 'taxonomy.json'), JSON.stringify(driverColumns, null, 2));

  const industries = new Set(companies.map((c) => c.industry));
  const manifest = {
    sourceFile: 'FTSE100 financial materiality March 2025.xlsx',
    sheetName: 'FSE100 results',
    snapshotLabel: 'March 2025',
    coveragePeriod: 'Apr 2023 – Mar 2025',
    provider: 'Maxwell',
    universe: 'FTSE100',
    companyCount: companies.length,
    driverCount: driverColumns.length,
    industries: industries.size,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${companies.length} companies to ${outDir}`);
}

main();
