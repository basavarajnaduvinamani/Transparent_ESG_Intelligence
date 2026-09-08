import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import type { DataStore } from '../dataStore.js';
import { factsForGemini, runInvestorAnalysis } from '../analysis/divergence.js';
import { composeInvestorPanels, composeToolPanels } from '../analysis/panelComposer.js';
import { parseGeminiError } from '../gemini/errors.js';
import { streamProse } from '../gemini/proseAgent.js';
import { requireCompany } from '../services/companyContext.js';
import { resolveIntent, resolveToolAudienceHorizon } from './intentResolver.js';
import type { AssistantTurnPayload, ChatContext, PanelSpec, ToolId } from '../types.js';

function sendSse(res: Response, type: string, data: Record<string, unknown>) {
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function streamChatTurn(
  store: DataStore,
  res: Response,
  message: string,
  context?: ChatContext,
): Promise<void> {
  const messageId = randomUUID();
  const intent = resolveIntent(store, message, context);

  if (intent.kind === 'analyze') {
    const steps = [
      `Resolved company: ${intent.company.name}`,
      'Loaded Maxwell March 2025 workbook snapshot',
      'Computed three-body comparison from workbook scores',
      'Ranked conviction from workbook deltas',
      'Applied horizon rules to snapshot data',
      'Generating prose via Gemini',
    ];

    for (const step of steps.slice(0, 5)) {
      sendSse(res, 'agent_step', { step });
    }

    const analysis = runInvestorAnalysis(
      store,
      intent.company,
      intent.audience,
      intent.horizon,
    );
    const panels: PanelSpec[] = composeInvestorPanels(analysis);

    sendSse(res, 'panels', { panels });
    sendSse(res, 'context', { companyName: intent.company.name });
    sendSse(res, 'key_question', { question: analysis.keyQuestion });
    sendSse(res, 'chips', { chips: analysis.suggestedChips });

    const facts = factsForGemini(analysis);
    try {
      for await (const delta of streamProse(message, facts, 'analysis')) {
        sendSse(res, 'text_delta', { delta });
      }
    } catch (err) {
      sendSse(res, 'text_delta', { delta: `**${parseGeminiError(err)}**` });
    }

    sendSse(res, 'done', { messageId });
    return;
  }

  if (intent.kind === 'company_required') {
    sendSse(res, 'text_delta', {
      delta:
        '**Select a company from the header dropdown** before asking questions. All analysis is scoped to one FTSE100 workbook name at a time.',
    });
    sendSse(res, 'done', { messageId });
    return;
  }

  sendSse(res, 'text_delta', {
    delta: `**"${intent.name}"** is not in the March 2025 workbook. Pick a company from the dropdown.`,
  });
  sendSse(res, 'done', { messageId });
}

export async function runToolTurn(
  store: DataStore,
  toolId: ToolId,
  companyName: string,
  label: string,
  activeToolKey?: string,
): Promise<{
  toolTurn: { content: string; toolId: ToolId; toolLabel: string };
  assistant: AssistantTurnPayload;
}> {
  const company = requireCompany(store, companyName);

  if (toolId === 'export_brief') {
    throw new Error('Export brief is not implemented yet.');
  }

  const { audience, horizon } = resolveToolAudienceHorizon(toolId, activeToolKey);
  const analysis = runInvestorAnalysis(store, company, audience, horizon);
  const panels = composeToolPanels(toolId, analysis);

  const messageId = randomUUID();
  let content = '';

  const facts = {
    tool_id: toolId,
    company: company.name,
    analysis_facts: factsForGemini(analysis),
  };

  for await (const delta of streamProse(`Run ${toolId}`, facts, 'tool')) {
    content += delta;
  }

  return {
    toolTurn: {
      content: `Running ${label} on workbook data…`,
      toolId,
      toolLabel: label,
    },
    assistant: {
      messageId,
      content,
      panels,
      agentSteps: [
        `Tool: ${toolId}`,
        `Company: ${company.name}`,
        'Executed deterministic workbook math',
        `Composed ${panels.length} panel(s) from snapshot`,
        'Generated prose via Gemini',
      ],
      suggestedChips: analysis.suggestedChips,
      keyQuestion: analysis.keyQuestion,
      activeCompany: company.name,
    },
  };
}

export async function buildAnalyzePayload(
  store: DataStore,
  companyName: string,
  audience: 'investor' | 'auditor' = 'investor',
  horizon: 3 | 12 = 3,
): Promise<AssistantTurnPayload> {
  const company = requireCompany(store, companyName);

  const analysis = runInvestorAnalysis(store, company, audience, horizon);
  let content = '';

  for await (const delta of streamProse(
    `Analyse ${company.name}`,
    factsForGemini(analysis),
    'analysis',
  )) {
    content += delta;
  }

  return {
    messageId: randomUUID(),
    content,
    panels: composeInvestorPanels(analysis),
    agentSteps: [
      `Resolved company: ${company.name}`,
      'Workbook analysis complete',
      'Prose from Gemini',
    ],
    suggestedChips: analysis.suggestedChips,
    keyQuestion: analysis.keyQuestion,
    activeCompany: company.name,
  };
}
