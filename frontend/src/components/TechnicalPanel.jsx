export default function TechnicalPanel({ indicators, loading }) {
  if (loading) return (
    <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-border">
      <div className="skeleton h-5 w-40 mb-4"/>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 w-full"/>)}
      </div>
    </div>
  );

  if (!indicators) return null;

  const getSignalStyle = (label) => {
    const l = label?.toLowerCase() ?? '';
    if (l.includes('bull') || l.includes('above') || l.includes('uptrend') || l.includes('oversold')) 
      return { bg: 'var(--green-dim)', color: 'var(--green)', dot: 'var(--green)' };
    if (l.includes('bear') || l.includes('below') || l.includes('downtrend') || l.includes('overbought'))
      return { bg: 'var(--red-dim)', color: 'var(--red)', dot: 'var(--red)' };
    return { bg: 'rgba(248,200,80,0.1)', color: 'var(--amber)', dot: 'var(--amber)' };
  };

  const rows = [
    { label: 'RSI (14)', value: indicators.rsi?.toFixed(2), signal: indicators.rsi_signal },
    { label: 'MACD', value: indicators.macd?.toFixed(2), signal: indicators.macd_label },
    { label: 'SMA 50', value: `₹${indicators.sma_50?.toFixed(2)}`, signal: indicators.sma50_signal },
    { label: 'SMA 200', value: `₹${indicators.sma_200?.toFixed(2)}`, signal: indicators.sma200_signal },
    { label: 'Bollinger Upper', value: `₹${indicators.bollinger_upper?.toFixed(2)}`, signal: 'Resistance zone' },
    { label: 'Bollinger Lower', value: `₹${indicators.bollinger_lower?.toFixed(2)}`, signal: 'Support zone' },
    { label: 'Support', value: `₹${indicators.support?.toFixed(2)}`, signal: 'Key level' },
    { label: 'Resistance', value: `₹${indicators.resistance?.toFixed(2)}`, signal: 'Key level' },
  ];

  // Overall signal
  const bearish = [indicators.macd_label, indicators.sma50_signal, indicators.sma200_signal]
    .filter(s => s?.toLowerCase().includes('bear') || s?.toLowerCase().includes('below') || s?.toLowerCase().includes('down')).length;
  const overallSignal = bearish >= 2 ? 'Bearish' : bearish === 0 ? 'Bullish' : 'Neutral';
  const overallStyle = getSignalStyle(overallSignal);

  return (
    <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Technical Indicators</h3>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" 
          style={{ background: overallStyle.bg, color: overallStyle.color }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: overallStyle.dot }}/>
          {overallSignal}
        </div>
      </div>

      <div className="space-y-1.5">
        {rows.map(({ label, value, signal }) => {
          const style = getSignalStyle(signal);
          return (
            <div key={label} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
              <span className="text-xs text-[var(--text-secondary)]">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-[var(--text-primary)]">{value}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: style.bg, color: style.color }}>
                  {signal}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}