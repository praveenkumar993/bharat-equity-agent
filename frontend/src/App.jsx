import { useState, useEffect, useCallback } from 'react';
import TopBar from './components/TopBar';
import StockHeader from './components/StockHeader';
import PriceChart from './components/PriceChart';
import TechnicalPanel from './components/TechnicalPanel';
import NewsFeed from './components/NewsFeed';
import VerdictCard from './components/VerdictCard';
import AgentFeed from './components/AgentFeed';
import Chatbot from './components/Chatbot';
import { fetchStockData, fetchNews, createWebSocket, POPULAR_TICKERS } from './lib/api';

export default function App() {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState(null);
  const [news, setNews] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [agentOutputs, setAgentOutputs] = useState(null);
  const [events, setEvents] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);
  const [error, setError] = useState('');

  const analyze = useCallback(async (t) => {
    if (!t || analyzing) return;
    const sym = t.trim().toUpperCase();
    setTicker(sym);
    setError('');
    setEvents([]);
    setVerdict(null);
    setAgentOutputs(null);
    setLoadingStock(true);

    // Fetch static data immediately
    try {
      const [stockRes, newsRes] = await Promise.all([
        fetchStockData(sym),
        fetchNews(sym),
      ]);
      if (stockRes.success) setStockData(stockRes);
      if (newsRes.success) setNews(newsRes.news || []);
    } catch (e) {
      setError('Failed to fetch market data. Check the ticker and try again.');
    } finally {
      setLoadingStock(false);
    }

    // Start agent pipeline via WebSocket
    setAnalyzing(true);
    try {
      const ws = createWebSocket(sym);

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === 'agent_event') {
          setEvents(prev => [...prev, { agent: data.agent, status: data.status, message: data.message }]);
        }

        if (data.type === 'verdict') {
          setVerdict({
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
          });
          setAgentOutputs(data.agent_outputs);
          if (data.news?.length) setNews(data.news);
        }

        if (data.type === 'complete') {
          setAnalyzing(false);
        }

        if (data.type === 'error') {
          setError(data.message);
          setAnalyzing(false);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection failed. Make sure the backend is running on port 8000.');
        setAnalyzing(false);
      };

      ws.onclose = () => setAnalyzing(false);
    } catch (e) {
      setError('Could not connect to backend.');
      setAnalyzing(false);
    }
  }, [analyzing]);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <TopBar onSearch={analyze} currentTicker={ticker} />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">

        {/* Landing state */}
        {!ticker && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C896] to-[#0080FF] flex items-center justify-center mb-6 shadow-2xl" style={{ boxShadow: '0 20px 60px rgba(0,200,150,0.3)' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 3L25 8V20L14 25L3 20V8L14 3Z" stroke="white" strokeWidth="2" fill="none"/>
                <path d="M14 10L18 14L14 18L10 14L14 10Z" fill="white"/>
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-white mb-3 tracking-tight text-center">
              Bharat Equity Agent
            </h1>
            <p className="text-[var(--text-secondary)] text-center max-w-md mb-10 leading-relaxed">
              8 autonomous AI agents analyze any stock — market data, sentiment, fundamentals, technicals, and risk — and produce a BUY/HOLD/SELL verdict with confidence score.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {POPULAR_TICKERS.map(t => (
                <button
                  key={t.symbol}
                  onClick={() => analyze(t.symbol)}
                  className="px-4 py-2 rounded-xl border border-border text-sm text-[var(--text-secondary)] hover:border-[var(--green)] hover:text-[var(--green)] hover:bg-[var(--green-dim)] transition-all"
                >
                  {t.name} <span className="text-[var(--text-tertiary)] text-xs">{t.exchange}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl border border-[var(--red)] bg-[var(--red-dim)] text-[var(--red)] text-sm animate-slide-up">
            ⚠ {error}
          </div>
        )}

        {/* Main dashboard */}
        {ticker && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

            {/* Left column */}
            <div className="space-y-5">
              <StockHeader data={stockData} loading={loadingStock} />
              <PriceChart
                history={stockData?.price_history}
                indicators={stockData?.indicators}
              />
              <TechnicalPanel indicators={stockData?.indicators} loading={loadingStock} />
              <NewsFeed news={news} loading={loadingStock && !news.length} />
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <AgentFeed events={events} analyzing={analyzing} />
              <VerdictCard
                verdict={verdict}
                agentOutputs={agentOutputs}
                loading={analyzing && !verdict}
              />

              {/* Analysis progress */}
              {analyzing && !verdict && (
                <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-border animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin"/>
                    <span className="text-sm font-medium text-[var(--text-primary)]">Agents analyzing...</span>
                  </div>
                  <div className="space-y-2">
                    {['Market Data', 'News Sentinel', 'Sentiment Oracle', 'Fundamentals', 'Technical', 'Risk Assessor', 'Synthesizer', 'Critic'].map((agent, i) => (
                      <div key={agent} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: events.some(e => e.agent === agent && e.status === 'done') ? 'var(--green)'
                              : events.some(e => e.agent === agent && e.status === 'running') ? 'var(--amber)'
                              : 'var(--border)',
                            animation: events.some(e => e.agent === agent && e.status === 'running') ? 'pulse-dot 1s infinite' : 'none'
                          }}
                        />
                        <span className="text-xs text-[var(--text-secondary)]">{agent}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chatbot — always visible when ticker is set */}
      {ticker && (
        <Chatbot ticker={ticker} hasAnalysis={!!verdict} />
      )}
    </div>
  );
}