import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGSMITH_PROJECT", "bharat-equity-agent")
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGSMITH_API_KEY", "")

app = FastAPI(title="Bharat Equity Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store for chatbot context
session_store = {}


@app.get("/health")
def health():
    return {"status": "ok", "project": "bharat-equity-agent", "version": "1.0.0"}


@app.get("/ping")
def ping():
    return {"alive": True}


@app.get("/api/stock/{ticker}")
async def get_stock_data(ticker: str):
    """REST endpoint — returns raw market data for stock header UI."""
    from mcp_servers.yfinance_server import get_stock_data as fetch_stock
    from mcp_servers.technical_server import get_technical_indicators
    from mcp_servers.yfinance_server import get_price_history

    try:
        data = fetch_stock(ticker)
        indicators = get_technical_indicators(ticker)
        history = get_price_history(ticker, period="6mo")
        return {
            "success": True,
            "ticker": ticker,
            "market_data": data,
            "indicators": indicators,
            "price_history": history,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/news/{ticker}")
async def get_news(ticker: str):
    """REST endpoint — returns latest news for a ticker."""
    from mcp_servers.tavily_server import search_stock_news
    company = ticker.replace(".NS", "").replace(".BO", "")
    try:
        news = search_stock_news(ticker, company, max_results=6)
        return {"success": True, "news": news}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.websocket("/ws/analyze/{ticker}")
async def analyze_websocket(websocket: WebSocket, ticker: str):
    """
    WebSocket endpoint — streams the full agent pipeline live.
    Frontend connects here and receives events as agents complete.
    """
    await websocket.accept()

    try:
        await websocket.send_json({
            "type": "started",
            "message": f"Starting analysis for {ticker}...",
            "ticker": ticker
        })

        # Run the full LangGraph pipeline in a thread
        # to avoid blocking the event loop
        loop = asyncio.get_event_loop()

        def run_pipeline():
            from graph.stock_graph import build_graph
            graph = build_graph()
            initial_state = {
                "ticker": ticker,
                "market_data_raw": None,
                "financials_raw": None,
                "indicators_raw": None,
                "price_history": None,
                "news_raw": None,
                "agent_outputs": None,
                "synthesis": None,
                "critic": None,
                "final_verdict": None,
                "final_confidence": None,
                "loop_count": 0,
                "events": [],
                "error": None,
            }
            return graph.invoke(initial_state)

        result = await loop.run_in_executor(None, run_pipeline)

        # Stream all events to frontend
        for event in result.get("events", []):
            await websocket.send_json({
                "type": "agent_event",
                "agent": event["agent"],
                "status": event["status"],
                "message": event["message"],
            })
            await asyncio.sleep(0.1)

        # Cache the full result for chatbot use
        session_store[ticker] = result

        # Send final verdict
        synthesis = result.get("synthesis", {})
        critic = result.get("critic", {})

        await websocket.send_json({
            "type": "verdict",
            "ticker": ticker,
            "verdict": result.get("final_verdict", "HOLD"),
            "confidence": critic.get("revised_confidence") or result.get("final_confidence", 60),
            "price_target": synthesis.get("price_target"),
            "stop_loss": synthesis.get("stop_loss"),
            "summary": synthesis.get("summary", ""),
            "bull_case": synthesis.get("bull_case", ""),
            "bear_case": synthesis.get("bear_case", ""),
            "critic_challenge": critic.get("challenge", ""),
            "critic_note": critic.get("critic_note", ""),
            "critic_passed": critic.get("verdict_stands", True),
            "agent_outputs": result.get("agent_outputs", {}),
            "market_data": result.get("market_data_raw", {}),
            "indicators": result.get("indicators_raw", {}),
            "price_history": result.get("price_history", []),
            "news": result.get("news_raw", []),
        })

        await websocket.send_json({"type": "complete", "message": "Analysis complete."})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})


class ChatRequest(BaseModel):
    ticker: str
    question: str
    session_id: str = "default"


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Finance-only chatbot endpoint.
    Uses cached stock analysis context.
    """

    from agents.synthesis_agents import call_groq

    finance_keywords = [
        'stock', 'price', 'buy', 'sell', 'hold', 'verdict', 'target',
        'loss', 'risk', 'fundamentals', 'revenue', 'profit', 'pe',
        'eps', 'rsi', 'macd', 'sentiment', 'news', 'market',
        'invest', 'share', 'equity', 'technical', 'support',
        'resistance', 'sma', 'bollinger', 'confidence',
        'analyst', 'earnings', 'dividend', 'beta',
        'volume', 'chart', 'trend', 'bearish',
        'bullish', 'analysis', 'portfolio',
        'return', 'growth', 'debt', 'cashflow'
    ]

    # Add ticker variations
    finance_keywords.extend([
        request.ticker.lower(),
        request.ticker.lower().replace(".ns", ""),
        request.ticker.lower().replace(".bo", "")
    ])

    question_lower = request.question.lower()

    is_finance_question = any(
        kw in question_lower
        for kw in finance_keywords
    )

    # Reject Non-Finance Questions
    if not is_finance_question:
        return {
            "success": True,
            "answer": (
                f"I'm a stock research assistant focused only on "
                f"{request.ticker}. I can answer questions about "
                f"price, technicals, fundamentals, risks, sentiment, "
                f"targets, and market analysis."
            ),
            "ticker": request.ticker
        }


    # Fetch Cached Analysis
    cached = session_store.get(request.ticker)

    if cached:
        context = f"""
Ticker: {request.ticker}

Verdict:
{cached.get('final_verdict')}
with {cached.get('final_confidence')}% confidence

Market Data:{cached.get('market_data_raw', {})}

Indicators:{cached.get('indicators_raw', {})}

Agent Analysis Summary:

Market:{cached.get('agent_outputs', {}).get('market_data', '')[:300]}

Sentiment:{cached.get('agent_outputs', {}).get('sentiment', '')[:200]}

Fundamentals:{cached.get('agent_outputs', {}).get('fundamentals', '')[:300]}

Technical:{cached.get('agent_outputs', {}).get('technical', '')[:200]}

Risk:{cached.get('agent_outputs', {}).get('risk', '')[:200]}

Synthesis:{cached.get('synthesis', {}).get('summary', '')}

Critic Note:{cached.get('critic', {}).get('critic_note', '')}
"""
    else:
        context = (
            f"Stock ticker: {request.ticker}. "
            f"No cached analysis available yet. "
            f"Run the analysis first."
        )


    # System Prompt
    system = f"""
You are a stock research assistant ONLY for {request.ticker}.

You ONLY answer questions related to:
- stock price
- technical analysis
- fundamentals
- risks
- market sentiment
- support/resistance
- targets
- stop loss
- verdict
- earnings
- financial news

If the user asks anything unrelated to stocks or finance,
politely decline and redirect them back to stock-related topics.

Use actual values from the context whenever available.

Keep responses concise and under 150 words.
"""

    user = (
        f"Context:\n{context}\n\n"
        f"Question about {request.ticker}: "
        f"{request.question}"
    )


    # Generate Response
    try:
        answer = call_groq(system, user)

        return {
            "success": True,
            "answer": answer,
            "ticker": request.ticker
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    
@app.get("/api/export/{ticker}")
async def export_pdf(ticker: str):
    import io
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    from matplotlib.patches import FancyBboxPatch
    import numpy as np
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.colors import HexColor, white
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table,
        TableStyle, HRFlowable, Image as RLImage
    )
    from reportlab.lib.units import mm
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from io import BytesIO
    from datetime import datetime
    from fastapi.responses import StreamingResponse

    cached = session_store.get(ticker)
    if not cached:
        return {"error": "No analysis found. Run analysis first then export."}

    m       = cached.get('market_data_raw', {})
    synth   = cached.get('synthesis', {})
    critic  = cached.get('critic', {})
    agents  = cached.get('agent_outputs', {})
    ind     = cached.get('indicators_raw', {})
    history = cached.get('price_history', [])
    verdict    = cached.get('final_verdict', 'HOLD')
    confidence = critic.get('revised_confidence') or cached.get('final_confidence', 60)

    # ── Colours ──────────────────────────────────────────────────────────────
    C_BG     = '#0A0E1A'
    C_CARD   = '#141B2D'
    C_BORDER = '#1E2A40'
    C_GREEN  = '#00C896'
    C_RED    = '#FF4D4D'
    C_AMBER  = '#F5A623'
    C_BLUE   = '#3B82F6'
    C_TEXT   = '#E8EDF5'
    C_GRAY   = '#8896B0'

    verdict_color = C_GREEN if verdict == 'BUY' else C_RED if verdict == 'SELL' else C_AMBER

    def hex_to_rl(h):
        return HexColor(h)

    # ══════════════════════════════════════════════════════════════════════════
    # CHART 1 — Price history line chart
    # ══════════════════════════════════════════════════════════════════════════
    def make_price_chart():
        if not history or len(history) < 5:
            return None
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 4.5),
                                        gridspec_kw={'height_ratios': [3, 1]},
                                        facecolor=C_CARD)
        fig.subplots_adjust(hspace=0.05, left=0.06, right=0.97, top=0.88, bottom=0.1)

        dates  = [d['date']  for d in history]
        closes = [d['close'] for d in history]
        vols   = [d['volume'] for d in history]
        opens  = [d['open']  for d in history]
        x      = list(range(len(dates)))

        # Gradient fill under price line
        ax1.set_facecolor(C_CARD)
        ax1.plot(x, closes, color=C_GREEN, linewidth=1.5, zorder=3)
        ax1.fill_between(x, closes, min(closes), alpha=0.15, color=C_GREEN, zorder=2)

        # SMA lines
        if len(closes) >= 50 and ind.get('sma_50'):
            ax1.axhline(ind['sma_50'], color=C_AMBER, linewidth=0.8, linestyle='--', alpha=0.7, label=f"SMA50 ₹{ind['sma_50']:.0f}")
        if len(closes) >= 50 and ind.get('sma_200'):
            ax1.axhline(ind['sma_200'], color=C_BLUE, linewidth=0.8, linestyle='--', alpha=0.7, label=f"SMA200 ₹{ind['sma_200']:.0f}")
        if ind.get('support'):
            ax1.axhline(ind['support'], color=C_GREEN, linewidth=0.6, linestyle=':', alpha=0.5, label=f"Support ₹{ind['support']:.0f}")
        if ind.get('resistance'):
            ax1.axhline(ind['resistance'], color=C_RED, linewidth=0.6, linestyle=':', alpha=0.5, label=f"Resistance ₹{ind['resistance']:.0f}")

        # Tick labels — show every 20th date
        tick_positions = x[::max(1, len(x)//8)]
        tick_labels    = [dates[i][:7] for i in tick_positions]
        ax1.set_xticks([])
        ax1.set_yticks(ax1.get_yticks())
        ax1.tick_params(colors=C_GRAY, labelsize=7)
        ax1.yaxis.tick_right()
        for spine in ax1.spines.values():
            spine.set_color(C_BORDER)
        ax1.set_title(f"{m.get('name', ticker)} — 6M Price History",
                      color=C_TEXT, fontsize=10, fontweight='bold', pad=10, loc='left')
        ax1.legend(fontsize=7, loc='upper left',
                   facecolor=C_CARD, edgecolor=C_BORDER, labelcolor=C_GRAY)
        ax1.grid(color=C_BORDER, linewidth=0.4, linestyle='--', alpha=0.5)

        # Volume bars
        ax2.set_facecolor(C_CARD)
        bar_colors = [C_GREEN if closes[i] >= opens[i] else C_RED for i in range(len(x))]
        ax2.bar(x, vols, color=bar_colors, alpha=0.6, width=0.8)
        ax2.set_xticks(tick_positions)
        ax2.set_xticklabels(tick_labels, color=C_GRAY, fontsize=6, rotation=30)
        ax2.tick_params(colors=C_GRAY, labelsize=6)
        ax2.yaxis.tick_right()
        for spine in ax2.spines.values():
            spine.set_color(C_BORDER)
        ax2.set_ylabel('Volume', color=C_GRAY, fontsize=7)
        ax2.grid(color=C_BORDER, linewidth=0.3, linestyle='--', alpha=0.4)

        buf = BytesIO()
        fig.savefig(buf, format='png', dpi=150, facecolor=C_CARD, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        return buf

    # ══════════════════════════════════════════════════════════════════════════
    # CHART 2 — Technical indicators dashboard
    # ══════════════════════════════════════════════════════════════════════════
    def make_technical_chart():
        if not ind:
            return None
        fig, axes = plt.subplots(1, 3, figsize=(10, 2.8), facecolor=C_CARD)
        fig.subplots_adjust(wspace=0.35, left=0.05, right=0.97, top=0.82, bottom=0.15)

        # ── RSI gauge ──
        ax = axes[0]
        ax.set_facecolor(C_CARD)
        rsi = ind.get('rsi', 50)
        theta = np.linspace(np.pi, 0, 200)
        # Background arc zones
        ax.plot(np.cos(theta[:67]),  np.sin(theta[:67]),  color=C_RED,   linewidth=6, alpha=0.3)
        ax.plot(np.cos(theta[67:133]), np.sin(theta[67:133]), color=C_AMBER, linewidth=6, alpha=0.3)
        ax.plot(np.cos(theta[133:]), np.sin(theta[133:]), color=C_GREEN, linewidth=6, alpha=0.3)
        # RSI needle
        rsi_angle = np.pi - (rsi / 100) * np.pi
        ax.annotate('', xy=(0.6*np.cos(rsi_angle), 0.6*np.sin(rsi_angle)),
                    xytext=(0, 0),
                    arrowprops=dict(arrowstyle='->', color=C_TEXT, lw=2))
        ax.text(0, -0.25, f'{rsi:.1f}', ha='center', va='center',
                color=C_TEXT, fontsize=14, fontweight='bold')
        ax.text(0, -0.55, 'RSI (14)', ha='center', va='center', color=C_GRAY, fontsize=8)
        rsi_label = 'Overbought' if rsi > 70 else 'Oversold' if rsi < 30 else 'Neutral'
        rsi_col   = C_RED if rsi > 70 else C_GREEN if rsi < 30 else C_AMBER
        ax.text(0, -0.75, rsi_label, ha='center', color=rsi_col, fontsize=7, fontweight='bold')
        ax.set_xlim(-1.2, 1.2); ax.set_ylim(-0.9, 1.1)
        ax.axis('off')
        ax.set_title('RSI Gauge', color=C_TEXT, fontsize=8, pad=6)

        # ── MACD bar chart ──
        ax2 = axes[1]
        ax2.set_facecolor(C_CARD)
        macd_val  = ind.get('macd', 0)
        signal_val = ind.get('macd_signal_line', 0)
        histogram  = macd_val - signal_val
        bars = ax2.bar(['MACD', 'Signal', 'Histogram'],
                       [macd_val, signal_val, histogram],
                       color=[C_BLUE, C_AMBER, C_GREEN if histogram >= 0 else C_RED],
                       alpha=0.85, width=0.5)
        ax2.axhline(0, color=C_BORDER, linewidth=0.8)
        ax2.tick_params(colors=C_GRAY, labelsize=7)
        for spine in ax2.spines.values():
            spine.set_color(C_BORDER)
        ax2.set_facecolor(C_CARD)
        for bar, val in zip(bars, [macd_val, signal_val, histogram]):
            ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.1,
                     f'{val:.2f}', ha='center', color=C_TEXT, fontsize=7)
        ax2.set_title('MACD', color=C_TEXT, fontsize=8, pad=6)
        ax2.grid(color=C_BORDER, linewidth=0.3, linestyle='--', alpha=0.4, axis='y')

        # ── Bollinger position ──
        ax3 = axes[2]
        ax3.set_facecolor(C_CARD)
        bb_upper = ind.get('bollinger_upper', 0)
        bb_lower = ind.get('bollinger_lower', 0)
        bb_mid   = ind.get('bollinger_mid', 0)
        cp       = ind.get('current_price', bb_mid)
        if bb_upper and bb_lower and bb_upper != bb_lower:
            pos_pct = (cp - bb_lower) / (bb_upper - bb_lower) * 100
        else:
            pos_pct = 50
        # Vertical band
        ax3.barh(['Price'], [100], color=C_BORDER, alpha=0.3, height=0.4)
        ax3.barh(['Price'], [pos_pct], color=verdict_color, alpha=0.7, height=0.4)
        ax3.axvline(50, color=C_GRAY, linewidth=0.8, linestyle='--', alpha=0.6)
        ax3.text(pos_pct, 0, f' {pos_pct:.0f}%', va='center', color=C_TEXT, fontsize=9, fontweight='bold')
        ax3.text(0,  -0.4, f'₹{bb_lower:.0f}', color=C_GREEN, fontsize=7)
        ax3.text(50, -0.4, f'₹{bb_mid:.0f}',   color=C_GRAY,  fontsize=7, ha='center')
        ax3.text(100,-0.4, f'₹{bb_upper:.0f}',  color=C_RED,   fontsize=7, ha='right')
        ax3.set_xlim(0, 100)
        ax3.set_title('Bollinger Position', color=C_TEXT, fontsize=8, pad=6)
        ax3.tick_params(colors=C_GRAY, labelsize=7)
        for spine in ax3.spines.values():
            spine.set_color(C_BORDER)
        ax3.set_yticks([])
        ax3.grid(color=C_BORDER, linewidth=0.3, linestyle='--', alpha=0.3, axis='x')

        buf = BytesIO()
        fig.savefig(buf, format='png', dpi=150, facecolor=C_CARD, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        return buf

    # ══════════════════════════════════════════════════════════════════════════
    # CHART 3 — Confidence & sentiment donut
    # ══════════════════════════════════════════════════════════════════════════
    def make_confidence_chart():
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(6, 2.8), facecolor=C_CARD)
        fig.subplots_adjust(left=0.02, right=0.98, top=0.85, bottom=0.05, wspace=0.1)

        # Confidence donut
        conf  = confidence
        rem   = 100 - conf
        col   = C_GREEN if verdict == 'BUY' else C_RED if verdict == 'SELL' else C_AMBER
        wedges, _ = ax1.pie([conf, rem],
                            colors=[col, C_BORDER],
                            startangle=90,
                            wedgeprops=dict(width=0.45, edgecolor=C_CARD, linewidth=2))
        ax1.text(0, 0.1,  f'{conf}%',   ha='center', color=C_TEXT,  fontsize=16, fontweight='bold')
        ax1.text(0, -0.25, verdict,      ha='center', color=col,     fontsize=10, fontweight='bold')
        ax1.text(0, -0.5,  'Confidence', ha='center', color=C_GRAY,  fontsize=7)
        ax1.set_facecolor(C_CARD)
        ax1.set_title('AI Verdict', color=C_TEXT, fontsize=8, pad=6)

        # Sentiment donut — parse from agent output
        sent_text = agents.get('sentiment', '')
        pos_pct, neu_pct, neg_pct = 40, 30, 30
        import re
        pos_m = re.search(r'[Pp]ositive[:\s]+(\d+)%', sent_text)
        neu_m = re.search(r'[Nn]eutral[:\s]+(\d+)%',  sent_text)
        neg_m = re.search(r'[Nn]egative[:\s]+(\d+)%', sent_text)
        if pos_m: pos_pct = int(pos_m.group(1))
        if neu_m: neu_pct = int(neu_m.group(1))
        if neg_m: neg_pct = int(neg_m.group(1))

        total = pos_pct + neu_pct + neg_pct
        if total != 100:
            pos_pct = round(pos_pct / total * 100)
            neu_pct = round(neu_pct / total * 100)
            neg_pct = 100 - pos_pct - neu_pct

        ax2.pie([pos_pct, neu_pct, neg_pct],
                colors=[C_GREEN, C_AMBER, C_RED],
                startangle=90,
                wedgeprops=dict(width=0.45, edgecolor=C_CARD, linewidth=2))
        ax2.text(0,  0.1,  f'{pos_pct}%', ha='center', color=C_TEXT,  fontsize=14, fontweight='bold')
        ax2.text(0, -0.25, 'Positive',    ha='center', color=C_GREEN, fontsize=9,  fontweight='bold')
        ax2.text(0, -0.5,  'Sentiment',   ha='center', color=C_GRAY,  fontsize=7)
        ax2.set_facecolor(C_CARD)
        ax2.set_title('Market Sentiment', color=C_TEXT, fontsize=8, pad=6)

        buf = BytesIO()
        fig.savefig(buf, format='png', dpi=150, facecolor=C_CARD, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        return buf

    # ══════════════════════════════════════════════════════════════════════════
    # CHART 4 — Risk radar chart
    # ══════════════════════════════════════════════════════════════════════════
    def make_risk_chart():
        fig, ax = plt.subplots(figsize=(3.5, 3.5),
                               subplot_kw=dict(polar=True),
                               facecolor=C_CARD)
        fig.subplots_adjust(left=0.05, right=0.95, top=0.88, bottom=0.05)

        categories = ['Market\nRisk', 'Debt\nRisk', 'Earnings\nRisk', 'Sentiment\nRisk', 'Technical\nRisk']
        beta       = m.get('beta', 1)
        de_ratio   = (m.get('pe_ratio', 20) or 20)
        fin        = cached.get('financials_raw', {})
        earn_risk  = abs(fin.get('earnings_growth', 0) or 0) * 100
        rsi_v      = ind.get('rsi', 50)
        sent_text  = agents.get('sentiment', '')
        import re
        neg_m      = re.search(r'[Nn]egative[:\s]+(\d+)%', sent_text)
        neg_pct    = int(neg_m.group(1)) if neg_m else 30

        scores = [
            min(beta * 40, 90),
            min((fin.get('debt_to_equity', 0) or 0) / 50 * 90, 90),
            min(earn_risk * 5, 90),
            min(neg_pct, 90),
            min(abs(rsi_v - 50) * 1.8, 90),
        ]
        N      = len(categories)
        angles = [n / N * 2 * np.pi for n in range(N)]
        angles += angles[:1]
        scores_plot = scores + scores[:1]

        ax.set_facecolor(C_CARD)
        ax.plot(angles, scores_plot, color=verdict_color, linewidth=2, zorder=3)
        ax.fill(angles, scores_plot, color=verdict_color, alpha=0.25, zorder=2)

        # Grid circles
        for r in [25, 50, 75]:
            ax.plot(angles, [r]*len(angles), color=C_BORDER, linewidth=0.5, linestyle='--', alpha=0.5)
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(categories, color=C_GRAY, fontsize=7)
        ax.set_yticks([])
        ax.spines['polar'].set_color(C_BORDER)
        ax.set_title('Risk Radar', color=C_TEXT, fontsize=9, fontweight='bold', pad=12)

        buf = BytesIO()
        fig.savefig(buf, format='png', dpi=150, facecolor=C_CARD, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        return buf

    # ══════════════════════════════════════════════════════════════════════════
    # BUILD PDF
    # ══════════════════════════════════════════════════════════════════════════
    pdf_buf = BytesIO()
    doc = SimpleDocTemplate(
        pdf_buf, pagesize=A4,
        leftMargin=16*mm, rightMargin=16*mm,
        topMargin=16*mm, bottomMargin=16*mm,
        title=f"Bharat Equity Agent — {ticker}",
    )

    RL_GREEN  = hex_to_rl(C_GREEN)
    RL_RED    = hex_to_rl(C_RED)
    RL_AMBER  = hex_to_rl(C_AMBER)
    RL_BG     = hex_to_rl(C_BG)
    RL_CARD   = hex_to_rl(C_CARD)
    RL_BORDER = hex_to_rl(C_BORDER)
    RL_TEXT   = hex_to_rl(C_TEXT)
    RL_GRAY   = hex_to_rl(C_GRAY)
    RL_VCOLOR = hex_to_rl(verdict_color)

    def ps(name, **kw):
        defaults = dict(fontName='Helvetica', fontSize=9, textColor=RL_GRAY, spaceAfter=3, leading=13)
        defaults.update(kw)
        return ParagraphStyle(name, **defaults)

    story = []
    W = 178*mm   # usable page width

    # ── PAGE 1: Cover + key metrics + charts ─────────────────────────────────

    # Header bar
    story.append(Table(
        [[Paragraph('BHARAT EQUITY AGENT', ps('logo', fontSize=14, textColor=RL_GREEN, fontName='Helvetica-Bold')),
          Paragraph(f'AI Investment Research · {datetime.now().strftime("%d %b %Y")}',
                    ps('date', fontSize=9, textColor=RL_GRAY, alignment=2))]],
        colWidths=[W*0.6, W*0.4],
        style=TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), RL_CARD),
            ('TOPPADDING',    (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('RIGHTPADDING',  (0,0), (-1,-1), 10),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ])
    ))
    story.append(HRFlowable(width=W, thickness=1, color=RL_GREEN))
    story.append(Spacer(1, 4*mm))

    # Stock name + exchange
    story.append(Paragraph(m.get('name', ticker),
        ps('name', fontSize=20, textColor=RL_TEXT, fontName='Helvetica-Bold', spaceAfter=2)))
    story.append(Paragraph(
        f"{ticker}  ·  {m.get('exchange','')}  ·  {m.get('sector','')}  ·  {m.get('industry','')}",
        ps('sub', fontSize=9, textColor=RL_GRAY, spaceAfter=6)))

    story.append(HRFlowable(width=W, thickness=0.5, color=RL_BORDER))
    story.append(Spacer(1, 3*mm))

    # Verdict + price targets row
    verdict_row = [[
        Paragraph(f'<b>{verdict}</b>',
            ps('vv', fontSize=32, textColor=RL_VCOLOR, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<b>{confidence}%</b><br/><font size=8 color="{C_GRAY}">Confidence</font>',
            ps('vc', fontSize=18, textColor=RL_VCOLOR, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=22)),
        Paragraph(f'<b>₹{synth.get("price_target","—")}</b><br/><font size=8 color="{C_GRAY}">Price Target</font>',
            ps('pt', fontSize=14, textColor=RL_TEXT, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=18)),
        Paragraph(f'<b>₹{synth.get("stop_loss","—")}</b><br/><font size=8 color="{C_GRAY}">Stop Loss</font>',
            ps('sl', fontSize=14, textColor=RL_VCOLOR, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=18)),
        Paragraph(f'<b>₹{m.get("current_price","—")}</b><br/><font size=8 color="{C_GRAY}">Current Price</font>',
            ps('cp', fontSize=14, textColor=RL_TEXT, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=18)),
    ]]
    story.append(Table(verdict_row,
        colWidths=[W*0.18, W*0.18, W*0.22, W*0.22, W*0.20],
        style=TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), RL_CARD),
            ('GRID',          (0,0), (-1,-1), 0.5, RL_BORDER),
            ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING',    (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('BACKGROUND',    (0,0), (0,0), hex_to_rl(verdict_color + '25')),
        ])
    ))
    story.append(Spacer(1, 4*mm))

    # Key metrics table
    story.append(Paragraph('KEY METRICS',
        ps('sec', fontSize=10, textColor=RL_GREEN, fontName='Helvetica-Bold', spaceAfter=4)))
    market_cap_cr = int((m.get('market_cap') or 0) / 1e7)
    metrics = [
        ['Current Price', f"₹{m.get('current_price','—')}",
         'P/E Ratio',    str(round(m.get('pe_ratio') or 0, 2)),
         '52W High',    f"₹{m.get('week_52_high','—')}",
         'Beta',         str(m.get('beta','—'))],
        ['Previous Close', f"₹{m.get('previous_close','—')}",
         'EPS (TTM)',   f"₹{m.get('eps','—')}",
         '52W Low',     f"₹{m.get('week_52_low','—')}",
         'Div Yield',    f"{round((m.get('dividend_yield') or 0)*100, 2)}%"],
        ['Market Cap',   f"₹{market_cap_cr:,} Cr",
         'Day High',    f"₹{m.get('day_high','—')}",
         'Day Low',     f"₹{m.get('day_low','—')}",
         'Volume',       f"{(m.get('volume') or 0):,}"],
    ]
    col_w = W / 8
    met_style = TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), RL_CARD),
        ('GRID',          (0,0), (-1,-1), 0.5, RL_BORDER),
        ('FONTNAME',      (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE',      (0,0), (-1,-1), 8),
        ('TEXTCOLOR',     (0,0), (-1,-1), RL_GRAY),
        ('TEXTCOLOR',     (1,0), (1,-1), RL_TEXT),
        ('TEXTCOLOR',     (3,0), (3,-1), RL_TEXT),
        ('TEXTCOLOR',     (5,0), (5,-1), RL_TEXT),
        ('TEXTCOLOR',     (7,0), (7,-1), RL_TEXT),
        ('FONTNAME',      (1,0), (1,-1), 'Helvetica-Bold'),
        ('FONTNAME',      (3,0), (3,-1), 'Helvetica-Bold'),
        ('FONTNAME',      (5,0), (5,-1), 'Helvetica-Bold'),
        ('FONTNAME',      (7,0), (7,-1), 'Helvetica-Bold'),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING',   (0,0), (-1,-1), 8),
    ])
    story.append(Table(metrics, colWidths=[col_w]*8, style=met_style))
    story.append(Spacer(1, 5*mm))

    # Investment summary
    story.append(Paragraph('INVESTMENT SUMMARY',
        ps('sec2', fontSize=10, textColor=RL_GREEN, fontName='Helvetica-Bold', spaceAfter=4)))
    story.append(Paragraph(synth.get('summary',''), ps('body', fontSize=9, textColor=RL_GRAY, leading=14)))
    story.append(Spacer(1, 2*mm))

    # Bull / Bear case side by side
    bc_data = [[
        Paragraph(f'<font color="{C_GREEN}"><b>▲ BULL CASE</b></font><br/>{synth.get("bull_case","")}',
            ps('bull', fontSize=8, textColor=RL_GRAY, leading=13)),
        Paragraph(f'<font color="{C_RED}"><b>▼ BEAR CASE</b></font><br/>{synth.get("bear_case","")}',
            ps('bear', fontSize=8, textColor=RL_GRAY, leading=13)),
    ]]
    story.append(Table(bc_data, colWidths=[W*0.5-3, W*0.5-3],
        style=TableStyle([
            ('BACKGROUND',    (0,0), (0,0), hex_to_rl(C_GREEN + '15')),
            ('BACKGROUND',    (1,0), (1,0), hex_to_rl(C_RED   + '15')),
            ('GRID',          (0,0), (-1,-1), 0.5, RL_BORDER),
            ('TOPPADDING',    (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ])
    ))
    story.append(Spacer(1, 5*mm))

    # ── Price chart ──
    story.append(Paragraph('PRICE HISTORY & VOLUME',
        ps('sec3', fontSize=10, textColor=RL_GREEN, fontName='Helvetica-Bold', spaceAfter=4)))
    price_chart_buf = make_price_chart()
    if price_chart_buf:
        story.append(RLImage(price_chart_buf, width=W, height=W*0.43))
    story.append(Spacer(1, 5*mm))

    # ── Technical + confidence side by side ──
    story.append(Paragraph('TECHNICAL ANALYSIS & CONFIDENCE',
        ps('sec4', fontSize=10, textColor=RL_GREEN, fontName='Helvetica-Bold', spaceAfter=4)))

    tech_buf  = make_technical_chart()
    conf_buf  = make_confidence_chart()
    risk_buf  = make_risk_chart()

    chart_row = []
    if tech_buf:
        chart_row.append(RLImage(tech_buf, width=W*0.62, height=W*0.28))
    if conf_buf:
        chart_row.append(RLImage(conf_buf, width=W*0.36, height=W*0.28))

    if chart_row:
        story.append(Table([chart_row],
            colWidths=[W*0.62, W*0.36] if len(chart_row)==2 else [W],
            style=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)])
        ))
    story.append(Spacer(1, 5*mm))

    # Technical indicators table + risk radar side by side
    tech_ind_data = [
        ['Indicator', 'Value', 'Signal'],
        ['RSI (14)',       str(round(ind.get('rsi',0),2)),         ind.get('rsi_signal','')],
        ['MACD',          str(round(ind.get('macd',0),2)),         ind.get('macd_label','')],
        ['SMA 50',        f"₹{round(ind.get('sma_50',0),2)}",     ind.get('sma50_signal','')],
        ['SMA 200',       f"₹{round(ind.get('sma_200',0),2)}",    ind.get('sma200_signal','')],
        ['Support',       f"₹{round(ind.get('support',0),2)}",    'Key level'],
        ['Resistance',    f"₹{round(ind.get('resistance',0),2)}", 'Key level'],
        ['Bollinger Mid', f"₹{round(ind.get('bollinger_mid',0),2)}", 'Mid band'],
    ]

    def signal_color(s):
        s = (s or '').lower()
        if any(w in s for w in ['bull','above','uptrend','oversold']): return C_GREEN
        if any(w in s for w in ['bear','below','downtrend','overbought']): return C_RED
        return C_AMBER

    tech_table_style = [
        ('BACKGROUND',    (0,0), (-1,0), RL_CARD),
        ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
        ('TEXTCOLOR',     (0,0), (-1,0), RL_GREEN),
        ('FONTSIZE',      (0,0), (-1,-1), 8),
        ('GRID',          (0,0), (-1,-1), 0.4, RL_BORDER),
        ('BACKGROUND',    (0,1), (-1,-1), RL_CARD),
        ('TEXTCOLOR',     (0,1), (1,-1), RL_GRAY),
        ('TOPPADDING',    (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
    ]
    for i, row in enumerate(tech_ind_data[1:], 1):
        col = hex_to_rl(signal_color(row[2]))
        tech_table_style.append(('TEXTCOLOR', (2,i), (2,i), col))

    tech_tbl = Table(tech_ind_data,
        colWidths=[W*0.33*0.4, W*0.33*0.35, W*0.33*0.25],
        style=TableStyle(tech_table_style))

    if risk_buf:
        risk_img = RLImage(risk_buf, width=W*0.35, height=W*0.35)
        story.append(Table([[tech_tbl, risk_img]],
            colWidths=[W*0.55, W*0.43],
            style=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4)])
        ))
    else:
        story.append(tech_tbl)

    story.append(Spacer(1, 5*mm))

    # ── Agent reports ──
    story.append(Paragraph('AGENT RESEARCH REPORTS',
        ps('sec5', fontSize=10, textColor=RL_GREEN, fontName='Helvetica-Bold', spaceAfter=4)))

    agent_sections = [
        ('Market Data Specialist',  agents.get('market_data',  '')),
        ('News Sentinel',           agents.get('news',         '')),
        ('Sentiment Oracle',        agents.get('sentiment',    '')),
        ('Fundamentals Analyst',    agents.get('fundamentals', '')),
        ('Technical Chartist',      agents.get('technical',   '')),
        ('Risk Assessor',           agents.get('risk',        '')),
    ]
    for agent_name, content in agent_sections:
        if not content:
            continue
        story.append(Table(
            [[Paragraph(f'<b>{agent_name}</b>', ps('an', fontSize=8, textColor=RL_GREEN, fontName='Helvetica-Bold')),
              Paragraph(content[:500], ps('ac', fontSize=8, textColor=RL_GRAY, leading=13))]],
            colWidths=[W*0.22, W*0.76],
            style=TableStyle([
                ('BACKGROUND',    (0,0), (-1,-1), RL_CARD),
                ('GRID',          (0,0), (-1,-1), 0.4, RL_BORDER),
                ('VALIGN',        (0,0), (-1,-1), 'TOP'),
                ('TOPPADDING',    (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING',   (0,0), (-1,-1), 8),
            ])
        ))
        story.append(Spacer(1, 1.5*mm))

    story.append(Spacer(1, 4*mm))

    # ── Critic review ──
    story.append(Paragraph('CRITIC REVIEW — REFLEXION LOOP',
        ps('sec6', fontSize=10, textColor=RL_GREEN, fontName='Helvetica-Bold', spaceAfter=4)))
    critic_status = 'VERDICT UPHELD ✓' if critic.get('verdict_stands') else 'VERDICT CHALLENGED ⚠'
    critic_col    = hex_to_rl(C_GREEN if critic.get('verdict_stands') else C_AMBER)
    story.append(Table(
        [[Paragraph(f'<b>{critic_status}</b>',
            ps('cs', fontSize=9, textColor=critic_col, fontName='Helvetica-Bold')),
          Paragraph(f'Revised confidence: <b>{confidence}%</b>',
            ps('cc', fontSize=9, textColor=RL_TEXT, fontName='Helvetica-Bold', alignment=2))]],
        colWidths=[W*0.6, W*0.38],
        style=TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), hex_to_rl(C_GREEN+'15' if critic.get('verdict_stands') else C_AMBER+'15')),
            ('GRID',          (0,0), (-1,-1), 0.5, RL_BORDER),
            ('TOPPADDING',    (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ])
    ))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        critic.get('challenge','') or critic.get('critic_note',''),
        ps('crit', fontSize=9, textColor=RL_GRAY, leading=14)))

    story.append(Spacer(1, 6*mm))

    # ── Footer ──
    story.append(HRFlowable(width=W, thickness=0.5, color=RL_BORDER))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        f'Generated by Bharat Equity Agent  ·  {datetime.now().strftime("%d %b %Y %H:%M")} IST  ·  '
        f'Powered by CrewAI + LangGraph + Groq Llama 3.3 70B + MCP Servers',
        ps('foot', fontSize=7, textColor=RL_GRAY, alignment=TA_CENTER)))
    story.append(Paragraph(
        'DISCLAIMER: This report is AI-generated for educational and research purposes only. '
        'Not financial advice. Always consult a SEBI-registered advisor before investing.',
        ps('disc', fontSize=7, textColor=hex_to_rl(C_BORDER), alignment=TA_CENTER)))

    doc.build(story)
    pdf_buf.seek(0)

    return StreamingResponse(
        pdf_buf,
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename=bharat-equity-{ticker}-report.pdf'}
    )