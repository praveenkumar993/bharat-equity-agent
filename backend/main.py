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
    Chatbot endpoint — answers questions using cached analysis context.
    No new API calls needed for follow-up questions.
    """
    from agents.synthesis_agents import call_groq

    cached = session_store.get(request.ticker)

    if cached:
        context = f"""
Ticker: {request.ticker}
Verdict: {cached.get('final_verdict')} with {cached.get('final_confidence')}% confidence

Market Data: {cached.get('market_data_raw', {})}
Indicators: {cached.get('indicators_raw', {})}

Agent Analysis Summary:
Market: {cached.get('agent_outputs', {}).get('market_data', '')[:300]}
Sentiment: {cached.get('agent_outputs', {}).get('sentiment', '')[:200]}
Fundamentals: {cached.get('agent_outputs', {}).get('fundamentals', '')[:300]}
Technical: {cached.get('agent_outputs', {}).get('technical', '')[:200]}
Risk: {cached.get('agent_outputs', {}).get('risk', '')[:200]}

Synthesis: {cached.get('synthesis', {}).get('summary', '')}
Critic Note: {cached.get('critic', {}).get('critic_note', '')}
"""
    else:
        context = f"Stock ticker: {request.ticker}. No cached analysis available yet."

    system = """You are a helpful stock research assistant for Indian and US markets.
    Answer questions about the stock based on the analysis context provided.
    Be concise, specific, and use actual numbers from the context.
    If asked about price targets, stop loss, or risks — use the exact data from context.
    Max 150 words per answer."""

    user = f"Context:\n{context}\n\nQuestion: {request.question}"

    try:
        answer = call_groq(system, user)
        return {"success": True, "answer": answer, "ticker": request.ticker}
    except Exception as e:
        return {"success": False, "error": str(e)}