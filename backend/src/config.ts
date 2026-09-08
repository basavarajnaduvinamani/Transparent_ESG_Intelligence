import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3001),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
};

export function requireGeminiKey(): string {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to backend/.env');
  }
  return config.geminiApiKey;
}
