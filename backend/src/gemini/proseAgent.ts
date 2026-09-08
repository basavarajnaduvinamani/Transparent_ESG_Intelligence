import { GoogleGenAI } from '@google/genai';
import { config, requireGeminiKey } from '../config.js';
import { parseGeminiError } from './errors.js';

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: requireGeminiKey() });
  }
  return client;
}

export const SYSTEM_INSTRUCTION = `You are Three-Body Copilot for Maxwell FTSE100 financial materiality analysis.

STRICT RULES:
- Use ONLY numbers provided in the facts JSON from FTSE100 financial materiality March 2025.xlsx.
- Never invent, estimate, or round numbers differently from the JSON.
- Never cite news, sustainability reports, or external market data.
- If a number is null or missing, say "not flagged in Maxwell workbook".
- Write clear investor-grade markdown prose (use **bold** for emphasis).
- End with the draft_key_question from facts JSON (lightly polished if needed, same meaning).
- Keep responses focused on three-body comparison: company vs peers vs FTSE100 benchmark.`;

function buildPrompt(
  userMessage: string,
  facts: Record<string, unknown>,
  mode: 'analysis' | 'guidance' | 'tool',
): string {
  if (mode === 'guidance') {
    return `The user asked: "${userMessage}"

No matching company was found in the FTSE100 March 2025 workbook (${facts.company_count} companies available).

Dataset manifest:
${JSON.stringify(facts.manifest, null, 2)}

Sample companies: ${(facts.sample_companies as string[]).join(', ')}

Guide the user to pick a valid company from this workbook only. Do not invent data.`;
  }

  if (mode === 'tool') {
    return `Tool run: ${facts.tool_id} on ${facts.company}.

Facts JSON (workbook-computed panels already rendered separately):
${JSON.stringify(facts.analysis_facts, null, 2)}

Write a short summary of what the tool shows. Use only numbers from facts JSON.`;
  }

  return `User query: "${userMessage}"

Facts JSON (all numbers pre-computed from workbook — do not recalculate):
${JSON.stringify(facts, null, 2)}

Write the three-body investor analysis prose.`;
}

export async function* streamProse(
  userMessage: string,
  facts: Record<string, unknown>,
  mode: 'analysis' | 'guidance' | 'tool',
): AsyncGenerator<string> {
  const ai = getGeminiClient();
  const prompt = buildPrompt(userMessage, facts, mode);

  try {
    const stream = await ai.models.generateContentStream({
      model: config.geminiModel,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (err) {
    throw new Error(parseGeminiError(err));
  }
}

export function guidanceFallback(facts: Record<string, unknown>): string {
  const samples = (facts.sample_companies as string[] | undefined) ?? [];
  const names = samples.map((n) => n.replace(/\s+plc$/i, '')).slice(0, 4);
  return (
    `I only analyse companies in the **FTSE100 financial materiality March 2025** workbook ` +
    `(${facts.company_count ?? 79} names). ` +
    `Your message didn't match one — try **${names.join('**, **')}**. ` +
    `Panels and scores always come from the workbook; prose needs Gemini API access.`
  );
}
