import styles from './LogoOrb.module.css';

type LogoOrbSize = 'sm' | 'lg';

interface LogoOrbProps {
  size?: LogoOrbSize;
  className?: string;
  animated?: boolean;
}

export function LogoOrb({ size = 'sm', className, animated = true }: LogoOrbProps) {
  return (
    <span
      className={[
        styles.orb,
        styles[size],
        animated ? styles.animated : styles.static,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <span className={styles.halo} />
      <span className={styles.sphere}>
        <span className={styles.base} />
        <span className={styles.core} />
        <span className={`${styles.node} ${styles.nodeOne}`} />
        <span className={`${styles.node} ${styles.nodeTwo}`} />
        <span className={`${styles.node} ${styles.nodeThree}`} />
        <span className={styles.rim} />
        <span className={styles.shine} />
      </span>
      <span className={styles.ring} />
    </span>
  );
}
