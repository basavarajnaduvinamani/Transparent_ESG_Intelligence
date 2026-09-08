export function parseGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  // Unwrap nested JSON blobs from @google/genai
  let text = raw;
  for (let i = 0; i < 4; i++) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (typeof parsed.message === 'string') {
        text = parsed.message;
        continue;
      }
      if (parsed.error && typeof parsed.error === 'object') {
        const inner = parsed.error as Record<string, unknown>;
        if (typeof inner.message === 'string') {
          text = inner.message;
          continue;
        }
      }
      break;
    } catch {
      break;
    }
  }

  if (text.includes('429') || text.includes('RESOURCE_EXHAUSTED') || text.includes('quota')) {
    const retryMatch = text.match(/retry in ([\d.]+)s/i);
    const retry = retryMatch ? ` Retry in ~${Math.ceil(Number(retryMatch[1]))}s.` : '';
    return (
      `Gemini API quota exceeded for model **${process.env.GEMINI_MODEL ?? 'gemini'}**.` +
      ` Free-tier limits may be exhausted or this model has no free quota.${retry}` +
      ` Try \`GEMINI_MODEL=gemini-2.5-flash\` or \`gemini-2.5-flash-lite\` in backend/.env,` +
      ` enable billing at [Google AI Studio](https://aistudio.google.com/), or wait for quota reset.` +
      ` Workbook panels still load when a company matches — only prose generation failed.`
    );
  }

  if (text.length > 280) {
    return `${text.slice(0, 280)}…`;
  }

  return text || 'Gemini request failed';
}
