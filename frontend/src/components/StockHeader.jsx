export default function StockHeader({ data, loading }) {
  if (loading) return (
    <div className="rounded-2xl p-6 bg-[var(--bg-card)] border border-border animate-fade-in">
      <div className="skeleton h-7 w-48 mb-3"/>
      <div className="skeleton h-10 w-36 mb-4"/>
      <div className="skeleton h-4 w-full"/>
    </div>
  );

  if (!data) return null;

  const { market_data: m } = data;
  const change = m.current_price - m.previous_close;
  const changePct = ((change / m.previous_close) * 100).toFixed(2);
  const isPositive = change >= 0;
  const rangePos = ((m.current_price - m.week_52_low) / (m.week_52_high - m.week_52_low) * 100).toFixed(1);
  const marketCapCr = (m.market_cap / 1e7).toFixed(0);

  const fmt = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) ?? '—';

  return (
    <div className="rounded-2xl p-6 bg-[var(--bg-card)] border border-border animate-slide-up">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-md border border-border">
              {m.exchange} · {m.ticker}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">{m.sector}</span>
          </div>
          <h1 className="text-xl font-semibold text-white leading-tight">{m.name}</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{m.industry}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-semibold tracking-tight text-white font-mono">
            ₹{fmt(m.current_price)}
          </div>
          <div className={`flex items-center justify-end gap-1.5 mt-1 text-sm font-medium ${isPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(change).toFixed(2)} ({Math.abs(changePct)}%)</span>
          </div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">vs prev close ₹{fmt(m.previous_close)}</div>
        </div>
      </div>

      {/* 52W Range */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
          <span>52W Low ₹{fmt(m.week_52_low)}</span>
          <span className="text-[var(--text-tertiary)]">{rangePos}% of range</span>
          <span>52W High ₹{fmt(m.week_52_high)}</span>
        </div>
        <div className="relative h-1.5 bg-[var(--bg-secondary)] rounded-full">
          <div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              width: `${rangePos}%`,
              background: 'linear-gradient(90deg, var(--red), var(--amber), var(--green))'
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 shadow-lg"
            style={{ left: `calc(${rangePos}% - 6px)`, borderColor: 'var(--green)' }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Market Cap', value: `₹${Number(marketCapCr).toLocaleString('en-IN')} Cr` },
          { label: 'P/E Ratio', value: m.pe_ratio?.toFixed(2) ?? '—' },
          { label: 'EPS', value: `₹${m.eps?.toFixed(2) ?? '—'}` },
          { label: 'Volume', value: m.volume?.toLocaleString('en-IN') ?? '—' },
          { label: 'Day High', value: `₹${fmt(m.day_high)}` },
          { label: 'Day Low', value: `₹${fmt(m.day_low)}` },
          { label: 'Beta', value: m.beta?.toFixed(3) ?? '—' },
          { label: 'Div Yield', value: m.dividend_yield ? `${(m.dividend_yield * 100).toFixed(2)}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] mb-1 uppercase tracking-wide">{label}</div>
            <div className="text-sm font-mono font-medium text-[var(--text-primary)] truncate">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}