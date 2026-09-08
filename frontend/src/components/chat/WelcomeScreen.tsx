import { BrandMark } from '../layout/Sidebar';
import styles from './WelcomeScreen.module.css';

interface WelcomeScreenProps {
  greeting: string;
  tease: string;
  datasetLabel?: string;
  hint?: string;
}

export function WelcomeScreen({ greeting, tease, datasetLabel, hint }: WelcomeScreenProps) {
  return (
    <div className={styles.welcome}>
      <h1 className={styles.greeting}>
        <BrandMark />
        <span>{greeting}</span>
      </h1>
      <p className={styles.subtitle}>{tease}</p>
      {datasetLabel && <p className={styles.dataset}>{datasetLabel}</p>}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
