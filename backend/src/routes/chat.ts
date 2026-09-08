import { Router } from 'express';
import type { DataStore } from '../dataStore.js';
import { geminiGuard } from '../middleware/errorHandler.js';
import { parseGeminiError } from '../gemini/errors.js';
import { requireCompany } from '../services/companyContext.js';
import { buildAnalyzePayload, streamChatTurn } from '../orchestrator/chatOrchestrator.js';
import type { ChatContext } from '../types.js';

export function createChatRouter(store: DataStore) {
  const router = Router();

  router.post('/stream', geminiGuard, async (req, res) => {
    const { message, context } = req.body as {
      message?: string;
      context?: ChatContext;
    };

    if (!message?.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    if (!context?.companyName?.trim()) {
      res.status(400).json({
        error: 'companyName is required — select a company from the header dropdown',
      });
      return;
    }

    try {
      requireCompany(store, context.companyName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid company';
      const status =
        err instanceof Error && 'status' in err
          ? (err as { status: number }).status
          : 400;
      res.status(status).json({ error: msg });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      await streamChatTurn(store, res, message.trim(), context);
      res.end();
    } catch (err) {
      const msg = err instanceof Error ? parseGeminiError(err) : 'Stream failed';
      res.write(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`);
      res.end();
    }
  });

  router.post('/', geminiGuard, async (req, res, next) => {
    try {
      const { message, context } = req.body as {
        message?: string;
        context?: ChatContext;
      };

      if (!message?.trim()) {
        res.status(400).json({ error: 'message is required' });
        return;
      }

      const company = requireCompany(store, context?.companyName);

      const audience = context?.audience ?? 'investor';
      const horizon = context?.horizon ?? 3;
      const payload = await buildAnalyzePayload(
        store,
        company.name,
        audience,
        horizon,
      );
      res.json(payload);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
