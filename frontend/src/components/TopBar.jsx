import { useState } from 'react';
import { POPULAR_TICKERS } from '../lib/api';

export default function TopBar({ onSearch, currentTicker, theme, onThemeToggle }) {
  const [query, setQuery]   = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim().toUpperCase());
      setQuery('');
      setFocused(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 glass border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between gap-6">

        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00C896] to-[#0080FF] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M7 5L9 7L7 9L5 7L7 5Z" fill="white"/>
            </svg>
          </div>
          <span className="font-semibold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Bharat<span style={{ color: 'var(--green)' }}>Equity</span>
          </span>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <form onSubmit={handleSubmit}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
              focused ? 'border-[#00C896]' : 'border-border'
            }`} style={{ background: 'var(--bg-card)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" style={{ color: 'var(--text-secondary)' }}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                placeholder="Search ticker... RELIANCE.NS, TCS.NS, AAPL"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)', caretColor: 'var(--green)' }}
              />
              {query && (
                <kbd className="text-[10px] px-1.5 py-0.5 rounded border font-mono"
                  style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border)' }}>↵</kbd>
              )}
            </div>
          </form>
        </div>

        {/* Quick tickers */}
        <div className="hidden lg:flex items-center gap-1">
          {POPULAR_TICKERS.slice(0, 4).map(t => (
            <button
              key={t.symbol}
              onClick={() => onSearch(t.symbol)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
              style={{
                background: currentTicker === t.symbol ? 'var(--green-dim)' : 'transparent',
                color: currentTicker === t.symbol ? 'var(--green)' : 'var(--text-secondary)',
                border: `1px solid ${currentTicker === t.symbol ? 'var(--green)' : 'transparent'}`,
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Right side — theme toggle + live dot */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Theme toggle */}
          <button
            onClick={onThemeToggle}
            title="Toggle light / dark"
            className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:border-[var(--green)]"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            {theme === 'dark' ? (
              /* Sun icon */
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="2.5" stroke="var(--text-secondary)" strokeWidth="1.4"/>
                <path d="M7 1.5V2.5M7 11.5V12.5M1.5 7H2.5M11.5 7H12.5M3.1 3.1L3.8 3.8M10.2 10.2L10.9 10.9M3.1 10.9L3.8 10.2M10.2 3.8L10.9 3.1"
                  stroke="var(--text-secondary)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ) : (
              /* Moon icon */
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M12 8A5 5 0 1 1 6 2a3.5 3.5 0 0 0 6 6Z"
                  stroke="var(--text-secondary)" strokeWidth="1.4"/>
              </svg>
            )}
          </button>

          {/* Live dot */}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]"
              style={{ animation: 'pulse-dot 2s infinite' }}/>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Live</span>
          </div>
        </div>

      </div>
    </div>
  );
}