import { Router } from 'express';
import type { DataStore } from '../dataStore.js';

export function createHealthRouter(store: DataStore) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      gemini: Boolean(process.env.GEMINI_API_KEY),
      dataset: store.manifest,
    });
  });

  return router;
}
