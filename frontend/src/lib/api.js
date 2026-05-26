const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const fetchStockData = async (ticker) => {
  const res = await fetch(`${API_URL}/api/stock/${ticker}`);
  return res.json();
};

export const fetchNews = async (ticker) => {
  const res = await fetch(`${API_URL}/api/news/${ticker}`);
  return res.json();
};

export const sendChatMessage = async (ticker, question) => {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker, question, session_id: 'default' }),
  });
  return res.json();
};

export const createWebSocket = (ticker) => {
  const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    .replace('http://', 'ws://')
    .replace('https://', 'wss://');
  return new WebSocket(`${wsUrl}/ws/analyze/${ticker}`);
};

export const POPULAR_TICKERS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance', exchange: 'NSE' },
  { symbol: 'TCS.NS', name: 'TCS', exchange: 'NSE' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE' },
  { symbol: 'INFY.NS', name: 'Infosys', exchange: 'NSE' },
  { symbol: 'WIPRO.NS', name: 'Wipro', exchange: 'NSE' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', exchange: 'NSE' },
  { symbol: 'AAPL', name: 'Apple', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA', exchange: 'NASDAQ' },
];