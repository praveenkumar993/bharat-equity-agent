import { useEffect, useRef, useState, Component } from 'react';

const PERIODS = ['1W', '1M', '3M', '6M', '1Y'];

// ── Error boundary — catches chart crash gracefully ──
class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || 'Chart failed to load' };
  }
  componentDidCatch(err) {
    console.warn('PriceChart error:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full rounded-xl flex flex-col items-center justify-center gap-3"
          style={{ height: 340, background: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="var(--text-tertiary)" strokeWidth="1.5"/>
            <path d="M16 10V17" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="16" cy="22" r="1.5" fill="var(--text-tertiary)"/>
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Chart unavailable
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {this.state.message}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Inner chart — wrapped by the error boundary ──
function ChartInner({ history, indicators, period }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!history?.length || !containerRef.current) return;

    let chart;

    const init = async () => {
      // Clean up any previous instance
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch {}
        chartRef.current = null;
        setReady(false);
      }

      const { createChart, CrosshairMode, LineStyle } = await import('lightweight-charts');

      // Filter by period
      const now    = new Date();
      const cutoff = new Date();
      if      (period === '1W') cutoff.setDate(now.getDate() - 7);
      else if (period === '1M') cutoff.setMonth(now.getMonth() - 1);
      else if (period === '3M') cutoff.setMonth(now.getMonth() - 3);
      else if (period === '6M') cutoff.setMonth(now.getMonth() - 6);
      else                      cutoff.setFullYear(now.getFullYear() - 1);

      const filtered = history.filter(d => new Date(d.date) >= cutoff);
      if (!filtered.length) return;

      chart = createChart(containerRef.current, {
        width:  containerRef.current.clientWidth,
        height: 340,
        layout: {
          background:  { color: 'transparent' },
          textColor:   '#8896B0',
          fontSize:    11,
          fontFamily:  'DM Mono',
        },
        grid: {
          vertLines: { color: '#1E2A4018', style: LineStyle.Dashed },
          horzLines: { color: '#1E2A4018', style: LineStyle.Dashed },
        },
        crosshair:       { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#1E2A40', textColor: '#8896B0' },
        timeScale:       { borderColor: '#1E2A40', timeVisible: true, secondsVisible: false },
        handleScroll:    true,
        handleScale:     true,
      });

      // Candlestick series
      const candleSeries = chart.addCandlestickSeries({
        upColor:        '#00C896',
        downColor:      '#FF4D4D',
        borderUpColor:  '#00C896',
        borderDownColor:'#FF4D4D',
        wickUpColor:    '#00C89680',
        wickDownColor:  '#FF4D4D80',
      });
      candleSeries.setData(filtered.map(d => ({
        time:  d.date,
        open:  d.open,
        high:  d.high,
        low:   d.low,
        close: d.close,
      })));

      // Volume series
      const volumeSeries = chart.addHistogramSeries({
        priceFormat:   { type: 'volume' },
        priceScaleId:  'volume',
        scaleMargins:  { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(filtered.map(d => ({
        time:  d.date,
        value: d.volume,
        color: d.close >= d.open ? '#00C89625' : '#FF4D4D25',
      })));

      // SMA 50
      if (indicators?.sma_50) {
        const s50 = chart.addLineSeries({
          color:                '#F5A62380',
          lineWidth:            1,
          crosshairMarkerVisible: false,
          lastValueVisible:     false,
          priceLineVisible:     false,
        });
        s50.setData(filtered.map(d => ({ time: d.date, value: indicators.sma_50 })));
      }

      // SMA 200
      if (indicators?.sma_200) {
        const s200 = chart.addLineSeries({
          color:                '#3B82F680',
          lineWidth:            1,
          crosshairMarkerVisible: false,
          lastValueVisible:     false,
          priceLineVisible:     false,
        });
        s200.setData(filtered.map(d => ({ time: d.date, value: indicators.sma_200 })));
      }

      // Support / Resistance price lines
      if (indicators?.support) {
        candleSeries.createPriceLine({
          price:            indicators.support,
          color:            '#00C89650',
          lineWidth:        1,
          lineStyle:        LineStyle.Dashed,
          axisLabelVisible: true,
          title:            'Support',
        });
      }
      if (indicators?.resistance) {
        candleSeries.createPriceLine({
          price:            indicators.resistance,
          color:            '#FF4D4D50',
          lineWidth:        1,
          lineStyle:        LineStyle.Dashed,
          axisLabelVisible: true,
          title:            'Resistance',
        });
      }

      chart.timeScale().fitContent();
      chartRef.current = chart;
      setReady(true);

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) {
          try {
            chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
          } catch {}
        }
      });
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    };

    init();

    return () => {
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch {}
        chartRef.current = null;
        setReady(false);
      }
    };
  }, [history, period, indicators]);

  return (
    <div className="relative w-full" style={{ minHeight: 340 }}>
      {/* Skeleton shown until chart is ready */}
      {!ready && (
        <div
          className="absolute inset-0 skeleton rounded-xl"
          style={{ zIndex: 1 }}
        />
      )}
      <div ref={containerRef} className="w-full" style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.3s' }} />
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export default function PriceChart({ history, indicators }) {
  const [period, setPeriod] = useState('6M');

  // No data yet — show skeleton
  if (!history?.length) {
    return (
      <div
        className="rounded-2xl p-5 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <div key={p} className="skeleton h-7 w-9 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="skeleton w-full rounded-xl" style={{ height: 340 }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 border animate-slide-up"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Price Chart
          </h3>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block rounded" style={{ background: '#F5A62380' }} />
              SMA 50
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block rounded" style={{ background: '#3B82F680' }} />
              SMA 200
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block border-t border-dashed" style={{ borderColor: '#00C89650', width: 12 }} />
              Support
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block border-t border-dashed" style={{ borderColor: '#FF4D4D50', width: 12 }} />
              Resistance
            </span>
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: period === p ? 'var(--green)' : 'transparent',
                color:      period === p ? '#000'         : 'var(--text-secondary)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart wrapped in error boundary */}
      <ChartErrorBoundary>
        <ChartInner history={history} indicators={indicators} period={period} />
      </ChartErrorBoundary>
    </div>
  );
}