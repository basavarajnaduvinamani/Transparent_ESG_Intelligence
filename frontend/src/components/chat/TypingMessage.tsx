import { useEffect, useRef, useState } from 'react';
import styles from './TypingMessage.module.css';

interface TypingMessageProps {
  text: string;
  active: boolean;
  onProgress?: () => void;
  onComplete?: () => void;
}

const CHAR_MS = 12;

function formatLine(line: string) {
  return line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function renderTypingProse(text: string, showCursor: boolean) {
  if (!text) {
    return (
      <p className={styles.currentLine}>
        {showCursor && <span className={styles.cursor} aria-hidden="true" />}
      </p>
    );
  }

  const lines = text.split('\n');
  const completeLines = lines.slice(0, -1);
  const lastLine = lines[lines.length - 1];

  return (
    <>
      {completeLines.map((line, idx) => (
        <p key={idx} dangerouslySetInnerHTML={{ __html: formatLine(line) }} />
      ))}
      <p className={styles.currentLine}>
        <span dangerouslySetInnerHTML={{ __html: formatLine(lastLine) }} />
        {showCursor && <span className={styles.cursor} aria-hidden="true" />}
      </p>
    </>
  );
}

export function TypingMessage({ text, active, onProgress, onComplete }: TypingMessageProps) {
  const [visibleCount, setVisibleCount] = useState(active ? 0 : text.length);
  const [complete, setComplete] = useState(!active);
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (!active) {
      setVisibleCount(text.length);
      setComplete(true);
      return;
    }

    setVisibleCount(0);
    setComplete(false);

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleCount(index);
      onProgressRef.current?.();

      if (index >= text.length) {
        window.clearInterval(timer);
        setComplete(true);
        onCompleteRef.current?.();
      }
    }, CHAR_MS);

    return () => window.clearInterval(timer);
  }, [text, active]);

  const visibleText = text.slice(0, visibleCount);

  return (
    <div className={styles.typing}>
      {renderTypingProse(visibleText, !complete)}
    </div>
  );
}
