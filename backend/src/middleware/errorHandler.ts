import type { NextFunction, Request, Response } from 'express';
import { parseGeminiError } from '../gemini/errors.js';
import {
  CompanyRequiredError,
  InvalidCompanyError,
} from '../services/companyContext.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);

  if (err instanceof CompanyRequiredError || err instanceof InvalidCompanyError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  res.status(500).json({
    error: parseGeminiError(err),
  });
}

export function geminiGuard(_req: Request, res: Response, next: NextFunction) {
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured. Add it to backend/.env',
    });
    return;
  }
  next();
}
