import type { Audience, Horizon, PanelSpec, ToolId } from '../types';
import { ApiError } from './client';

export type StreamEventType =
  | 'agent_step'
  | 'panels'
  | 'text_delta'
  | 'key_question'
  | 'chips'
  | 'context'
  | 'done'
  | 'error';

export interface StreamHandlers {
  onAgentStep?: (step: string) => void;
  onPanels?: (panels: PanelSpec[]) => void;
  onTextDelta?: (delta: string) => void;
  onKeyQuestion?: (question: string) => void;
  onChips?: (chips: string[]) => void;
  onContext?: (companyName: string) => void;
  onDone?: (messageId: string) => void;
  onError?: (message: string) => void;
}

export interface ChatStreamRequest {
  message: string;
  context?: {
    companyName?: string;
    audience?: Audience;
    horizon?: Horizon;
    activeToolKey?: string;
  };
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function parseSseBlock(block: string): { event: string; data: string } | null {
  const lines = block.trim().split('\n');
  let event = 'message';
  let data = '';

  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) data += line.slice(5).trim();
  }

  if (!data) return null;
  return { event, data };
}

export async function streamChat(
  request: ChatStreamRequest,
  handlers: StreamHandlers,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? 'Chat stream failed', res.status);
  }

  if (!res.body) {
    throw new ApiError('No response body', 500);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      const parsed = parseSseBlock(block);
      if (!parsed) continue;

      const payload = JSON.parse(parsed.data) as Record<string, unknown>;

      switch (parsed.event as StreamEventType) {
        case 'agent_step':
          handlers.onAgentStep?.(payload.step as string);
          break;
        case 'panels':
          handlers.onPanels?.(payload.panels as PanelSpec[]);
          break;
        case 'text_delta':
          handlers.onTextDelta?.(payload.delta as string);
          break;
        case 'key_question':
          handlers.onKeyQuestion?.(payload.question as string);
          break;
        case 'chips':
          handlers.onChips?.(payload.chips as string[]);
          break;
        case 'context':
          handlers.onContext?.(payload.companyName as string);
          break;
        case 'done':
          handlers.onDone?.(payload.messageId as string);
          break;
        case 'error':
          handlers.onError?.(payload.message as string);
          break;
      }
    }
  }
}

export interface ToolRunResponse {
  toolTurn: { content: string; toolId: ToolId; toolLabel: string };
  assistant: {
    messageId: string;
    content: string;
    keyQuestion?: string;
    panels?: PanelSpec[];
    agentSteps?: string[];
    suggestedChips?: string[];
    activeCompany?: string;
  };
}

export async function runToolApi(body: {
  toolId: ToolId;
  companyName: string;
  audience?: Audience;
  horizon?: Horizon;
  label?: string;
  activeToolKey?: string;
}): Promise<ToolRunResponse> {
  const res = await fetch(`${API_BASE}/api/tools/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error ?? 'Tool run failed', res.status);
  }

  return res.json() as Promise<ToolRunResponse>;
}
