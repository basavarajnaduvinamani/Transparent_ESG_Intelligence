import styles from './SuggestedChips.module.css';

interface SuggestedChipsProps {
  chips: string[];
  onSelect: (chip: string) => void;
}

export function SuggestedChips({ chips, onSelect }: SuggestedChipsProps) {
  if (!chips.length) return null;

  return (
    <div className={styles.chips} role="group" aria-label="Suggested follow-ups">
      {chips.map((chip) => (
        <button key={chip} type="button" className={styles.chip} onClick={() => onSelect(chip)}>
          {chip}
        </button>
      ))}
    </div>
  );
}
