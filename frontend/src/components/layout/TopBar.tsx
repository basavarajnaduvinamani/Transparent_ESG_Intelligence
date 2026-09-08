import { CompanySelect } from '../ui/CompanySelect';
import styles from './TopBar.module.css';

interface TopBarProps {
  backendOnline?: boolean;
  geminiReady?: boolean;
  companyCount?: number;
  companyOptions?: Array<{ value: string; label: string; description?: string }>;
  selectedCompany?: string;
  onCompanyChange?: (value: string) => void;
  companiesLoading?: boolean;
}

export function TopBar({
  backendOnline,
  geminiReady,
  companyCount,
  companyOptions = [],
  selectedCompany = '',
  onCompanyChange,
  companiesLoading,
}: TopBarProps) {
  const statusLabel = !backendOnline
    ? 'API offline'
    : geminiReady
      ? `API live · ${companyCount ?? 79} companies`
      : `API live · Gemini pending`;

  const statusClass = !backendOnline
    ? styles.statusOffline
    : geminiReady
      ? styles.statusLive
      : styles.statusPending;

  return (
    <header className={styles.topBar}>
      <button type="button" className={styles.planBadge}>
        <span className={styles.dot} aria-hidden="true" />
        FTSE100 · Materiality dataset
      </button>

      <div className={styles.right}>
        <span className={`${styles.status} ${statusClass}`}>{statusLabel}</span>
        <CompanySelect
          value={selectedCompany}
          options={companyOptions}
          onChange={(value) => onCompanyChange?.(value)}
          disabled={!backendOnline}
          loading={companiesLoading}
        />
      </div>
    </header>
  );
}
