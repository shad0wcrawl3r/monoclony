// React is used via JSX transform
import type { LogEntry, LogType } from '../types';

interface LogPanelProps {
  log: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

const LOG_COLORS: Record<LogType, string> = {
  info:     '#e2e8f0',
  money:    '#3ddc84',
  property: '#4fc3f7',
  jail:     '#ff4f5e',
  card:     '#c084fc',
  warn:     '#f7c948',
};

export function LogPanel({ log, isOpen, onToggle }: LogPanelProps) {
  return (
    <div
      style={{
        background: '#12121a',
        border: '1px solid #2a2a3d',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: isOpen ? 200 : 32,
        transition: 'max-height 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        className="flex items-center justify-between w-full px-3"
        style={{
          height: 32,
          background: '#0f0f1a',
          border: 'none',
          borderBottom: isOpen ? '1px solid #2a2a3d' : 'none',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={onToggle}
      >
        <span className="font-pixel text-accent" style={{ fontSize: 14 }}>
          GAME LOG
        </span>
        <span className="font-vt text-pixel-dim" style={{ fontSize: 28 }}>
          [{log.length}] {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Log entries */}
      {isOpen && (
        <div
          className="flex flex-col-reverse overflow-y-auto"
          style={{ flex: 1, padding: '4px 8px', gap: 1 }}
        >
          {log.map(entry => (
            <div
              key={entry.id}
              className="font-vt"
              style={{
                fontSize: 28,
                color: LOG_COLORS[entry.type] ?? '#e2e8f0',
                lineHeight: 1.3,
                borderBottom: '1px solid #1a1a2a',
                paddingBottom: 1,
              }}
            >
              {entry.text}
            </div>
          ))}
          {log.length === 0 && (
            <div className="font-vt text-pixel-dim" style={{ fontSize: 28 }}>
              No events yet...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
