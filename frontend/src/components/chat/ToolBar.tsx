import {
  Building2,
  Download,
  FileSearch,
  LineChart,
  Users,
} from 'lucide-react';
import type { ToolId } from '../../types';
import { TOOLBAR_ITEMS } from '../../lib/tools';
import styles from './ToolBar.module.css';

const TOOL_ICONS: Record<ToolId, typeof Building2> = {
  three_body_compare: Building2,
  scan_peers: Users,
  conviction_rank: LineChart,
  forward_signal: FileSearch,
  divergence_narrative: FileSearch,
  export_brief: Download,
};

interface ToolBarProps {
  onRunTool: (toolId: ToolId, label: string) => void;
}

export function ToolBar({ onRunTool }: ToolBarProps) {
  return (
    <div className={styles.bar} role="toolbar" aria-label="Analysis tools">
      <div className={styles.actions}>
        {TOOLBAR_ITEMS.map(({ toolId, label, description }) => {
          const Icon = TOOL_ICONS[toolId];

          return (
            <button
              key={toolId}
              type="button"
              className={styles.pill}
              title={description}
              onClick={() => onRunTool(toolId, label)}
            >
              <Icon size={15} strokeWidth={1.75} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
