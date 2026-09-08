import {
  Briefcase,
  Download,
  FolderOpen,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Star,
  Table2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { LogoOrb } from '../ui/LogoOrb';
import styles from './Sidebar.module.css';

interface SidebarProps {
  onNewChat: () => void;
  expanded: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { icon: MessageSquare, label: 'Chats' },
  { icon: FolderOpen, label: 'Sessions' },
  { icon: Star, label: 'Pinned' },
  { icon: Table2, label: 'Panels' },
  { icon: Briefcase, label: 'Briefs' },
];

const RECENTS = [
  'Barclays investor analysis',
  'Shell peer comparison',
  'HSBC conviction heatmap',
  'BP auditor 12mo view',
  'FTSE100 benchmark scan',
  'Burberry divergence narrative',
];

export function Sidebar({ onNewChat, expanded, onToggle }: SidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!expanded) setSearchOpen(false);
  }, [expanded]);

  return (
    <aside
      className={`${styles.sidebar} ${expanded ? styles.expanded : styles.collapsed}`}
      aria-label="Sidebar"
    >
      <div className={styles.header}>
        {expanded ? (
          <>
            <div className={styles.brand}>
              <LogoOrb size="sm" />
              <span className={styles.brandName}>Three-Body</span>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.headerBtn}
                aria-label="Search chats"
                onClick={() => setSearchOpen((prev) => !prev)}
              >
                <Search size={16} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className={styles.headerBtn}
                aria-label="Collapse sidebar"
                onClick={onToggle}
              >
                <PanelLeftClose size={16} strokeWidth={1.75} />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className={styles.toggleOnly}
            aria-label="Expand sidebar"
            onClick={onToggle}
          >
            <PanelLeftOpen size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {expanded && searchOpen && (
        <div className={styles.searchWrap}>
          <Search size={14} strokeWidth={1.75} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search analyses..."
            aria-label="Search analyses"
          />
        </div>
      )}

      <div className={styles.body}>
        <button
          type="button"
          className={`${styles.navItem} ${styles.newChat}`}
          onClick={onNewChat}
        >
          <Plus size={18} strokeWidth={1.75} />
          {expanded && <span>New analysis</span>}
        </button>

        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <button key={label} type="button" className={styles.navItem} aria-label={label}>
              <Icon size={18} strokeWidth={1.75} />
              {expanded && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {expanded && (
          <section className={styles.recents} aria-label="Recent analyses">
            <h2 className={styles.recentsTitle}>Recents</h2>
            <ul className={styles.recentsList}>
              {RECENTS.map((title) => (
                <li key={title}>
                  <button type="button" className={styles.recentItem}>
                    {title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.navItem} aria-label="Export">
          <Download size={18} strokeWidth={1.75} />
          {expanded && <span>Export</span>}
        </button>

        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden="true">
            ST
          </div>
          {expanded && (
            <div className={styles.profileMeta}>
              <span className={styles.profileName}>Shivam Tiwari</span>
              <span className={styles.profilePlan}>Hackathon · FTSE100</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function BrandMark() {
  return <LogoOrb size="lg" />;
}
