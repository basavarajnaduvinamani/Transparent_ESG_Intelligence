import { renderMarkdownLite } from '../../lib/renderProse';
import styles from './TypingMessage.module.css';

export function LiveStreamMessage({ content }: { content: string }) {
  return (
    <div className={styles.typing}>
      {renderMarkdownLite(content)}
      <span className={styles.cursor} aria-hidden="true" />
    </div>
  );
}
