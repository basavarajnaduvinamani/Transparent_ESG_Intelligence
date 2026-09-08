import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgentSteps } from './AgentSteps';
import { LiveStreamMessage } from './LiveStreamMessage';
import { SuggestedChips } from './SuggestedChips';
import { TypingMessage } from './TypingMessage';
import { DynamicPanelRenderer } from '../panels/DynamicPanelRenderer';
import type { ChatTurn } from '../../types';
import styles from './ChatThread.module.css';

interface ChatThreadProps {
  messages: ChatTurn[];
  onChipSelect: (chip: string) => void;
  streamTargetId?: string | null;
}

export function ChatThread({ messages, onChipSelect, streamTargetId }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [typingDoneIds, setTypingDoneIds] = useState<Set<string>>(new Set());

  const latestAssistantId = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant')?.id,
    [messages],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    endRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom('auto');
    const timeout = window.setTimeout(() => scrollToBottom('smooth'), 180);
    return () => window.clearTimeout(timeout);
  }, [messages, typingDoneIds, streamTargetId, scrollToBottom]);

  useEffect(() => {
    if (!streamTargetId) return;
    setTypingDoneIds((prev) => {
      const next = new Set(prev);
      next.delete(streamTargetId);
      return next;
    });
  }, [streamTargetId]);

  useEffect(() => {
    if (streamTargetId) return;
    if (latestAssistantId) {
      setTypingDoneIds((prev) => new Set(prev).add(latestAssistantId));
    }
  }, [streamTargetId, latestAssistantId]);

  const markTypingDone = useCallback((id: string) => {
    setTypingDoneIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  return (
    <div className={styles.thread}>
      {messages.map((message) => {
        const isLatestAssistant =
          message.role === 'assistant' && message.id === latestAssistantId;
        const isLiveStream = message.id === streamTargetId;
        const typingComplete =
          !isLatestAssistant || typingDoneIds.has(message.id) || isLiveStream;

        return (
          <article
            key={message.id}
            className={`${styles.message} ${
              message.role === 'user'
                ? styles.user
                : message.role === 'tool'
                  ? styles.tool
                  : styles.assistant
            }`}
          >
            {message.role === 'tool' && (
              <span className={styles.toolBadge}>{message.toolLabel ?? 'Tool'}</span>
            )}

            <div className={styles.bubble}>
              {message.role === 'assistant' ? (
                <>
                  {message.agentSteps && message.agentSteps.length > 0 && (
                    <AgentSteps steps={message.agentSteps} />
                  )}
                  {isLiveStream ? (
                    <LiveStreamMessage content={message.content} />
                  ) : (
                    <TypingMessage
                      text={message.content}
                      active={isLatestAssistant && !typingDoneIds.has(message.id)}
                      onProgress={() => scrollToBottom('auto')}
                      onComplete={() => markTypingDone(message.id)}
                    />
                  )}
                </>
              ) : (
                message.content
              )}
            </div>

            {message.role === 'assistant' && !isLiveStream && typingComplete && (
              <>
                {message.panels && message.panels.length > 0 && (
                  <div className={`${styles.panels} ${styles.panelsReveal}`}>
                    <DynamicPanelRenderer panels={message.panels} />
                  </div>
                )}
                {message.suggestedChips && (
                  <SuggestedChips chips={message.suggestedChips} onSelect={onChipSelect} />
                )}
              </>
            )}
          </article>
        );
      })}
      <div ref={endRef} className={styles.scrollAnchor} aria-hidden="true" />
    </div>
  );
}
