import styles from './AgentSteps.module.css';

interface AgentStepsProps {
  steps: string[];
}

export function AgentSteps({ steps }: AgentStepsProps) {
  if (!steps.length) return null;

  return (
    <div className={styles.steps} aria-label="Agent steps">
      {steps.map((step) => (
        <div key={step} className={styles.step}>
          <span className={styles.dot} />
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
}
