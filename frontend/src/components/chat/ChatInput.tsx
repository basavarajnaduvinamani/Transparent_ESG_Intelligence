import { Mic, Plus, Send, Wrench } from 'lucide-react';
import { useRef } from 'react';
import { TOOL_PRESETS } from '../../lib/tools';
import { SelectDropdown } from '../ui/SelectDropdown';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  activeToolKey: string;
  onToolChange: (toolKey: string) => void;
  onRunActiveTool: () => void;
  compact?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  activeToolKey,
  onToolChange,
  onRunActiveTool,
  compact = false,
  disabled = false,
  placeholder = 'Ask about the selected company — responses from backend + Gemini',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    onSubmit(value);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`}>
      {!compact && (
        <div className={styles.banner}>
          <div className={styles.bannerLeft}>
            <span className={styles.bannerBadge}>FTSE100</span>
            <span>Financial materiality · March 2025</span>
          </div>
          <button type="button" className={styles.bannerLink}>
            View dataset
          </button>
        </div>
      )}

      <div className={styles.card}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={compact ? 1 : 3}
          aria-label="Chat message"
          disabled={disabled}
        />

        <div className={styles.toolbar}>
          <button type="button" className={styles.toolBtn} aria-label="Add attachment">
            <Plus size={18} strokeWidth={1.75} />
          </button>

          <div className={styles.toolbarRight}>
            <button
              type="button"
              className={styles.runToolBtn}
              aria-label="Run active tool"
              title="Run armed divergence narrative tool"
              onClick={onRunActiveTool}
            >
              <Wrench size={14} strokeWidth={2} />
            </button>

            <SelectDropdown
              value={activeToolKey}
              options={TOOL_PRESETS.map((preset) => ({
                value: preset.key,
                label: preset.label,
                description: preset.description,
              }))}
              onChange={onToolChange}
              ariaLabel="Active analysis tool"
              compact={compact}
            />

            <button type="button" className={styles.toolBtn} aria-label="Voice input">
              <Mic size={18} strokeWidth={1.75} />
            </button>

            <button
              type="button"
              className={`${styles.sendBtn} ${value.trim() ? styles.sendBtnActive : ''}`}
              aria-label="Send message"
              onClick={handleSubmit}
              disabled={disabled || !value.trim()}
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
