import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import styles from './CompanySelect.module.css';

export interface CompanyOption {
  value: string;
  label: string;
  description?: string;
}

interface CompanySelectProps {
  value: string;
  options: CompanyOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function CompanySelect({
  value,
  options,
  onChange,
  disabled = false,
  loading = false,
}: CompanySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const selected = options.find((o) => o.value === value);
  const triggerLabel = loading
    ? 'Loading companies…'
    : selected?.label ?? 'Select company…';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q),
    );
  }, [options, query]);

  const updateMenuPosition = () => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 8,
      left: Math.max(8, rect.right - 280),
      width: Math.max(rect.width, 280),
    });
  };

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();
    const onResize = () => updateMenuPosition();
    const onScroll = () => updateMenuPosition();

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
        setQuery('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const isDisabled = disabled || loading;

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            role="listbox"
            aria-label="Select FTSE100 company"
            style={{
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
            }}
          >
            <div className={styles.searchWrap}>
              <Search size={14} strokeWidth={2} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                type="text"
                value={query}
                placeholder="Search company or ticker…"
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.list}>
              {filtered.length === 0 ? (
                <p className={styles.empty}>No companies match your search.</p>
              ) : (
                filtered.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      <span className={styles.optionContent}>
                        <span className={styles.optionLabel}>{option.label}</span>
                        {option.description && (
                          <span className={styles.optionDescription}>{option.description}</span>
                        )}
                      </span>
                      {isSelected && (
                        <Check size={14} strokeWidth={2.5} className={styles.check} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={rootRef}
        className={`${styles.wrap} ${isDisabled ? styles.disabled : ''} ${open ? styles.open : ''}`}
      >
        <button
          type="button"
          className={styles.trigger}
          aria-label="Select FTSE100 company"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={isDisabled}
          onClick={() => {
            if (isDisabled) return;
            setOpen((prev) => !prev);
          }}
        >
          <span className={styles.triggerLabel}>{triggerLabel}</span>
          <ChevronDown size={14} strokeWidth={2} className={styles.chevron} />
        </button>
      </div>
      {menu}
    </>
  );
}
