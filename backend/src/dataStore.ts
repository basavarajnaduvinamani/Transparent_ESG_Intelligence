import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CompanyRecord,
  DatasetManifest,
  PeerBenchmarkRecord,
  TaxonomyEntry,
} from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');

export class DataStore {
  readonly companies: CompanyRecord[];
  readonly peerBenchmarks: Record<string, PeerBenchmarkRecord>;
  readonly taxonomy: TaxonomyEntry[];
  readonly manifest: DatasetManifest;
  readonly pillarMap: Record<string, string>;

  private constructor(
    companies: CompanyRecord[],
    peerBenchmarks: Record<string, PeerBenchmarkRecord>,
    taxonomy: TaxonomyEntry[],
    manifest: DatasetManifest,
  ) {
    this.companies = companies;
    this.peerBenchmarks = peerBenchmarks;
    this.taxonomy = taxonomy;
    this.manifest = manifest;
    this.pillarMap = Object.fromEntries(taxonomy.map((t) => [t.driver, t.pillar]));
  }

  static load(): DataStore {
    const read = <T>(file: string): T =>
      JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8')) as T;

    return new DataStore(
      read<CompanyRecord[]>('companies.json'),
      read<Record<string, PeerBenchmarkRecord>>('peer_benchmarks.json'),
      read<TaxonomyEntry[]>('taxonomy.json'),
      read<DatasetManifest>('manifest.json'),
    );
  }

  findCompany(query: string): CompanyRecord | null {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    return (
      this.companies.find((c) => c.name.toLowerCase() === q) ??
      this.companies.find((c) => c.name.toLowerCase().includes(q)) ??
      this.companies.find((c) => c.symbol.toLowerCase() === q) ??
      this.companies.find((c) => c.wikipedia.toLowerCase().includes(q)) ??
      null
    );
  }

  extractCompanyQuery(text: string): CompanyRecord | null {
    const lower = text.toLowerCase();
    const sorted = [...this.companies].sort((a, b) => b.name.length - a.name.length);

    for (const company of sorted) {
      const tokens = [
        company.name.toLowerCase(),
        company.wikipedia.toLowerCase(),
        company.symbol.toLowerCase(),
        company.name.split(' ')[0].toLowerCase(),
      ];

      if (tokens.some((token) => token.length > 2 && lower.includes(token))) {
        return company;
      }
    }

    return null;
  }

  hasPeerData(companyName: string): boolean {
    return Boolean(this.peerBenchmarks[companyName]);
  }

  sampleCompanyNames(limit = 4): string[] {
    const preferred = ['Barclays plc', 'Shell plc', 'HSBC Holdings plc', 'Burberry Group plc'];
    const picked = preferred
      .map((name) => this.companies.find((c) => c.name === name)?.name)
      .filter((name): name is string => Boolean(name));

    if (picked.length >= limit) return picked.slice(0, limit);

    return [
      ...picked,
      ...this.companies
        .map((c) => c.name)
        .filter((name) => !picked.includes(name))
        .slice(0, limit - picked.length),
    ];
  }
}
