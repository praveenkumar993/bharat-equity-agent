import { useState, useEffect } from 'react';
import { fetchStockData } from '../lib/api';

const NIFTY50_STOCKS = [
  { symbol: 'RELIANCE.NS',   name: 'Reliance',      sector: 'Energy' },
  { symbol: 'TCS.NS',        name: 'TCS',            sector: 'IT' },
  { symbol: 'INFY.NS',       name: 'Infosys',        sector: 'IT' },
  { symbol: 'WIPRO.NS',      name: 'Wipro',          sector: 'IT' },
  { symbol: 'HCLTECH.NS',    name: 'HCL Tech',       sector: 'IT' },
  { symbol: 'HDFCBANK.NS',   name: 'HDFC Bank',      sector: 'Banking' },
  { symbol: 'ICICIBANK.NS',  name: 'ICICI Bank',     sector: 'Banking' },
  { symbol: 'SBIN.NS',       name: 'SBI',            sector: 'Banking' },
  { symbol: 'KOTAKBANK.NS',  name: 'Kotak Bank',     sector: 'Banking' },
  { symbol: 'AXISBANK.NS',   name: 'Axis Bank',      sector: 'Banking' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors',    sector: 'Auto' },
  { symbol: 'MARUTI.NS',     name: 'Maruti',         sector: 'Auto' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance',  sector: 'Finance' },
  { symbol: 'LT.NS',         name: 'L&T',            sector: 'Infra' },
  { symbol: 'HINDUNILVR.NS', name: 'HUL',            sector: 'FMCG' },
  { symbol: 'ITC.NS',        name: 'ITC',            sector: 'FMCG' },
  { symbol: 'BHARTIARTL.NS', name: 'Airtel',         sector: 'Telecom' },
  { symbol: 'SUNPHARMA.NS',  name: 'Sun Pharma',     sector: 'Pharma' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints',   sector: 'Paints' },
  { symbol: 'TITAN.NS',      name: 'Titan',          sector: 'Consumer' },
];

const getColors = (change) => {
  if (change === null || change === undefined)
    return { bg: 'var(--bg-card)', border: 'var(--border)', text: 'var(--text-primary)', change: 'var(--text-tertiary)' };
  if (change >=  3) return { bg: '#00C89635', border: '#00C89660', text: 'var(--text-primary)', change: '#00C896' };
  if (change >=  1) return { bg: '#00C89620', border: '#00C89640', text: 'var(--text-primary)', change: '#00C896' };
  if (change >=  0) return { bg: '#00C89610', border: '#00C89625', text: 'var(--text-primary)', change: '#00A070' };
  if (change >= -1) return { bg: '#FF4D4D10', border: '#FF4D4D25', text: 'var(--text-primary)', change: '#CC4444' };
  if (change >= -3) return { bg: '#FF4D4D20', border: '#FF4D4D40', text: 'var(--text-primary)', change: '#FF4D4D' };
  return               { bg: '#FF4D4D35', border: '#FF4D4D60', text: 'var(--text-primary)', change: '#FF4D4D' };
};

// Skeleton card shown while price is loading
function SkeletonCard() {
  return (
    <div
      className="p-3 rounded-xl border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="skeleton h-3 w-14 rounded mb-2" />
      <div className="skeleton h-3 w-10 rounded mb-1.5" />
      <div className="skeleton h-2 w-8 rounded" />
    </div>
  );
}

export default function Heatmap({ onSelectStock }) {
  const [stocks, setStocks] = useState(
    NIFTY50_STOCKS.map(s => ({ ...s, change: null, price: null, loading: true }))
  );
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    NIFTY50_STOCKS.forEach(async (s, i) => {
      await new Promise(r => setTimeout(r, i * 400));
      try {
        const res = await fetchStockData(s.symbol);
        if (res.success && res.market_data) {
          const m = res.market_data;
          const change = ((m.current_price - m.previous_close) / m.previous_close) * 100;
          setStocks(prev => prev.map(st =>
            st.symbol === s.symbol
              ? { ...st, change: parseFloat(change.toFixed(2)), price: m.current_price, loading: false }
              : st
          ));
        } else {
          setStocks(prev => prev.map(st =>
            st.symbol === s.symbol ? { ...st, loading: false, change: 0 } : st
          ));
        }
      } catch {
        setStocks(prev => prev.map(st =>
          st.symbol === s.symbol ? { ...st, loading: false, change: 0 } : st
        ));
      }
    });
    setLastUpdated(new Date().toLocaleTimeString('en-IN'));
  }, []);

  const sectors       = [...new Set(NIFTY50_STOCKS.map(s => s.sector))];
  const loaded        = stocks.filter(s => !s.loading).length;
  const loadPct       = Math.round((loaded / stocks.length) * 100);
  const loadedStocks  = stocks.filter(s => !s.loading && s.change !== null);
  const gainers       = loadedStocks.filter(s => s.change > 0).length;
  const losers        = loadedStocks.filter(s => s.change < 0).length;
  const avgChange     = loadedStocks.length
    ? (loadedStocks.reduce((a, s) => a + s.change, 0) / loadedStocks.length).toFixed(2)
    : null;

  return (
    <div className="animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Nifty 50 Market Heatmap
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Live day change · Click any stock to run full AI analysis
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {loadedStocks.length > 0 && (
            <>
              <div className="px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid #00C89630' }}>
                ▲ {gainers} Gainers
              </div>
              <div className="px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid #FF4D4D30' }}>
                ▼ {losers} Losers
              </div>
              {avgChange && (
                <div className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium"
                  style={{
                    background: parseFloat(avgChange) >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
                    color:      parseFloat(avgChange) >= 0 ? 'var(--green)'     : 'var(--red)',
                    border:    `1px solid ${parseFloat(avgChange) >= 0 ? '#00C89630' : '#FF4D4D30'}`,
                  }}>
                  Avg {avgChange >= 0 ? '+' : ''}{avgChange}%
                </div>
              )}
            </>
          )}

          {/* Legend */}
          <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {[
              { bg: '#00C89635', label: '>+3%'   },
              { bg: '#00C89618', label: '0–3%'   },
              { bg: '#FF4D4D18', label: '0 to -3%' },
              { bg: '#FF4D4D35', label: '<-3%'   },
            ].map(({ bg, label }) => (
              <span key={label} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ background: bg }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {loadPct < 100 && (
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            <span>Fetching live prices…</span>
            <span>{loaded} / {stocks.length}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${loadPct}%`, background: 'var(--green)' }}
            />
          </div>
        </div>
      )}

      {/* ── Heatmap by sector ── */}
      <div className="space-y-5">
        {sectors.map(sector => {
          const sectorStocks = stocks.filter(s => s.sector === sector);
          const sectorLoaded = sectorStocks.filter(s => !s.loading);
          const sectorAvg    = sectorLoaded.length
            ? sectorLoaded.reduce((a, s) => a + (s.change || 0), 0) / sectorLoaded.length
            : null;

          return (
            <div key={sector}>
              {/* Sector label */}
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {sector}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                {sectorAvg !== null && (
                  <span className="text-[10px] font-mono"
                    style={{ color: sectorAvg >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {sectorAvg >= 0 ? '+' : ''}{sectorAvg.toFixed(2)}%
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {sectorStocks.map(stock => {
                  if (stock.loading) return <SkeletonCard key={stock.symbol} />;

                  const colors = getColors(stock.change);
                  return (
                    <button
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock.symbol)}
                      className="p-3 rounded-xl text-left transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
                      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                    >
                      <div className="text-[12px] font-semibold truncate mb-1"
                        style={{ color: colors.text }}>
                        {stock.name}
                      </div>
                      <div className="text-[11px] font-mono font-semibold"
                        style={{ color: colors.change }}>
                        {stock.change !== null
                          ? `${stock.change >= 0 ? '+' : ''}${stock.change}%`
                          : '—'}
                      </div>
                      {stock.price && (
                        <div className="text-[9px] mt-0.5 font-mono"
                          style={{ color: 'var(--text-tertiary)' }}>
                          ₹{stock.price.toLocaleString('en-IN')}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      {lastUpdated && (
        <div className="mt-6 text-center text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          Prices fetched at {lastUpdated} · yfinance · Click any stock to run 8-agent AI analysis
        </div>
      )}
    </div>
  );
}