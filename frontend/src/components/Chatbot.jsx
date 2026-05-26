import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../lib/api';

export default function Chatbot({ ticker, hasAnalysis }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hi! I've analyzed ${ticker || 'the stock'}. Ask me anything about it.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (ticker) {
      setMessages([{ role: 'ai', text: `Hi! I've analyzed ${ticker}. Ask me anything — price targets, risks, why BUY/SELL/HOLD, or fundamentals.` }]);
    }
  }, [ticker]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const res = await sendChatMessage(ticker, q);
      setMessages(m => [...m, { role: 'ai', text: res.answer || 'Sorry, I could not get an answer.' }]);
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat window */}
      {open && (
        <div className="mb-3 w-80 rounded-2xl border border-border overflow-hidden shadow-2xl animate-slide-up"
          style={{ background: 'var(--bg-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #00C89615, #0A0E1A)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--green)]" style={{ animation: 'pulse-dot 2s infinite' }}/>
              <span className="text-sm font-semibold text-white">Ask about {ticker}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-[var(--text-tertiary)] hover:text-white text-lg leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="p-3 space-y-2 max-h-72 overflow-y-auto" style={{ background: 'var(--bg-secondary)' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'text-[var(--text-secondary)] rounded-bl-sm border border-border'
                }`} style={{
                  background: m.role === 'user' ? 'var(--green)' : 'var(--bg-card)'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-border">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]"
                        style={{ animation: `pulse-dot 1s infinite ${i * 0.2}s` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick questions */}
          {messages.length === 1 && (
            <div className="px-3 py-2 border-t border-border flex flex-wrap gap-1" style={{ background: 'var(--bg-card)' }}>
              {['Why this verdict?', 'Price target?', 'Key risks?', 'Stop loss?'].map(q => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="text-[10px] px-2 py-1 rounded-lg border border-border text-[var(--text-secondary)] hover:border-[var(--green)] hover:text-[var(--green)] transition-all">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2" style={{ background: 'var(--bg-card)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask anything..."
              className="flex-1 bg-[var(--bg-secondary)] border border-border rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--green)] placeholder:text-[var(--text-tertiary)] transition-colors"
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: 'var(--green)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 6H11M11 6L7 2M11 6L7 10" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: open ? 'var(--bg-card)' : 'linear-gradient(135deg, #00C896, #0080FF)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 30px rgba(0,200,150,0.3)'
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4L14 14M14 4L4 14" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 6C3 4.34 4.34 3 6 3H14C15.66 3 17 4.34 17 6V11C17 12.66 15.66 14 14 14H11L7 17V14H6C4.34 14 3 12.66 3 11V6Z" stroke="white" strokeWidth="1.5"/>
            <circle cx="7" cy="8.5" r="1" fill="white"/>
            <circle cx="10" cy="8.5" r="1" fill="white"/>
            <circle cx="13" cy="8.5" r="1" fill="white"/>
          </svg>
        )}
      </button>

      {/* Pulse ring when analysis done */}
      {hasAnalysis && !open && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: '0 0 0 4px rgba(0,200,150,0.2)', animation: 'pulse-dot 2s infinite' }}/>
      )}
    </div>
  );
}