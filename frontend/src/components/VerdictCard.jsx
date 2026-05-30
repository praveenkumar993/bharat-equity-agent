export default function VerdictCard({ verdict, agentOutputs, loading, ticker }) {
  if (loading) return (
    <div className="rounded-2xl p-5 border animate-fade-in"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="skeleton h-6 w-32 mb-4 rounded"/>
      <div className="skeleton h-16 w-full mb-3 rounded-xl"/>
      <div className="skeleton h-40 w-full rounded-xl"/>
    </div>
  );

  if (!verdict) return null;

  const {
    verdict: v, confidence, price_target, stop_loss,
    summary, bull_case, bear_case,
    critic_challenge, critic_note, critic_passed,
  } = verdict;

  const verdictConfig = {
    BUY:  { bg: 'linear-gradient(135deg,#00C89615,#00C89605)', border: '#00C89640', color: 'var(--green)', icon: '↑' },
    SELL: { bg: 'linear-gradient(135deg,#FF4D4D15,#FF4D4D05)', border: '#FF4D4D40', color: 'var(--red)',   icon: '↓' },
    HOLD: { bg: 'linear-gradient(135deg,#F5A62315,#F5A62305)', border: '#F5A62340', color: 'var(--amber)', icon: '→' },
  };
  const cfg = verdictConfig[v] || verdictConfig.HOLD;

  const agents = agentOutputs ? [
    { name: 'Market Data',      content: agentOutputs.market_data   },
    { name: 'News Sentinel',    content: agentOutputs.news          },
    { name: 'Sentiment Oracle', content: agentOutputs.sentiment     },
    { name: 'Fundamentals',     content: agentOutputs.fundamentals  },
    { name: 'Technical',        content: agentOutputs.technical     },
    { name: 'Risk Assessor',    content: agentOutputs.risk          },
  ] : [];

  return (
    <div className="rounded-2xl overflow-hidden border animate-slide-up"
      style={{ borderColor: cfg.border }}>

      {/* ── Top section — verdict header ── */}
      <div className="p-5" style={{ background: cfg.bg }}>

        {/* Verdict + confidence */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              AI Research Verdict
            </div>
            <div className="text-4xl font-bold tracking-tight" style={{ color: cfg.color }}>
              {cfg.icon} {v}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Confidence</div>
            <div className="text-3xl font-bold font-mono" style={{ color: cfg.color }}>
              {confidence}%
            </div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="h-2 rounded-full overflow-hidden mb-4"
          style={{ background: 'var(--bg-primary)' }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${confidence}%`, background: cfg.color }}/>
        </div>

        {/* BUY / HOLD / SELL selector display */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['BUY', 'HOLD', 'SELL'].map(opt => {
            const c = verdictConfig[opt];
            return (
              <div key={opt}
                className="py-2 rounded-xl text-center text-sm font-semibold border transition-all"
                style={{
                  color:        c.color,
                  borderColor:  v === opt ? c.color : 'var(--border)',
                  background:   v === opt ? `${c.color}15` : 'transparent',
                  opacity:      v === opt ? 1 : 0.35,
                }}>
                {opt}
              </div>
            );
          })}
        </div>

        {/* Price targets */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-[10px] uppercase tracking-wide mb-1"
              style={{ color: 'var(--text-tertiary)' }}>Price Target</div>
            <div className="text-sm font-mono font-semibold" style={{ color: 'var(--green)' }}>
              ₹{price_target?.toFixed(2) ?? '—'}
            </div>
          </div>
          <div className="rounded-xl p-3 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-[10px] uppercase tracking-wide mb-1"
              style={{ color: 'var(--text-tertiary)' }}>Stop Loss</div>
            <div className="text-sm font-mono font-semibold" style={{ color: 'var(--red)' }}>
              ₹{stop_loss?.toFixed(2) ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom section — details ── */}
      <div className="p-5 border-t"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

        {/* Summary */}
        {summary && (
          <p className="text-xs leading-relaxed mb-4"
            style={{ color: 'var(--text-secondary)' }}>
            {summary}
          </p>
        )}

        {/* Bull / Bear */}
        <div className="grid grid-cols-1 gap-2 mb-4">
          {bull_case && (
            <div className="p-3 rounded-xl border"
              style={{ background: 'var(--green-dim)', borderColor: '#00C89620' }}>
              <div className="text-[10px] font-semibold mb-1" style={{ color: 'var(--green)' }}>
                ▲ BULL CASE
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {bull_case}
              </p>
            </div>
          )}
          {bear_case && (
            <div className="p-3 rounded-xl border"
              style={{ background: 'var(--red-dim)', borderColor: '#FF4D4D20' }}>
              <div className="text-[10px] font-semibold mb-1" style={{ color: 'var(--red)' }}>
                ▼ BEAR CASE
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {bear_case}
              </p>
            </div>
          )}
        </div>

        {/* Agent outputs */}
        {agents.filter(a => a.content).length > 0 && (
          <div className="space-y-2 mb-4">
            {agents.map(({ name, content }) => content && (
              <div key={name} className="p-3 rounded-xl border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                  style={{ color: 'var(--accent)' }}>
                  {name}
                </div>
                <p className="text-[11px] leading-relaxed line-clamp-3"
                  style={{ color: 'var(--text-secondary)' }}>
                  {content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Critic */}
        <div className="p-3 rounded-xl border mb-4"
          style={{
            background:  critic_passed ? 'var(--green-dim)' : 'rgba(245,166,35,0.07)',
            borderColor: critic_passed ? '#00C89625'        : '#F5A62325',
          }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: critic_passed ? 'var(--green)' : 'var(--amber)' }}>
              {critic_passed ? '✓ Critic Approved' : '⚠ Critic Challenged'}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}>
            {critic_note || critic_challenge}
          </p>
        </div>

        {/* Attribution */}
        <p className="text-[10px] text-center mb-4"
          style={{ color: 'var(--text-tertiary)' }}>
          Synthesized from 6 agents · LangGraph orchestration · CrewAI
        </p>

        {/* Export button — full width, properly aligned */}
        <button
          onClick={() => window.open(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/export/${ticker}`,
            '_blank'
          )}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all duration-200"
          style={{
            borderColor: 'var(--border)',
            color:       'var(--text-secondary)',
            background:  'var(--bg-secondary)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--green)';
            e.currentTarget.style.color       = 'var(--green)';
            e.currentTarget.style.background  = 'var(--green-dim)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color       = 'var(--text-secondary)';
            e.currentTarget.style.background  = 'var(--bg-secondary)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1V9M7 9L4 6M7 9L10 6"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M2 11H12"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Export PDF Research Report
        </button>

      </div>
    </div>
  );
}