# 🧠 Bharat Equity Agent

<div align="center">

```
██████╗ ██╗  ██╗ █████╗ ██████╗  █████╗ ████████╗
██╔══██╗██║  ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝
██████╔╝███████║███████║██████╔╝███████║   ██║   
██╔══██╗██╔══██║██╔══██║██╔══██╗██╔══██║   ██║   
██████╔╝██║  ██║██║  ██║██║  ██║██║  ██║   ██║   
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
███████╗ ██████╗ ██╗   ██╗██╗████████╗██╗   ██╗
██╔════╝██╔═══██╗██║   ██║██║╚══██╔══╝╚██╗ ██╔╝
█████╗  ██║   ██║██║   ██║██║   ██║    ╚████╔╝ 
██╔══╝  ██║▄▄ ██║██║   ██║██║   ██║     ╚██╔╝  
███████╗╚██████╔╝╚██████╔╝██║   ██║      ██║   
╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝   ╚═╝      ╚═╝   
                 █████╗  ██████╗ ███████╗███╗   ██╗████████╗
                ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
                ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   
                ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   
                ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   
                ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   
```

**Multi-Agent Autonomous Stock Research & Investment Intelligence Platform**

*8 AI agents collaborating, debating, and self-critiquing to produce institutional-grade investment research — in under 60 seconds*

---

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-00C896?style=for-the-badge)](https://crewai.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-State%20Machine-3B82F6?style=for-the-badge)](https://langchain-ai.github.io/langgraph)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-F55036?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[**Live Demo**](https://bharat-equity-agent.vercel.app) · [**Backend API**](https://bharat-equity-agent.onrender.com/docs) · [**LangSmith Traces**](https://smith.langchain.com)

</div>

---

## 📖 Table of Contents

1. [What is Bharat Equity Agent?](#-what-is-bharat-equity-agent)
2. [Why This is Different](#-why-this-is-different)
3. [System Architecture](#-system-architecture)
4. [Agent Pipeline & Data Flow](#-agent-pipeline--data-flow)
5. [The 8 Agents — Deep Dive](#-the-8-agents--deep-dive)
6. [LangGraph State Machine](#-langgraph-state-machine)
7. [MCP Servers](#-mcp-servers-model-context-protocol)
8. [Tech Stack](#-tech-stack)
9. [Features](#-features)
10. [Project Structure](#-project-structure)
11. [Local Setup](#-local-setup)
12. [Environment Variables](#-environment-variables)
13. [API Reference](#-api-reference)
14. [Deployment](#-deployment)
15. [LangSmith Observability](#-langsmith-observability)
16. [Recruiter FAQ](#-recruiter-faq)

---

## 🎯 What is Bharat Equity Agent?

Bharat Equity Agent is a **production-grade, multi-agent AI system** that autonomously researches any stock — Indian (NSE/BSE) or global — and produces a professional **BUY / HOLD / SELL** investment verdict with:

- ✅ **Confidence score** (0–100%)
- ✅ **Price target** and **stop-loss** levels
- ✅ **Critic-validated** verdict (agent challenges its own output)
- ✅ **Full audit trail** via LangSmith observability
- ✅ **Exportable PDF** research report with embedded charts
- ✅ **Live streaming** — watch agents think in real-time via WebSocket

**Enter `RELIANCE.NS` → Get institutional-quality research in ~60 seconds. Zero human input required.**

---

## 🔥 Why This is Different

Most AI stock tools are glorified chatbots. This is not that.

| Feature | Typical AI Tool | Bharat Equity Agent |
|---------|----------------|---------------------|
| Architecture | Single LLM prompt | 8 autonomous agents with roles |
| Data | Static / hallucinated | Live APIs (yfinance, Tavily) |
| Validation | None | Critic agent reflexion loop |
| Observability | None | LangSmith full trace trees |
| Tool standard | Function calling | MCP (Model Context Protocol) |
| Orchestration | Linear chain | LangGraph stateful graph |
| Output | Text paragraph | Structured verdict + charts + PDF |
| Transparency | Black box | Every agent step visible live |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BHARAT EQUITY AGENT                             │
│                      SYSTEM ARCHITECTURE v1.0                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐      WebSocket / REST      ┌──────────────────┐
│       REACT FRONTEND     │◄──────────────────────────►│   FASTAPI        │
│                          │                            │   BACKEND        │
│  ┌─────────────────────┐ │                            │                  │
│  │  Nifty 50 Heatmap   │ │                            │  /ws/analyze/    │
│  │  (20 live stocks)   │ │                            │  /api/stock/     │
│  └─────────────────────┘ │                            │  /api/news/      │
│  ┌─────────────────────┐ │                            │  /api/chat       │
│  │  TradingView Charts │ │                            │  /api/export/    │
│  │  (Candlestick+Vol)  │ │                            └────────┬─────────┘
│  └─────────────────────┘ │                                     │
│  ┌─────────────────────┐ │                            ┌────────▼─────────┐
│  │  Live Agent Feed    │ │                            │  LANGGRAPH       │
│  │  (WebSocket stream) │ │                            │  SUPERVISOR      │
│  └─────────────────────┘ │                            │                  │
│  ┌─────────────────────┐ │                            │  State Machine   │
│  │  Verdict Card       │ │                            │  + Conditional   │
│  │  BUY/HOLD/SELL      │ │                            │  Routing         │
│  └─────────────────────┘ │                            └────────┬─────────┘
│  ┌─────────────────────┐ │                                     │
│  │  Chatbot Widget     │ │                            ┌────────▼─────────┐
│  │  (bottom-right)     │ │                            │  CREWAI CREW     │
│  └─────────────────────┘ │                            │  (6 agents)      │
│  ┌─────────────────────┐ │                            └────────┬─────────┘
│  │  Multi-Tab          │ │                                     │
│  │  (up to 4 stocks)   │ │                            ┌────────▼─────────┐
│  └─────────────────────┘ │                            │  MCP SERVERS     │
└──────────────────────────┘                            │                  │
                                                        │  yfinance MCP    │
            ┌───────────────────────────────────────────┤  Tavily MCP      │
            │                                           │  pandas-ta MCP   │
            ▼                                           └────────┬─────────┘
  ┌──────────────────┐                                           │
  │  LANGSMITH       │◄──────────────────────────────────────────┘
  │  OBSERVABILITY   │         Traces every LLM call,
  │                  │         tool invocation, latency
  │  Full trace tree │
  │  Agent latency   │
  │  Evaluation sets │
  └──────────────────┘
```

---

## 🔄 Agent Pipeline & Data Flow

```
USER INPUT: "RELIANCE.NS"
         │
         ▼
┌────────────────────────────────────────────────────────────────────┐
│                    STEP 1: DATA PRE-FETCH                          │
│                    (before agents start)                           │
│                                                                    │
│   yfinance MCP ──► Live price, 52W range, P/E, EPS, Beta          │
│   yfinance MCP ──► 6-month OHLCV price history                    │
│   yfinance MCP ──► Revenue, margins, ROE, debt/equity             │
│   pandas-ta MCP ──► RSI, MACD, Bollinger, SMA 50/200              │
│   Tavily MCP ──► Latest news (4 articles, ranked)                 │
│   Tavily MCP ──► Market sentiment search                          │
└────────────────────────────┬───────────────────────────────────────┘
                             │ All data embedded into task descriptions
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    STEP 2: CREWAI CREW                             │
│                    (6 agents, sequential)                          │
│                                                                    │
│   Agent 1: Market Data Specialist                                  │
│   ├── Input: Live price data dict                                  │
│   ├── LLM: Llama 3.3 70B (Groq)                                   │
│   └── Output: Price analysis, 52W position %, volume signal       │
│                             │                                      │
│   Agent 2: News Sentinel    │                                      │
│   ├── Input: 4 news articles│                                      │
│   ├── LLM: Llama 3.3 70B   │                                      │
│   └── Output: Ranked news, HIGH/MEDIUM/LOW impact labels          │
│                             │                                      │
│   Agent 3: Sentiment Oracle │                                      │
│   ├── Input: News + sentiment search                               │
│   ├── LLM: Llama 3.1 8B    │                                      │
│   └── Output: Score 0-1, pos%/neu%/neg%, top 2 drivers            │
│                             │                                      │
│   Agent 4: Fundamentals Analyst                                    │
│   ├── Input: Financial ratios + market data                        │
│   ├── LLM: Llama 3.1 8B    │                                      │
│   └── Output: Valuation verdict, biggest strength + risk          │
│                             │                                      │
│   Agent 5: Technical Chartist                                      │
│   ├── Input: RSI, MACD, Bollinger, SMA indicators                 │
│   ├── LLM: Llama 3.3 70B   │                                      │
│   └── Output: Technical signal, key level to watch                │
│                             │                                      │
│   Agent 6: Risk Assessor    │                                      │
│   ├── Input: Beta, debt/equity, news                               │
│   ├── LLM: Llama 3.1 8B    │                                      │
│   └── Output: Low/Moderate/High rating, top 3 specific risks      │
└────────────────────────────┬───────────────────────────────────────┘
                             │ All 6 outputs passed forward
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    STEP 3: SYNTHESIZER AGENT                       │
│                                                                    │
│   Input: All 6 agent outputs + current price                       │
│   LLM: Llama 3.3 70B (Groq)                                       │
│                                                                    │
│   Output (structured):                                             │
│   ├── VERDICT: BUY / HOLD / SELL                                   │
│   ├── CONFIDENCE: 50–90%                                           │
│   ├── PRICE_TARGET: realistic (within 15% of current price)        │
│   ├── STOP_LOSS: 5-8% below current price                         │
│   ├── SUMMARY: 2-3 sentence explanation                            │
│   ├── BULL_CASE: best case scenario                                │
│   └── BEAR_CASE: worst case scenario                               │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    STEP 4: CRITIC AGENT (Reflexion Loop)           │
│                                                                    │
│   Input: Synthesizer verdict + technical + risk outputs            │
│   LLM: Llama 3.3 70B (Groq)                                       │
│                                                                    │
│   Challenges the verdict:                                          │
│   ├── Does confidence match actual signal quality?                 │
│   ├── Are there contradictions between agents?                     │
│   └── Were material risks overlooked?                              │
│                                                                    │
│   Output:                                                          │
│   ├── VERDICT_STANDS: YES / NO                                     │
│   ├── CHALLENGE: specific contradiction found                      │
│   ├── REVISED_CONFIDENCE: adjusted confidence                      │
│   └── CRITIC_NOTE: one-sentence conclusion                         │
│                                                                    │
│   ┌─────────────────────────────────────────────────┐             │
│   │  IF verdict challenged AND loop_count < 2:       │             │
│   │      → Loop back to Synthesizer                  │             │
│   │  ELSE:                                            │             │
│   │      → END (final verdict locked)                │             │
│   └─────────────────────────────────────────────────┘             │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    STEP 5: WEBSOCKET STREAM                        │
│                                                                    │
│   Events streamed to React frontend in real-time:                  │
│   { type: "agent_event", agent: "...", status: "done", ... }       │
│   { type: "verdict", verdict: "BUY", confidence: 74, ... }         │
│   { type: "complete" }                                             │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 The 8 Agents — Deep Dive

### Agent 1 — Market Data Specialist
```
Role    : Senior market microstructure analyst (15yr NSE floor experience)
LLM     : Llama 3.3 70B via Groq
Tools   : yfinance MCP → get_stock_data(), get_price_history()
Task    : Fetch live price, volume, 52W range. Calculate 52W range position %.
          Flag unusual volume (>20% above avg) as institutional activity signal.
Output  : Structured market data report with volume analysis
```

### Agent 2 — News Sentinel
```
Role    : Financial journalist covering Dalal Street (12 years)
LLM     : Llama 3.3 70B via Groq
Tools   : Tavily MCP → search_stock_news(), search_market_sentiment()
Task    : Find 4 most recent articles. Rank by price impact.
          Label: Positive/Negative/Neutral. Flag HIGH IMPACT items.
Output  : Ranked news list with sentiment and impact labels
```

### Agent 3 — Sentiment Oracle
```
Role    : Behavioral finance expert (10yr sentiment research)
LLM     : Llama 3.1 8B via Groq
Tools   : Tavily MCP → sentiment search
Task    : Produce sentiment score 0.0–1.0.
          Break down: positive% / neutral% / negative%.
          Identify top 2 sentiment drivers.
Output  : Sentiment score, percentages, drivers, overall label
```

### Agent 4 — Fundamentals Analyst
```
Role    : CFA charterholder (10yr Mumbai investment bank)
LLM     : Llama 3.1 8B via Groq
Tools   : yfinance MCP → get_financials(), get_stock_data()
Task    : Analyze P/E vs sector, revenue growth, profit margins,
          ROE, debt/equity, free cashflow, earnings growth.
Output  : Valuation verdict (Undervalued/Fairly Valued/Overvalued),
          biggest fundamental strength, biggest fundamental risk
```

### Agent 5 — Technical Chartist
```
Role    : Technical analyst (15yr Indian markets)
LLM     : Llama 3.3 70B via Groq
Tools   : pandas-ta MCP → get_technical_indicators()
Task    : Analyze RSI (overbought/oversold?), MACD crossover,
          Bollinger Bands, SMA 50 vs SMA 200, support/resistance.
Output  : Overall signal (Bullish/Neutral/Bearish), key level to watch
```

### Agent 6 — Risk Assessor
```
Role    : Former SEBI risk manager (12yr experience)
LLM     : Llama 3.1 8B via Groq
Tools   : yfinance MCP, Tavily MCP
Task    : Check beta, sector risks, debt levels, regulatory news,
          macro risks (RBI rates, crude oil, FII flows).
Output  : Overall risk rating (Low/Moderate/High), top 3 specific risks
```

### Agent 7 — Synthesizer
```
Role    : Senior portfolio manager (top Mumbai hedge fund)
LLM     : Llama 3.3 70B via Groq
Tools   : None (receives all 6 agent outputs as context)
Task    : Synthesize all research into final investment verdict.
          Use actual current price — no hallucinated numbers.
          Price target within 15% of current price. Stop-loss 5-8% below.
Output  : VERDICT, CONFIDENCE, PRICE_TARGET, STOP_LOSS,
          SUMMARY, BULL_CASE, BEAR_CASE
```

### Agent 8 — Critic (Reflexion Loop)
```
Role    : Devil's advocate risk officer (investment committee)
LLM     : Llama 3.3 70B via Groq
Tools   : None (receives synthesizer verdict + technical + risk context)
Task    : Challenge the verdict. Find contradictions.
          Does confidence match signal quality?
          Were material risks overlooked?
Output  : VERDICT_STANDS (YES/NO), CHALLENGE, REVISED_CONFIDENCE, CRITIC_NOTE
Loop    : If NO → Synthesizer runs again (max 2 loops)
          If YES → Pipeline ends, verdict locked
```

---

## 📊 LangGraph State Machine

```
                    ┌─────────────────┐
                    │   START (input) │
                    │   ticker: str   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  node_fetch_    │
                    │  data           │
                    │                 │
                    │  yfinance +     │
                    │  Tavily +       │
                    │  pandas-ta      │
                    └────────┬────────┘
                             │ market_data_raw
                             │ financials_raw
                             │ indicators_raw
                             │ price_history
                             │ news_raw
                             ▼
                    ┌─────────────────┐
                    │  node_run_      │
                    │  agents         │
                    │                 │
                    │  CrewAI Crew    │
                    │  (6 agents)     │
                    └────────┬────────┘
                             │ agent_outputs dict
                             │ {market_data, news,
                             │  sentiment, fundamentals,
                             │  technical, risk}
                             ▼
                    ┌─────────────────┐
                    │  node_          │
                    │  synthesize     │
                    │                 │
                    │  Synthesizer    │
                    │  Agent          │
                    └────────┬────────┘
                             │ synthesis dict
                             │ {verdict, confidence,
                             │  price_target, stop_loss,
                             │  summary, bull_case,
                             │  bear_case}
                             ▼
                    ┌─────────────────┐
                    │  node_critic    │
                    │                 │
                    │  Critic Agent   │
                    │  loop_count++   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │    route_after_critic()      │
              │                             │
     ┌────────▼────────┐          ┌────────▼────────┐
     │ loop_count >= 2  │          │ verdict_stands  │
     │        OR        │          │    == True      │
     │ verdict_stands   │          │                 │
     │    == True       │          └────────┬────────┘
     └────────┬────────┘                   │
              │                            │
              └────────────┬───────────────┘
                           │
                           ▼
                    ┌─────────────────┐
                    │      END        │
                    │                 │
                    │ final_verdict   │
                    │ final_          │
                    │ confidence      │
                    └─────────────────┘

State shape (TypedDict):
{
  ticker            : str
  market_data_raw   : dict
  financials_raw    : dict
  indicators_raw    : dict
  price_history     : list
  news_raw          : list
  agent_outputs     : dict
  synthesis         : dict
  critic            : dict
  final_verdict     : str   # "BUY" | "HOLD" | "SELL"
  final_confidence  : int   # 50–90
  loop_count        : int   # max 2
  events            : list  # streamed to frontend
  error             : str
}
```

---

## 🔌 MCP Servers (Model Context Protocol)

Each data source is exposed as a proper **MCP server** — the 2024/2025 standard for composable AI tools. Agents never call APIs directly; they call MCP tools. Swap any MCP without touching agent code.

### yfinance MCP (`backend/mcp_servers/yfinance_server.py`)
```
Tools exposed:
  get_stock_data(ticker)      → price, P/E, EPS, beta, 52W range, volume
  get_price_history(ticker)   → 6-month OHLCV for TradingView charts
  get_financials(ticker)      → revenue growth, margins, ROE, debt/equity

Source: Yahoo Finance (free, no API key required)
Tickers: NSE (RELIANCE.NS), BSE (RELIANCE.BO), US (AAPL, NVDA)
```

### Tavily MCP (`backend/mcp_servers/tavily_server.py`)
```
Tools exposed:
  search_stock_news(ticker, company, max_results)
      → Latest financial news, ranked by relevance
  search_market_sentiment(query)
      → Broader analyst opinions and market commentary

Source: Tavily AI Search (1000 calls/month free tier)
```

### pandas-ta MCP (`backend/mcp_servers/technical_server.py`)
```
Tools exposed:
  get_technical_indicators(ticker)
      → RSI(14), MACD(12,26,9), Bollinger Bands(20),
        SMA 50, SMA 200, Support, Resistance

Computed: Locally using pandas + ta library
No API call needed. Computed from yfinance price history.
```

---

## 🛠 Tech Stack

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Agent Framework | **CrewAI** | 1.14.x | Agent roles, goals, sequential execution |
| Orchestration | **LangGraph** | 0.2.x | Stateful graph, conditional routing, reflexion |
| Observability | **LangSmith** | 0.1.x | Full trace trees, latency, evaluation |
| Tool Protocol | **FastMCP** | Latest | MCP server implementation |
| API Server | **FastAPI** | 0.115 | REST + WebSocket endpoints |
| LLM — Fast | **Llama 3.3 70B** | Groq | Market, News, Technical, Synthesis, Critic agents |
| LLM — Precise | **Llama 3.1 8B** | Groq | Fundamentals, Risk, Sentiment agents |
| Market Data | **yfinance** | 0.2.44 | Price, fundamentals, OHLCV history |
| News | **Tavily** | 0.3.x | Real-time financial news search |
| Technical | **ta (pandas-ta)** | 0.11.0 | RSI, MACD, Bollinger, SMA computation |
| PDF Export | **ReportLab + Matplotlib** | Latest | Branded reports with 4 embedded charts |
| Memory | **Mem0** | 0.1.x | Cross-session agent memory |

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | **React** | 18 | Component-based UI |
| Build Tool | **Vite** | 5.x | Fast HMR, optimized builds |
| Styling | **Tailwind CSS** | 3.x | Utility-first CSS |
| Charts | **TradingView Lightweight Charts** | 4.1.3 | Candlestick, volume, SMA overlays |
| Animation | **Framer Motion** | 12.x | Smooth transitions |
| Data Fetching | **TanStack Query** | 5.x | Caching, refetching |
| Font | **DM Sans + DM Mono** | Google Fonts | Clean, professional typography |

### Infrastructure

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Containerization | **Docker + Docker Compose** | Consistent environments |
| Backend Deploy | **Render (free tier)** | FastAPI + auto-deploy |
| Frontend Deploy | **Vercel (free tier)** | React + CDN edge |
| CI/CD | **GitHub Actions** | Auto-deploy on push to main |
| Version Control | **GitHub** | Source of truth |

---

## ✨ Features

### 🌡 Nifty 50 Live Heatmap
The homepage displays all 20 major NSE stocks as a color-coded heatmap by live day change. Stocks glow green or red based on performance intensity. Click any cell to immediately launch a full 8-agent analysis. Sector-wise grouping with sector average change shown.

### 📈 TradingView Candlestick Charts
Professional-grade candlestick charts using TradingView's Lightweight Charts library — the same chart library used by Zerodha Kite and Groww. Features:
- 1W / 1M / 3M / 6M / 1Y timeframe switching
- Volume bars with buy/sell color coding
- SMA 50 (amber) and SMA 200 (blue) overlays
- Support and resistance dashed price lines
- Pinch-to-zoom and scroll

### 🔴 Live Agent Activity Feed
A WebSocket-powered sidebar streams each agent's status in real time as the pipeline runs. Users watch the research happen live — each agent completing with timestamps. No black box.

### ⚖️ Critic Reflexion Loop
After the Synthesizer produces a verdict, the Critic agent actively challenges it — finding contradictions between agents, checking confidence calibration, flagging missed risks. If challenged, the Synthesizer defends or revises. This loop runs maximum twice. This is how real investment committees work.

### 📊 Multi-Tab Analysis
Analyze up to 4 stocks simultaneously in browser tabs. Each tab holds its own independent WebSocket connection, agent state, and cached analysis. Switch between them instantly.

### 📄 PDF Research Report
One-click export generates a branded PDF report with:
- Dark-themed cover with stock name and verdict
- Key metrics table
- Price history chart (6 months, candlestick style)
- Technical indicators dashboard (RSI gauge, MACD bars, Bollinger position)
- Confidence + Sentiment donut charts
- Risk radar chart
- All 6 agent analysis sections
- Critic review section
- Disclaimer footer

### 🤖 Stock-Specific Chatbot
Bottom-right widget with finance-only guardrails. Uses cached analysis context — no new API calls for follow-up questions. Ask "Why BUY?", "What's the stop loss?", "Key risks?" — gets specific answers using the actual research just conducted. Finance guardrails block off-topic questions.

### 🌓 Dark / Light Mode
Full theme toggle. Dark mode is Zerodha Kite inspired. Light mode is clean and professional. CSS variables ensure instant switching.

---

## 📁 Project Structure

```
bharat-equity-agent/
│
├── 📁 backend/                        # FastAPI + Agent pipeline
│   │
│   ├── 📁 agents/                     # All CrewAI agent definitions
│   │   ├── __init__.py
│   │   ├── crew_runner.py             # Main crew orchestrator
│   │   ├── llm_config.py             # Groq LLM configuration
│   │   ├── research_agents.py        # 6 CrewAI agent definitions
│   │   ├── research_tasks.py         # 6 CrewAI task definitions
│   │   ├── synthesis_agents.py       # Synthesizer + Critic agents
│   │   └── tools.py                  # CrewAI tool wrappers
│   │
│   ├── 📁 mcp_servers/               # Model Context Protocol servers
│   │   ├── __init__.py
│   │   ├── yfinance_server.py        # Price, fundamentals, history
│   │   ├── tavily_server.py          # News + sentiment search
│   │   └── technical_server.py      # RSI, MACD, Bollinger, SMA
│   │
│   ├── 📁 graph/                     # LangGraph state machine
│   │   ├── __init__.py
│   │   ├── stock_graph.py            # Full pipeline graph definition
│   │   └── test_graph.py             # End-to-end pipeline test
│   │
│   ├── 📁 memory/                    # Mem0 agent memory
│   │   └── __init__.py
│   │
│   ├── 📁 api/                       # FastAPI route modules
│   │   └── __init__.py
│   │
│   ├── main.py                       # FastAPI app + WebSocket + PDF export
│   ├── Dockerfile                    # Production container
│   ├── requirements.txt              # Python dependencies
│   └── test_mcp.py                   # MCP server diagnostic tool
│
├── 📁 frontend/                      # React + Vite application
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── TopBar.jsx            # Search, tabs, theme toggle
│   │   │   ├── StockHeader.jsx       # Price, metrics, 52W range
│   │   │   ├── PriceChart.jsx        # TradingView candlestick chart
│   │   │   ├── TechnicalPanel.jsx    # RSI, MACD, SMA indicators
│   │   │   ├── NewsFeed.jsx          # News cards + sentiment bar
│   │   │   ├── VerdictCard.jsx       # BUY/HOLD/SELL card + export
│   │   │   ├── AgentFeed.jsx         # Live WebSocket event stream
│   │   │   ├── Heatmap.jsx           # Nifty 50 live heatmap
│   │   │   └── Chatbot.jsx           # Bottom-right stock chatbot
│   │   │
│   │   ├── 📁 lib/
│   │   │   └── api.js                # API helpers + WebSocket factory
│   │   │
│   │   ├── App.jsx                   # Root component + multi-tab state
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css                 # CSS variables + global styles
│   │
│   ├── vercel.json                   # Vercel SPA routing config
│   ├── vite.config.js                # Vite build config
│   ├── tailwind.config.js            # Tailwind theme config
│   └── package.json
│
├── 📁 .github/
│   └── 📁 workflows/
│       └── deploy.yml                # GitHub Actions CI/CD
│
├── docker-compose.yml                # Local + production stack
├── .env.example                      # Environment variable template
├── .gitignore
└── README.md                         # This file
```

---

## 🚀 Local Setup

### Prerequisites

| Requirement | Version | Notes |
|------------|---------|-------|
| Python | 3.12.x | Must be 3.12 — not 3.11 or 3.13 |
| Node.js | 20+ | LTS recommended |
| Git | Any | For cloning |
| API Keys | — | See Environment Variables section |

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/bharat-equity-agent.git
cd bharat-equity-agent
```

### Step 2 — Backend setup

```bash
# Navigate to backend
cd backend

# Create virtual environment with Python 3.12
py -3.12 -m venv venv          # Windows
# python3.12 -m venv venv      # Mac/Linux

# Activate
venv\Scripts\activate           # Windows
# source venv/bin/activate      # Mac/Linux

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env and fill in your API keys (see below)
```

### Step 3 — Frontend setup

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install --legacy-peer-deps

# Create environment file
echo "VITE_API_URL=http://localhost:8000" > .env
```

### Step 4 — Run locally

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate    # Windows
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

### Step 5 — Test the pipeline

```bash
# Test MCP servers (verify live data)
cd backend
python test_mcp.py

# Test full agent pipeline
python graph/test_graph.py RELIANCE.NS
```

Expected output for `test_mcp.py`:
```
Testing yfinance MCP server...
Stock: Reliance Industries Limited
Price: 1367.0
History rows: 126 days
Testing technical MCP server...
RSI: 48.5 — Neutral
MACD: -9.11 — Bearish
Testing Tavily news MCP server...
- Reliance Industries...
ALL MCP SERVERS WORKING
```

### Docker (optional — full stack)

```bash
# Copy and fill environment file
cp .env.example .env

# Build and start
docker-compose up --build

# Backend: http://localhost:8000
# Frontend: run npm run dev separately
```

---

## 🔑 Environment Variables

Create `.env` in the project root and fill in these values:

```env
# ── LLM Provider ──────────────────────────────────────────────────────────
# Groq (free tier — Llama 3.3 70B + 3.1 8B)
# Get at: console.groq.com → API Keys
GROQ_API_KEY=gsk_...

# ── News & Search ─────────────────────────────────────────────────────────
# Tavily AI Search (1000 calls/month free)
# Get at: app.tavily.com → Dashboard
TAVILY_API_KEY=tvly-...

# ── Observability ─────────────────────────────────────────────────────────
# LangSmith — trace every LLM call (free tier)
# Get at: smith.langchain.com → Settings → API Keys
LANGSMITH_API_KEY=ls__...
LANGSMITH_PROJECT=bharat-equity-agent
LANGCHAIN_TRACING_V2=true

# ── Agent Memory ──────────────────────────────────────────────────────────
# Mem0 — cross-session agent memory (free tier)
# Get at: app.mem0.ai → API Keys
MEM0_API_KEY=m0-...

# ── Infrastructure ────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
CREWAI_STORAGE_DIR=./crewai_storage
```

**Where to get each key (all free):**

| Key | URL | Free Tier |
|-----|-----|-----------|
| `GROQ_API_KEY` | console.groq.com | Generous token limits |
| `TAVILY_API_KEY` | app.tavily.com | 1,000 searches/month |
| `LANGSMITH_API_KEY` | smith.langchain.com | 5,000 traces/month |
| `MEM0_API_KEY` | app.mem0.ai | Free tier available |

> **Note:** `yfinance` requires no API key. `pandas-ta` is fully local. No paid APIs are required.

---

## 📡 API Reference

Base URL: `http://localhost:8000` (local) or your Render URL (production)

### REST Endpoints

#### `GET /health`
Health check.
```json
{ "status": "ok", "project": "bharat-equity-agent", "version": "1.0.0" }
```

#### `GET /api/stock/{ticker}`
Fetch live market data, technical indicators, and 6-month price history.
```
Parameters: ticker (e.g. RELIANCE.NS, TCS.NS, AAPL)

Response:
{
  "success": true,
  "ticker": "RELIANCE.NS",
  "market_data": {
    "current_price": 1367.0,
    "previous_close": 1354.5,
    "day_high": 1371.1,
    "day_low": 1357.0,
    "week_52_high": 1611.8,
    "week_52_low": 1290.0,
    "volume": 6747569,
    "avg_volume": 20014439,
    "market_cap": 18498889711616,
    "pe_ratio": 22.68,
    "eps": 60.28,
    "beta": 0.244,
    ...
  },
  "indicators": {
    "rsi": 48.5,
    "rsi_signal": "Neutral",
    "macd": -9.11,
    "macd_label": "Bearish",
    "sma_50": 1374.77,
    "sma_200": 1429.72,
    "support": 1322.7,
    "resistance": 1463.6,
    ...
  },
  "price_history": [ { "date": "2025-11-25", "open": ..., "close": ... }, ... ]
}
```

#### `GET /api/news/{ticker}`
Fetch latest news articles.
```
Response:
{
  "success": true,
  "news": [
    { "title": "...", "url": "...", "source": "...", "content": "...", "published_date": "..." }
  ]
}
```

#### `POST /api/chat`
Ask a finance-related question about an analyzed stock.
```
Body:
{
  "ticker": "RELIANCE.NS",
  "question": "Why is the verdict HOLD and not BUY?",
  "session_id": "default"
}

Response:
{
  "success": true,
  "answer": "The HOLD verdict reflects...",
  "ticker": "RELIANCE.NS"
}
```

#### `GET /api/export/{ticker}`
Generate and download a PDF research report.
```
Returns: application/pdf (streamed)
Filename: bharat-equity-{ticker}-report.pdf

Requires: Prior analysis via WebSocket (cached in session_store)
```

### WebSocket Endpoint

#### `WS /ws/analyze/{ticker}`
Stream the full 8-agent pipeline in real-time.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/analyze/RELIANCE.NS');
```

**Event types received:**
```javascript
// Pipeline started
{ "type": "started", "message": "Starting analysis for RELIANCE.NS...", "ticker": "RELIANCE.NS" }

// Agent event (streamed as each agent completes)
{ "type": "agent_event", "agent": "Data Fetcher", "status": "done", "message": "All market data fetched." }
{ "type": "agent_event", "agent": "CrewAI Orchestrator", "status": "running", "message": "Launching 6 agents..." }
{ "type": "agent_event", "agent": "Synthesizer", "status": "done", "message": "Verdict: HOLD with 74% confidence." }
{ "type": "agent_event", "agent": "Critic", "status": "warning", "message": "Verdict challenged. Revised: 60%." }

// Final verdict (full payload)
{
  "type": "verdict",
  "ticker": "RELIANCE.NS",
  "verdict": "HOLD",
  "confidence": 60,
  "price_target": 1480.0,
  "stop_loss": 1270.0,
  "summary": "...",
  "bull_case": "...",
  "bear_case": "...",
  "critic_challenge": "...",
  "critic_note": "...",
  "critic_passed": false,
  "agent_outputs": { "market_data": "...", "news": "...", ... },
  "market_data": { ... },
  "indicators": { ... },
  "price_history": [ ... ],
  "news": [ ... ]
}

// Complete
{ "type": "complete", "message": "Analysis complete." }

// Error
{ "type": "error", "message": "..." }
```

---

## 🌐 Deployment

### Backend — Render (Free Tier)

1. Go to **render.com** → Sign up → **New Web Service**
2. Connect your GitHub repository
3. Configure:
   ```
   Name:            bharat-equity-agent-backend
   Root Directory:  backend
   Build Command:   pip install -r requirements.txt
   Start Command:   uvicorn main:app --host 0.0.0.0 --port $PORT
   Instance Type:   Free
   ```
4. **Environment Variables** → Add all keys from `.env` one by one
5. Click **Create Web Service**
6. Wait 3–5 minutes for first deploy
7. Copy your URL: `https://bharat-equity-agent-backend.onrender.com`

> **Note:** Render free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds. Add a `/ping` call in your frontend to wake it on page load.

### Frontend — Vercel (Free Tier)

1. Go to **vercel.com** → **Add New Project**
2. Import your GitHub repository
3. Configure:
   ```
   Framework Preset: Vite
   Root Directory:   frontend
   Build Command:    npm install --legacy-peer-deps && npm run build
   Output Directory: dist
   ```
4. **Environment Variables** → Add:
   ```
   VITE_API_URL = https://your-render-url.onrender.com
   ```
5. Click **Deploy**
6. Your app is live at `https://your-project.vercel.app`

### GitHub Actions CI/CD

Every push to `main` automatically:
1. Builds the React frontend
2. Deploys to Vercel

Add these secrets at: GitHub repo → Settings → Secrets → Actions

```
VERCEL_TOKEN         # vercel.com → Account Settings → Tokens
VERCEL_ORG_ID        # vercel.com → Account Settings → General
VERCEL_PROJECT_ID    # vercel.com → Project → Settings → General
VITE_API_URL         # your Render backend URL
```

---

## 🔭 LangSmith Observability

Every LLM call in this system is traced by LangSmith automatically.

**What you can see in the LangSmith dashboard:**

```
Run: analyze_RELIANCE.NS
├── node_fetch_data          (0.8s)  ← yfinance + Tavily calls
├── node_run_agents          (45.2s) ← CrewAI crew
│   ├── Market Data Agent    (6.1s)
│   ├── News Agent           (5.3s)
│   ├── Sentiment Agent      (4.8s)
│   ├── Fundamentals Agent   (7.2s)
│   ├── Technical Agent      (5.9s)
│   └── Risk Agent           (6.4s)
├── node_synthesize          (3.1s)  ← Synthesizer LLM call
│   └── llm_call             (2.8s)
│       ├── prompt: [full system + user prompt]
│       └── output: VERDICT: HOLD\nCONFIDENCE: 74%...
└── node_critic              (2.4s)  ← Critic LLM call
    └── llm_call             (2.1s)
        ├── prompt: [challenge prompt]
        └── output: VERDICT_STANDS: NO\nCHALLENGE:...
```

**Setting up evaluations:**
1. Go to smith.langchain.com → Datasets → Create
2. Add test tickers: RELIANCE.NS, TCS.NS, HDFCBANK.NS, AAPL, NVDA
3. Run evaluation → Compare verdict accuracy and confidence calibration

---

## 💼 Recruiter FAQ

**Q: What makes this different from a simple LangChain chatbot?**

A: Three things. First, this uses a true multi-agent architecture where each agent has a specific role, goal, and backstory — not just different prompts. Second, it implements a reflexion loop where a Critic agent challenges the Synthesizer's verdict before it finalizes — a pattern from the 2023 Reflexion paper. Third, it uses MCP (Model Context Protocol) — Anthropic's 2024 standard for composable AI tools — meaning every data source is a replaceable, composable server.

**Q: Does it use real data or mock data?**

A: 100% real live data. yfinance fetches live NSE/BSE prices with no API key. Tavily searches real news articles published in the last 24-48 hours. pandas-ta computes technical indicators from actual OHLCV history. Zero mock data anywhere in the system.

**Q: What happens if an agent gives wrong information?**

A: The Critic agent is specifically designed to catch this. It reviews the Synthesizer's verdict for contradictions — for example, if the Technical agent flagged a downtrend but the Synthesizer issued a BUY with 85% confidence, the Critic challenges this inconsistency and forces revision. LangSmith traces show every prompt and response, so the full reasoning chain is auditable.

**Q: Why Groq instead of OpenAI?**

A: Groq's free tier provides Llama 3.3 70B inference at ~500 tokens/second — fast enough for a 6-agent sequential pipeline to complete in under 60 seconds without rate-limiting issues. OpenAI GPT-4o would cost money and the quality difference for structured financial analysis tasks is minimal. This is a deliberate architectural choice, not a limitation.

**Q: What is MCP and why does it matter?**

A: Model Context Protocol is the standard Anthropic introduced in late 2024 for how AI agents interact with external tools. Instead of hardcoding API calls inside agent code, each tool is exposed as a standalone MCP server with a defined schema. This means you can swap the news provider from Tavily to NewsAPI without touching any agent code — just point to a different MCP server. It's the difference between tightly coupled and loosely coupled AI systems.

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [CrewAI](https://crewai.com) — multi-agent framework
- [LangGraph](https://langchain-ai.github.io/langgraph) — stateful agent orchestration
- [Groq](https://groq.com) — ultra-fast LLM inference
- [Tavily](https://tavily.com) — AI-optimized search
- [TradingView](https://tradingview.com) — Lightweight Charts library
- [yfinance](https://github.com/ranaroussi/yfinance) — Yahoo Finance data

---

<div align="center">

**Built with CrewAI · LangGraph · MCP · Groq · React · TradingView**

*If this project helped you, please ⭐ star the repository*

</div>