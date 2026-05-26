import { useEffect, useRef, useState } from 'react';

const PERIODS = ['1W', '1M', '3M', '6M', '1Y'];

export default function PriceChart({ history, indicators }) {
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const [period, setPeriod] = useState('6M');
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (!history?.length || !containerRef.current) return;

    let chart, candleSeries, volumeSeries, sma50Series, sma200Series;

    const initChart = async () => {
      const { createChart, CrosshairMode, LineStyle } = await import('lightweight-charts');

      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 340,
        layout: {
          background: { color: 'transparent' },
          textColor: '#8896B0',
          fontSize: 11,
          fontFamily: 'DM Mono',
        },
        grid: {
          vertLines: { color: '#1E2A4015', style: LineStyle.Dashed },
          horzLines: { color: '#1E2A4015', style: LineStyle.Dashed },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: {
          borderColor: '#1E2A40',
          textColor: '#8896B0',
        },
        timeScale: {
          borderColor: '#1E2A40',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      // Filter by period
      const now = new Date();
      const cutoff = new Date();
      if (period === '1W') cutoff.setDate(now.getDate() - 7);
      else if (period === '1M') cutoff.setMonth(now.getMonth() - 1);
      else if (period === '3M') cutoff.setMonth(now.getMonth() - 3);
      else if (period === '6M') cutoff.setMonth(now.getMonth() - 6);
      else cutoff.setFullYear(now.getFullYear() - 1);

      const filtered = history.filter(d => new Date(d.date) >= cutoff);

      // Candlestick
      candleSeries = chart.addCandlestickSeries({
        upColor: '#00C896',
        downColor: '#FF4D4D',
        borderUpColor: '#00C896',
        borderDownColor: '#FF4D4D',
        wickUpColor: '#00C89680',
        wickDownColor: '#FF4D4D80',
      });
      candleSeries.setData(filtered.map(d => ({
        time: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      })));

      // Volume
      volumeSeries = chart.addHistogramSeries({
        color: '#3B82F630',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(filtered.map(d => ({
        time: d.date,
        value: d.volume,
        color: d.close >= d.open ? '#00C89625' : '#FF4D4D25',
      })));

      // SMA 50
      if (indicators?.sma_50) {
        sma50Series = chart.addLineSeries({
          color: '#F5A62380',
          lineWidth: 1,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        const sma50Data = filtered.slice(-filtered.length).map((d, i) => ({
          time: d.date,
          value: indicators.sma_50,
        }));
        sma50Series.setData(sma50Data);
      }

      // SMA 200
      if (indicators?.sma_200) {
        sma200Series = chart.addLineSeries({
          color: '#3B82F680',
          lineWidth: 1,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        const sma200Data = filtered.map(d => ({
          time: d.date,
          value: indicators.sma_200,
        }));
        sma200Series.setData(sma200Data);
      }

      // Support / Resistance lines
      if (indicators?.support) {
        candleSeries.createPriceLine({
          price: indicators.support,
          color: '#00C89650',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Support',
        });
      }
      if (indicators?.resistance) {
        candleSeries.createPriceLine({
          price: indicators.resistance,
          color: '#FF4D4D50',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Resistance',
        });
      }

      chart.timeScale().fitContent();
      setChartReady(true);
      chartRef.current = chart;

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      });
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    };

    initChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        setChartReady(false);
      }
    };
  }, [history, period, indicators]);

  return (
    <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Price Chart</h3>
          <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{background:'#F5A62380'}}/> SMA 50</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{background:'#3B82F680'}}/> SMA 200</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block border-t border-dashed" style={{borderColor:'#00C89650'}}/> Support</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block border-t border-dashed" style={{borderColor:'#FF4D4D50'}}/> Resistance</span>
          </div>
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                period === p
                  ? 'bg-[var(--green)] text-black'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="w-full" style={{ minHeight: 340 }}>
        {!chartReady && (
          <div className="w-full h-[340px] skeleton rounded-xl"/>
        )}
      </div>
    </div>
  );
}