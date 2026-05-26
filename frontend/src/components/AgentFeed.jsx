import { useEffect, useRef } from 'react';

const STATUS_CONFIG = {
  running: { color: 'var(--amber)', icon: '○', pulse: true },
  done: { color: 'var(--green)', icon: '✓', pulse: false },
  error: { color: 'var(--red)', icon: '✗', pulse: false },
  warning: { color: 'var(--amber)', icon: '⚠', pulse: false },
};

export default function AgentFeed({ events, analyzing }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-border animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Live Agent Activity</h3>
        {analyzing && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" style={{ animation: 'pulse-dot 1s infinite' }}/>
            <span className="text-xs text-[var(--amber)]">Running</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
        {events.length === 0 && !analyzing && (
          <div className="text-xs text-[var(--text-tertiary)] text-center py-8">
            Search a stock to start analysis
          </div>
        )}
        {events.map((event, i) => {
          const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.running;
          return (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors animate-slide-up">
              <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0"
                style={{ background: `${cfg.color}20`, color: cfg.color }}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: cfg.color }}>
                  {event.agent}
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{event.message}</p>
              </div>
            </div>
          );
        })}
        {analyzing && events.length > 0 && (
          <div className="flex items-center gap-3 p-2.5">
            <div className="w-4 h-4 rounded-full border border-[var(--amber)] border-t-transparent animate-spin shrink-0"/>
            <span className="text-xs text-[var(--amber)]">Processing...</span>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
    </div>
  );
}