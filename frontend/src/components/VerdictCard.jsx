export default function VerdictCard({ verdict, agentOutputs, loading, ticker }) {
  if (loading) return (
    <div className="rounded-2xl p-5 border animate-fade-in"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="skeleton h-6 w-32 mb-4 rounded" />
      <div className="skeleton h-16 w-full mb-3 rounded-xl" />
      <div className="skeleton h-40 w-full rounded-xl" />
    </div>
  );

  if (!verdict) return null;

  const {
    verdict: v, confidence, price_target, stop_loss,
    summary, bull_case, bear_case,
    critic_challenge, critic_note, critic_passed,
  } = verdict;

  const verdictConfig = {
    BUY:  { bg: '#00C89612', border: '#00C89640', color: '#00C896', icon: '↑' },
    SELL: { bg: '#FF4D4D12', border: '#FF4D4D40', color: '#FF4D4D', icon: '↓' },
    HOLD: { bg: '#F5A62312', border: '#F5A62340', color: '#F5A623', icon: '→' },
  };
  const cfg = verdictConfig[v] || verdictConfig.HOLD;

  const agents = agentOutputs ? [
    { name: 'Market Data',      content: agentOutputs.market_data  },
    { name: 'News Sentinel',    content: agentOutputs.news         },
    { name: 'Sentiment Oracle', content: agentOutputs.sentiment    },
    { name: 'Fundamentals',     content: agentOutputs.fundamentals },
    { name: 'Technical',        content: agentOutputs.technical    },
    { name: 'Risk Assessor',    content: agentOutputs.risk         },
  ] : [];

  return (
    <div
      className="rounded-2xl overflow-hidden animate-slide-up"
      style={{ border: `1.5px solid ${cfg.border}` }}
    >
      {/* ── VERDICT HEADER ── */}
      <div className="p-5" style={{ background: cfg.bg }}>

        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
              AI Research Verdict
            </p>
            <p className="text-[36px] font-bold leading-none tracking-tight" style={{ color: cfg.color }}>
              {cfg.icon} {v}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Confidence
            </p>
            <p className="text-[30px] font-bold font-mono leading-none" style={{ color: cfg.color }}>
              {confidence}%
            </p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="h-2 rounded-full overflow-hidden mb-4"
          style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="h-full rounded-full"
            style={{ width: `${confidence}%`, background: cfg.color, transition: 'width 1s ease' }} />
        </div>

        {/* BUY / HOLD / SELL pills */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['BUY', 'HOLD', 'SELL'].map(opt => {
            const c = verdictConfig[opt];
            const active = v === opt;
            return (
              <div key={opt}
                className="py-2 rounded-xl text-center text-sm font-bold"
                style={{
                  background:  active ? `${c.color}25` : 'rgba(255,255,255,0.04)',
                  border:      `1.5px solid ${active ? c.color : 'var(--border)'}`,
                  color:       active ? c.color : 'var(--text-tertiary)',
                }}>
                {opt}
              </div>
            );
          })}
        </div>

        {/* Price targets */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-tertiary)' }}>Price Target</p>
            <p className="text-sm font-mono font-bold" style={{ color: '#00C896' }}>
              ₹{price_target?.toFixed(2) ?? '—'}
            </p>
          </div>
          <div className="rounded-xl p-3"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-tertiary)' }}>Stop Loss</p>
            <p className="text-sm font-mono font-bold" style={{ color: '#FF4D4D' }}>
              ₹{stop_loss?.toFixed(2) ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ background: 'var(--bg-card)' }}>

        {/* Summary */}
        {summary && (
          <div className="px-5 pt-4 pb-0">
            <p className="text-[12px] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}>
              {summary}
            </p>
          </div>
        )}

        {/* Bull / Bear */}
        {(bull_case || bear_case) && (
          <div className="px-5 pt-3 grid grid-cols-1 gap-2">
            {bull_case && (
              <div className="p-3 rounded-xl"
                style={{ background: '#00C89610', border: '1px solid #00C89625' }}>
                <p className="text-[10px] font-bold mb-1" style={{ color: '#00C896' }}>▲ BULL CASE</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {bull_case}
                </p>
              </div>
            )}
            {bear_case && (
              <div className="p-3 rounded-xl"
                style={{ background: '#FF4D4D10', border: '1px solid #FF4D4D25' }}>
                <p className="text-[10px] font-bold mb-1" style={{ color: '#FF4D4D' }}>▼ BEAR CASE</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {bear_case}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Agent outputs */}
        {agents.filter(a => a.content).length > 0 && (
          <div className="px-5 pt-3 space-y-1.5">
            {agents.map(({ name, content }) => !content ? null : (
              <div key={name} className="p-3 rounded-xl"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: '#3B82F6' }}>
                  {name}
                </p>
                <p className="text-[11px] leading-relaxed line-clamp-2"
                  style={{ color: 'var(--text-secondary)' }}>
                  {content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="mx-5 mt-4 mb-0 h-px" style={{ background: 'var(--border)' }} />

        {/* Critic box */}
        <div className="mx-5 mt-3 p-3 rounded-xl"
          style={{
            background:  critic_passed ? '#00C89610' : '#F5A62310',
            border:      `1px solid ${critic_passed ? '#00C89630' : '#F5A62330'}`,
          }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
            style={{ color: critic_passed ? '#00C896' : '#F5A623' }}>
            {critic_passed ? '✓  Critic Approved' : '⚠  Critic Challenged'}
          </p>
          <p className="text-[11px] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}>
            {critic_note || critic_challenge || '—'}
          </p>
        </div>

        {/* Attribution */}
        <p className="text-center text-[10px] mt-3"
          style={{ color: 'var(--text-tertiary)' }}>
          Synthesized from 6 agents · LangGraph · CrewAI
        </p>

        {/* Export button */}
        <div className="p-5 pt-3">
          <button
            onClick={() => window.open(
              `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/export/${ticker}`,
              '_blank'
            )}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background:  'var(--bg-secondary)',
              border:      '1.5px solid var(--border)',
              color:       'var(--text-secondary)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#00C896';
              e.currentTarget.style.color       = '#00C896';
              e.currentTarget.style.background  = '#00C89612';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color       = 'var(--text-secondary)';
              e.currentTarget.style.background  = 'var(--bg-secondary)';
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1.5V10M7.5 10L4.5 7M7.5 10L10.5 7"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12.5H13"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Export PDF Research Report
          </button>
        </div>

      </div>
    </div>
  );
}