import { useState, useEffect, useCallback } from 'react';
import TopBar from './components/TopBar';
import StockHeader from './components/StockHeader';
import PriceChart from './components/PriceChart';
import TechnicalPanel from './components/TechnicalPanel';
import NewsFeed from './components/NewsFeed';
import VerdictCard from './components/VerdictCard';
import AgentFeed from './components/AgentFeed';
import Chatbot from './components/Chatbot';
import Heatmap from './components/Heatmap';
import { fetchStockData, fetchNews, createWebSocket, POPULAR_TICKERS } from './lib/api';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const updateTab = useCallback((sym, updates) => {
    setTabs(prev => prev.map(tab =>
      tab.ticker === sym ? { ...tab, ...updates } : tab
    ));
  }, []);

  const analyze = useCallback(async (t) => {
    const sym = t.trim().toUpperCase();

    if (tabs.find(tab => tab.ticker === sym)) {
      setActiveTab(sym);
      return;
    }

    setTabs(prev => {
      const next = prev.length >= 4 ? prev.slice(1) : prev;
      return [...next, {
        ticker: sym,
        stockData: null,
        news: [],
        verdict: null,
        agentOutputs: null,
        events: [],
        analyzing: true,
        loadingStock: true,
        error: '',
      }];
    });
    setActiveTab(sym);

    try {
      const [stockRes, newsRes] = await Promise.all([
        fetchStockData(sym),
        fetchNews(sym),
      ]);
      if (stockRes.success) updateTab(sym, { stockData: stockRes, loadingStock: false });
      else updateTab(sym, { error: 'Failed to fetch market data.', loadingStock: false });
      if (newsRes.success) updateTab(sym, { news: newsRes.news || [] });
    } catch {
      updateTab(sym, { error: 'Failed to fetch market data. Check the ticker.', loadingStock: false });
    }

    try {
      const ws = createWebSocket(sym);

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === 'agent_event') {
          setTabs(prev => prev.map(tab =>
            tab.ticker === sym
              ? { ...tab, events: [...tab.events, { agent: data.agent, status: data.status, message: data.message }] }
              : tab
          ));
        }

        if (data.type === 'verdict') {
          updateTab(sym, {
            verdict: {
              verdict: data.verdict,
              confidence: data.confidence,
              price_target: data.price_target,
              stop_loss: data.stop_loss,
              summary: data.summary,
              bull_case: data.bull_case,
              bear_case: data.bear_case,
              critic_challenge: data.critic_challenge,
              critic_note: data.critic_note,
              critic_passed: data.critic_passed,
            },
            agentOutputs: data.agent_outputs,
            ...(data.news?.length ? { news: data.news } : {}),
          });
        }

        if (data.type === 'complete') updateTab(sym, { analyzing: false });
        if (data.type === 'error')    updateTab(sym, { error: data.message, analyzing: false });
      };

      ws.onerror = () => updateTab(sym, { error: 'WebSocket connection failed. Make sure backend is running on port 8000.', analyzing: false });
      ws.onclose = () => updateTab(sym, { analyzing: false });

    } catch {
      updateTab(sym, { error: 'Could not connect to backend.', analyzing: false });
    }
  }, [tabs, updateTab]);

  const closeTab = (sym) => {
    const remaining = tabs.filter(t => t.ticker !== sym);
    setTabs(remaining);
    if (activeTab === sym) setActiveTab(remaining[remaining.length - 1]?.ticker || null);
  };

  const active       = tabs.find(t => t.ticker === activeTab) || {};
  const { stockData, news, verdict, agentOutputs, events, analyzing, loadingStock, error } = active;

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      <TopBar
        onSearch={analyze}
        currentTicker={activeTab}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      {/* Tabs bar */}
      {tabs.length > 0 && (
        <div className="sticky top-14 z-40 border-b"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 flex items-center gap-0 overflow-x-auto">
            {tabs.map(tab => {
              const m = tab.stockData?.market_data;
              const change = m ? ((m.current_price - m.previous_close) / m.previous_close * 100) : null;
              const isPos   = change >= 0;
              const isActive = activeTab === tab.ticker;

              return (
                <div
                  key={tab.ticker}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer border-b-2 transition-all whitespace-nowrap shrink-0"
                  style={{
                    borderBottomColor: isActive ? 'var(--green)' : 'transparent',
                    background: isActive ? 'var(--green-dim)' : 'transparent',
                  }}
                  onClick={() => setActiveTab(tab.ticker)}
                >
                  <span className="text-sm font-medium"
                    style={{ color: isActive ? 'var(--green)' : 'var(--text-secondary)' }}>
                    {tab.ticker.replace('.NS','').replace('.BO','')}
                  </span>

                  {change !== null && (
                    <span className="text-xs font-mono"
                      style={{ color: isPos ? 'var(--green)' : 'var(--red)' }}>
                      {isPos ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  )}

                  {tab.analyzing && (
                    <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                      style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }}/>
                  )}

                  {tab.verdict && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{
                      background: tab.verdict.verdict === 'BUY' ? 'var(--green-dim)'
                        : tab.verdict.verdict === 'SELL' ? 'var(--red-dim)' : 'var(--amber-dim)',
                      color: tab.verdict.verdict === 'BUY' ? 'var(--green)'
                        : tab.verdict.verdict === 'SELL' ? 'var(--red)' : 'var(--amber)',
                    }}>
                      {tab.verdict.verdict}
                    </span>
                  )}

                  <span
                    className="text-xs ml-1 transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                    onClick={e => { e.stopPropagation(); closeTab(tab.ticker); }}
                  >×</span>
                </div>
              );
            })}

            {/* Home button when tabs are open */}
            <button
              onClick={() => setActiveTab(null)}
              className="ml-auto px-3 py-3 text-xs transition-colors shrink-0"
              style={{ color: activeTab === null ? 'var(--green)' : 'var(--text-tertiary)' }}
            >
              ⌂ Home
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">

        {/* Landing / Heatmap — shown when no active tab */}
        {!activeTab && (
          <div className="animate-fade-in">

            {/* Hero */}
            <div className="flex flex-col items-center justify-center py-10 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C896] to-[#0080FF] flex items-center justify-center mb-5"
                style={{ boxShadow: '0 20px 60px rgba(0,200,150,0.3)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L22 7V17L12 22L2 17V7L12 2Z" stroke="white" strokeWidth="2" fill="none"/>
                  <path d="M12 8L16 12L12 16L8 12L12 8Z" fill="white"/>
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight text-center">
                Bharat Equity Agent
              </h1>
              <p className="text-sm text-center max-w-md mb-5 leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}>
                8 autonomous AI agents analyze any stock — market data, sentiment, fundamentals,
                technicals, and risk — synthesized into a professional BUY/HOLD/SELL verdict.
              </p>
              <div className="flex items-center gap-4 text-xs mb-6" style={{ color: 'var(--text-tertiary)' }}>
                {[
                  { color: 'var(--green)', label: 'CrewAI agents' },
                  { color: 'var(--accent)', label: 'LangGraph' },
                  { color: 'var(--amber)', label: 'MCP servers' },
                  { color: '#A78BFA',      label: 'LangSmith' },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }}/>
                    {label}
                  </span>
                ))}
              </div>

              {/* Quick search buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                {POPULAR_TICKERS.map(t => (
                  <button
                    key={t.symbol}
                    onClick={() => analyze(t.symbol)}
                    className="px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-150"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--green)';
                      e.currentTarget.style.color = 'var(--green)';
                      e.currentTarget.style.background = 'var(--green-dim)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'var(--bg-card)';
                    }}
                  >
                    {t.name}
                    <span className="ml-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.exchange}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Heatmap */}
            <div className="rounded-2xl p-6 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <Heatmap onSelectStock={analyze} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && activeTab && (
          <div className="mb-4 p-4 rounded-xl border text-sm animate-slide-up"
            style={{ borderColor: 'var(--red)', background: 'var(--red-dim)', color: 'var(--red)' }}>
            ⚠ {error}
          </div>
        )}

        {/* Main dashboard */}
        {activeTab && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

            {/* Left */}
            <div className="space-y-5">
              <StockHeader data={stockData} loading={loadingStock} />
              <PriceChart history={stockData?.price_history} indicators={stockData?.indicators} />
              <TechnicalPanel indicators={stockData?.indicators} loading={loadingStock} />
              <NewsFeed news={news} loading={loadingStock && !news.length} />
            </div>

            {/* Right */}
            <div className="space-y-5">
              <AgentFeed events={events || []} analyzing={analyzing} />

              {analyzing && !verdict && (
                <div className="rounded-2xl p-5 border animate-fade-in"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: 'var(--green)', borderTopColor: 'transparent' }}/>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Agents analyzing {activeTab}...
                    </span>
                  </div>
                  <div className="space-y-2">
                    {['Data Fetcher', 'CrewAI Orchestrator', 'Synthesizer', 'Critic'].map(agent => {
                      const evt = (events || []).find(e => e.agent === agent);
                      return (
                        <div key={agent} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full transition-all" style={{
                            background: evt?.status === 'done' ? 'var(--green)'
                              : evt?.status === 'running' ? 'var(--amber)'
                              : 'var(--border)',
                            animation: evt?.status === 'running' ? 'pulse-dot 1s infinite' : 'none',
                          }}/>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{agent}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <VerdictCard
                verdict={verdict}
                agentOutputs={agentOutputs}
                loading={analyzing && !verdict}
                ticker={activeTab}
              />
            </div>
          </div>
        )}
      </div>

      {activeTab && <Chatbot ticker={activeTab} hasAnalysis={!!verdict} />}
    </div>
  );
}