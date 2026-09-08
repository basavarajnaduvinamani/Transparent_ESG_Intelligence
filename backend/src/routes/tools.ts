import { Router } from 'express';
import type { DataStore } from '../dataStore.js';
import { geminiGuard } from '../middleware/errorHandler.js';
import { runToolTurn } from '../orchestrator/chatOrchestrator.js';
import { requireCompany } from '../services/companyContext.js';
import type { Audience, Horizon, ToolId } from '../types.js';

export function createToolsRouter(store: DataStore) {
  const router = Router();

  router.post('/run', geminiGuard, async (req, res, next) => {
    try {
      const { toolId, companyName, audience, horizon, label, activeToolKey } = req.body as {
        toolId?: ToolId;
        companyName?: string;
        audience?: Audience;
        horizon?: Horizon;
        label?: string;
        activeToolKey?: string;
      };

      if (!toolId) {
        res.status(400).json({ error: 'toolId is required' });
        return;
      }

      if (!companyName?.trim()) {
        res.status(400).json({
          error: 'companyName is required — select a company from the header dropdown',
        });
        return;
      }

      requireCompany(store, companyName.trim());

      const result = await runToolTurn(
        store,
        toolId,
        companyName.trim(),
        label ?? toolId,
        activeToolKey,
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
