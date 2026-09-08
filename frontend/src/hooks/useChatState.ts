import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  checkHealth,
  fetchCompanyDropdown,
  type CompanyDropdownOption,
  type HealthResponse,
} from '../api/client';
import { runToolApi, streamChat } from '../api/chat';
import { getToolPreset, TOOL_PRESETS } from '../lib/tools';
import { pickWelcomeMessage } from '../lib/welcomeMessages';
import type { ChatTurn, ToolId } from '../types';

const COMPANY_REQUIRED_MSG =
  '**Select a company from the header dropdown** before asking questions or running tools.';

function backendErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400) {
      return `**${err.message}**`;
    }
    if (err.status === 503) {
      return '**Backend is running but Gemini is not configured.** Add `GEMINI_API_KEY` to `backend/.env` and restart (`npm run dev`).';
    }
    return `**Backend error:** ${err.message}`;
  }
  return '**Cannot reach backend.** Run `npm run dev` from the project root (backend on port 3001).';
}

export function useChatState() {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [activeToolKey, setActiveToolKey] = useState(TOOL_PRESETS[0].key);
  const [welcome] = useState(() => pickWelcomeMessage());
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companyOptions, setCompanyOptions] = useState<CompanyDropdownOption[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [geminiReady, setGeminiReady] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState<HealthResponse['dataset'] | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamTargetId, setStreamTargetId] = useState<string | null>(null);

  const loadCompanies = useCallback(() => {
    setCompaniesLoading(true);
    fetchCompanyDropdown()
      .then((data) => {
        setCompanyOptions(data.companies);
        setSelectedCompany((current) => {
          if (!current) return '';
          return data.companies.some((c) => c.value === current) ? current : '';
        });
      })
      .catch(() => setCompanyOptions([]))
      .finally(() => setCompaniesLoading(false));
  }, []);

  const refreshHealth = useCallback(() => {
    checkHealth()
      .then((health) => {
        if (!health.ok) throw new Error('Health check failed');
        setBackendOnline(true);
        setGeminiReady(health.gemini);
        setDatasetInfo(health.dataset);
        setBackendError(health.gemini ? null : 'GEMINI_API_KEY missing on backend');
        loadCompanies();
      })
      .catch(() => {
        setBackendOnline(false);
        setGeminiReady(false);
        setDatasetInfo(null);
        setCompanyOptions([]);
        setBackendError('Backend unreachable');
      });
  }, [loadCompanies]);

  useEffect(() => {
    refreshHealth();
    const interval = window.setInterval(refreshHealth, 15000);
    return () => window.clearInterval(interval);
  }, [refreshHealth]);

  const hasStarted = messages.length > 0;
  const hasCompany = Boolean(selectedCompany);
  const activeTool = getToolPreset(activeToolKey);

  const updateAssistant = useCallback((id: string, patch: Partial<ChatTurn>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  }, []);

  const appendCompanyRequired = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: COMPANY_REQUIRED_MSG,
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userTurn: ChatTurn = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      };

      if (!backendOnline) {
        setMessages((prev) => [
          ...prev,
          userTurn,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: backendErrorMessage(new ApiError('Backend unreachable', 0)),
          },
        ]);
        setInput('');
        return;
      }

      if (!hasCompany) {
        setMessages((prev) => [...prev, userTurn]);
        appendCompanyRequired();
        setInput('');
        return;
      }

      const assistantId = crypto.randomUUID();
      const assistantTurn: ChatTurn = {
        id: assistantId,
        role: 'assistant',
        content: '',
        agentSteps: [],
      };

      setMessages((prev) => [...prev, userTurn, assistantTurn]);
      setInput('');
      setLoading(true);
      setStreamTargetId(assistantId);

      const preset = getToolPreset(activeToolKey);

      try {
        await streamChat(
          {
            message: trimmed,
            context: {
              companyName: selectedCompany,
              audience: preset.audience,
              horizon: preset.horizon,
              activeToolKey,
            },
          },
          {
            onAgentStep: (step) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, agentSteps: [...(m.agentSteps ?? []), step] }
                    : m,
                ),
              );
            },
            onPanels: (panels) => updateAssistant(assistantId, { panels }),
            onTextDelta: (delta) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + delta } : m,
                ),
              );
            },
            onKeyQuestion: (question) => updateAssistant(assistantId, { keyQuestion: question }),
            onChips: (chips) => updateAssistant(assistantId, { suggestedChips: chips }),
            onError: (message) => updateAssistant(assistantId, { content: `**Error:** ${message}` }),
          },
        );
      } catch (err) {
        updateAssistant(assistantId, { content: backendErrorMessage(err) });
      } finally {
        setLoading(false);
        setStreamTargetId(null);
      }
    },
    [
      activeToolKey,
      appendCompanyRequired,
      backendOnline,
      hasCompany,
      loading,
      selectedCompany,
      updateAssistant,
    ],
  );

  const runTool = useCallback(
    async (toolId: ToolId, label?: string) => {
      if (loading) return;

      if (!backendOnline) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: backendErrorMessage(new ApiError('Backend unreachable', 0)),
          },
        ]);
        return;
      }

      if (!hasCompany) {
        appendCompanyRequired();
        return;
      }

      setLoading(true);

      try {
        const preset = getToolPreset(activeToolKey);
        const result = await runToolApi({
          toolId,
          companyName: selectedCompany,
          label: label ?? toolId,
          activeToolKey,
          audience: toolId === 'forward_signal' ? 'auditor' : preset.audience,
          horizon: toolId === 'forward_signal' ? 12 : preset.horizon,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'tool',
            content: result.toolTurn.content,
            toolId: result.toolTurn.toolId,
            toolLabel: result.toolTurn.toolLabel,
          },
          {
            id: result.assistant.messageId,
            role: 'assistant',
            content: result.assistant.content,
            panels: result.assistant.panels,
            agentSteps: result.assistant.agentSteps,
            suggestedChips: result.assistant.suggestedChips,
            keyQuestion: result.assistant.keyQuestion,
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: backendErrorMessage(err),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      activeToolKey,
      appendCompanyRequired,
      backendOnline,
      hasCompany,
      loading,
      selectedCompany,
    ],
  );

  const runActiveTool = useCallback(() => {
    runTool(activeTool.toolId, activeTool.label);
  }, [activeTool, runTool]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setInput('');
  }, []);

  return {
    messages,
    input,
    setInput,
    activeToolKey,
    setActiveToolKey,
    greeting: welcome.title,
    tease: welcome.tease,
    hasStarted,
    ready: backendOnline && geminiReady && hasCompany,
    backendOnline,
    geminiReady,
    datasetInfo,
    loading,
    backendError,
    selectedCompany,
    setSelectedCompany,
    companyOptions,
    companiesLoading,
    hasCompany,
    sendMessage,
    runTool,
    runActiveTool,
    startNewChat,
    streamTargetId,
    refreshHealth,
  };
}
