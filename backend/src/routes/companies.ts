import { Router } from 'express';
import type { DataStore } from '../dataStore.js';
import { requireCompany, shortCompanyLabel } from '../services/companyContext.js';

export function createCompaniesRouter(store: DataStore) {
  const router = Router();

  router.get('/dropdown', (_req, res) => {
    const companies = [...store.companies]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        id: c.id,
        value: c.name,
        label: shortCompanyLabel(c.name),
        industry: c.industry,
        symbol: c.symbol,
        description: [c.industry, c.symbol].filter(Boolean).join(' · '),
      }));

    res.json({
      total: companies.length,
      snapshot: store.manifest.snapshotLabel,
      companies,
    });
  });

  router.get('/manifest', (_req, res) => {
    res.json(store.manifest);
  });

  router.get('/', (req, res) => {
    const q = String(req.query.q ?? '').trim().toLowerCase();
    let list = store.companies;

    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q),
      );
    }

    res.json({
      manifest: store.manifest,
      companies: list.map((c) => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        industry: c.industry,
      })),
      sample: store.sampleCompanyNames(6),
    });
  });

  router.get('/:companyName', (req, res, next) => {
    try {
      const company = requireCompany(store, decodeURIComponent(req.params.companyName));
      const peerData = store.peerBenchmarks[company.name];
      res.json({
        company: {
          id: company.id,
          name: company.name,
          symbol: company.symbol,
          industry: company.industry,
          label: shortCompanyLabel(company.name),
        },
        peerCount: peerData.peerCount,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
