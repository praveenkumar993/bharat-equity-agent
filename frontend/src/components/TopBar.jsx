import { useState } from 'react';
import { POPULAR_TICKERS } from '../lib/api';

export default function TopBar({ onSearch, currentTicker }) {
  const [query, setQuery] = useState('');
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
          <span className="font-semibold text-[15px] tracking-tight text-white">
            Bharat<span style={{color:'var(--green)'}}>Equity</span>
          </span>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <form onSubmit={handleSubmit}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
              focused ? 'border-[#00C896] bg-[#141B2D]' : 'border-border bg-[#141B2D]'
            }`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" style={{color:'var(--text-secondary)'}}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                placeholder="Search ticker... RELIANCE.NS, TCS.NS, AAPL"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)] text-[var(--text-primary)]"
              />
              {query && (
                <kbd className="text-[10px] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded border border-border font-mono">↵</kbd>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                currentTicker === t.symbol
                  ? 'bg-[var(--green-dim)] text-[var(--green)] border border-[var(--green)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" style={{animation:'pulse-dot 2s infinite'}}/>
            <span className="text-xs text-[var(--text-secondary)]">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}