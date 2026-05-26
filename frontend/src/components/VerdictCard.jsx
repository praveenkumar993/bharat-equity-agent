export default function VerdictCard({ verdict, agentOutputs, loading }) {
  if (loading) return (
    <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-border">
      <div className="skeleton h-6 w-32 mb-4"/>
      <div className="skeleton h-16 w-full mb-3 rounded-xl"/>
      <div className="skeleton h-40 w-full rounded-xl"/>
    </div>
  );

  if (!verdict) return null;

  const { verdict: v, confidence, price_target, stop_loss, summary, bull_case, bear_case, critic_challenge, critic_note, critic_passed } = verdict;

  const verdictConfig = {
    BUY: { bg: 'linear-gradient(135deg, #00C89615, #00C89605)', border: '#00C89640', color: 'var(--green)', icon: '↑' },
    SELL: { bg: 'linear-gradient(135deg, #FF4D4D15, #FF4D4D05)', border: '#FF4D4D40', color: 'var(--red)', icon: '↓' },
    HOLD: { bg: 'linear-gradient(135deg, #F5A62315, #F5A62305)', border: '#F5A62340', color: 'var(--amber)', icon: '→' },
  };
  const cfg = verdictConfig[v] || verdictConfig.HOLD;

  const agents = agentOutputs ? [
    { name: 'Market Data', content: agentOutputs.market_data },
    { name: 'News Sentinel', content: agentOutputs.news },
    { name: 'Sentiment Oracle', content: agentOutputs.sentiment },
    { name: 'Fundamentals', content: agentOutputs.fundamentals },
    { name: 'Technical Chartist', content: agentOutputs.technical },
    { name: 'Risk Assessor', content: agentOutputs.risk },
  ] : [];

  return (
    <div className="rounded-2xl overflow-hidden border animate-slide-up" style={{ borderColor: cfg.border }}>
      {/* Header */}
      <div className="p-5" style={{ background: cfg.bg }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-[var(--text-secondary)] mb-1">AI Research Verdict</div>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold tracking-tight" style={{ color: cfg.color }}>
                {cfg.icon} {v}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--text-secondary)] mb-1">Confidence</div>
            <div className="text-3xl font-bold font-mono" style={{ color: cfg.color }}>{confidence}%</div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${confidence}%`, background: cfg.color }}
          />
        </div>

        {/* Verdict buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['BUY', 'HOLD', 'SELL'].map(opt => {
            const c = verdictConfig[opt];
            return (
              <div key={opt} className={`py-2 rounded-xl text-center text-sm font-semibold border transition-all ${v === opt ? 'border-current' : 'border-border opacity-30'}`}
                style={{ color: c.color, borderColor: v === opt ? c.color : undefined }}>
                {opt}
              </div>
            );
          })}
        </div>

        {/* Price targets */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-card)] rounded-xl p-3 border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Price Target</div>
            <div className="text-sm font-mono font-semibold" style={{ color: 'var(--green)' }}>
              ₹{price_target?.toFixed(2) ?? '—'}
            </div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl p-3 border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Stop Loss</div>
            <div className="text-sm font-mono font-semibold" style={{ color: 'var(--red)' }}>
              ₹{stop_loss?.toFixed(2) ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-4 bg-[var(--bg-card)] border-t border-border">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">{summary}</p>

        <div className="grid grid-cols-1 gap-2 mb-4">
          <div className="p-3 rounded-xl bg-[var(--green-dim)] border border-[#00C89620]">
            <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--green)' }}>BULL CASE</div>
            <p className="text-xs text-[var(--text-secondary)]">{bull_case}</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--red-dim)] border border-[#FF4D4D20]">
            <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--red)' }}>BEAR CASE</div>
            <p className="text-xs text-[var(--text-secondary)]">{bear_case}</p>
          </div>
        </div>

        {/* Agent outputs */}
        <div className="space-y-2">
          {agents.map(({ name, content }) => content && (
            <div key={name} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-border">
              <div className="text-[10px] font-medium text-[var(--accent)] mb-1 uppercase tracking-wide">{name}</div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">{content}</p>
            </div>
          ))}
        </div>

        {/* Critic */}
        <div className={`mt-3 p-3 rounded-xl border ${critic_passed ? 'border-[#00C89620] bg-[var(--green-dim)]' : 'border-[#F5A62320] bg-[rgba(245,166,35,0.05)]'}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`text-[10px] font-medium uppercase tracking-wide ${critic_passed ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>
              {critic_passed ? '✓ Critic Approved' : '⚠ Critic Challenged'}
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{critic_note || critic_challenge}</p>
        </div>

        <div className="mt-3 text-[10px] text-[var(--text-tertiary)] text-center">
          Synthesized from 6 agents · LangGraph orchestration · CrewAI
        </div>
      </div>
    </div>
  );
}