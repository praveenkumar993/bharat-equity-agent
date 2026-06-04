import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
load_dotenv()

from mcp_servers.yfinance_server import get_stock_data, get_financials, get_price_history
from mcp_servers.tavily_server import search_stock_news, search_market_sentiment
from mcp_servers.technical_server import get_technical_indicators
from agents.crew_runner import run_research_crew
from agents.synthesis_agents import run_synthesizer, run_critic


class StockState(TypedDict):
    ticker: str
    market_data_raw: Optional[dict]
    financials_raw: Optional[dict]
    indicators_raw: Optional[dict]
    price_history: Optional[list]
    news_raw: Optional[list]
    agent_outputs: Optional[dict]
    synthesis: Optional[dict]
    critic: Optional[dict]
    final_verdict: Optional[str]
    final_confidence: Optional[int]
    loop_count: int
    events: list
    error: Optional[str]


def node_fetch_data(state: StockState) -> StockState:
    ticker = state["ticker"]
    state["events"].append({"agent": "Data Fetcher", "status": "running", "message": f"Fetching live market data for {ticker}..."})

    try:
        state["market_data_raw"] = get_stock_data(ticker)
        state["financials_raw"] = get_financials(ticker)
        state["indicators_raw"] = get_technical_indicators(ticker)
        state["price_history"] = get_price_history(ticker, period="6mo")

        company = ticker.replace(".NS", "").replace(".BO", "")
        state["news_raw"] = search_stock_news(ticker, company, max_results=4)

        state["events"].append({"agent": "Data Fetcher", "status": "done", "message": "All market data fetched successfully."})
    except Exception as e:
        state["error"] = str(e)
        state["events"].append({"agent": "Data Fetcher", "status": "error", "message": str(e)})

    return state


def node_run_agents(state: StockState) -> StockState:
    ticker = state["ticker"]
    state["events"].append({"agent": "CrewAI Orchestrator", "status": "running", "message": "Launching 6 specialist research agents..."})

    try:
        results = run_research_crew(ticker)

        # Safety check — if crew returns None or empty
        if not results:
            raise ValueError("CrewAI crew returned empty results")

        state["agent_outputs"] = {
            "market_data":   results.get("market_data",   "") or "",
            "news":          results.get("news",          "") or "",
            "sentiment":     results.get("sentiment",     "") or "",
            "fundamentals":  results.get("fundamentals",  "") or "",
            "technical":     results.get("technical",     "") or "",
            "risk":          results.get("risk",          "") or "",
        }
        state["events"].append({"agent": "CrewAI Orchestrator", "status": "done", "message": "All 6 agents completed analysis."})

    except Exception as e:
        # Don't crash — provide fallback outputs so Synthesizer can still run
        state["agent_outputs"] = {
            "market_data":  f"Market data for {ticker}: Price ₹{state.get('market_data_raw', {}).get('current_price', 'N/A')}, PE {state.get('market_data_raw', {}).get('pe_ratio', 'N/A')}",
            "news":         "Recent news analysis unavailable due to rate limiting.",
            "sentiment":    "Sentiment score: 0.5, Neutral sentiment based on available data.",
            "fundamentals": f"Fundamentals: Revenue growth {state.get('financials_raw', {}).get('revenue_growth', 'N/A')}, Debt/Equity {state.get('financials_raw', {}).get('debt_to_equity', 'N/A')}",
            "technical":    f"Technical: RSI {state.get('indicators_raw', {}).get('rsi', 'N/A')}, MACD {state.get('indicators_raw', {}).get('macd_label', 'N/A')}, SMA50 signal: {state.get('indicators_raw', {}).get('sma50_signal', 'N/A')}",
            "risk":         f"Risk: Beta {state.get('market_data_raw', {}).get('beta', 'N/A')}, Debt/Equity {state.get('financials_raw', {}).get('debt_to_equity', 'N/A')}",
        }
        state["events"].append({"agent": "CrewAI Orchestrator", "status": "warning", "message": f"Agents used fallback mode: {str(e)[:100]}"})

    return state


def node_synthesize(state: StockState) -> StockState:
    ticker = state["ticker"]
    state["events"].append({"agent": "Synthesizer", "status": "running", "message": "Synthesizing all research into investment verdict..."})

    try:
        agent_outputs = state.get("agent_outputs") or {}
        market_data   = state.get("market_data_raw") or {}

        if not agent_outputs:
            agent_outputs = {
                "market_data":  str(market_data),
                "news":         "No news data available.",
                "sentiment":    "Sentiment: Neutral, score 0.5",
                "fundamentals": str(state.get("financials_raw") or {}),
                "technical":    str(state.get("indicators_raw") or {}),
                "risk":         "Risk assessment unavailable.",
            }

        synthesis = run_synthesizer(ticker, agent_outputs, market_data=market_data)
        state["synthesis"]        = synthesis
        state["final_verdict"]    = synthesis.get("verdict", "HOLD")
        state["final_confidence"] = synthesis.get("confidence", 60)
        state["events"].append({
            "agent":   "Synthesizer",
            "status":  "done",
            "message": f"Verdict: {synthesis.get('verdict','HOLD')} with {synthesis.get('confidence',60)}% confidence."
        })

    except Exception as e:
        state["synthesis"] = {
            "verdict":      "HOLD",
            "confidence":   50,
            "price_target": None,
            "stop_loss":    None,
            "summary":      f"Analysis incomplete due to: {str(e)[:200]}",
            "bull_case":    "Insufficient data for bull case.",
            "bear_case":    "Insufficient data for bear case.",
            "raw":          "",
        }
        state["final_verdict"]    = "HOLD"
        state["final_confidence"] = 50
        state["events"].append({"agent": "Synthesizer", "status": "error", "message": str(e)[:150]})

    return state

def node_critic(state: StockState) -> StockState:
    ticker     = state["ticker"]
    state["loop_count"] = state.get("loop_count", 0) + 1
    state["events"].append({"agent": "Critic", "status": "running", "message": f"Challenging verdict (loop {state['loop_count']})..."})

    try:
        synthesis     = state.get("synthesis") or {}
        agent_outputs = state.get("agent_outputs") or {}

        if not synthesis.get("verdict"):
            synthesis["verdict"]    = "HOLD"
            synthesis["confidence"] = 50

        critic = run_critic(ticker, synthesis, agent_outputs)
        state["critic"] = critic

        if critic.get("verdict_stands"):
            state["events"].append({
                "agent":   "Critic",
                "status":  "done",
                "message": f"Verdict upheld. {critic.get('critic_note','')}"
            })
        else:
            state["final_confidence"] = critic.get("revised_confidence", state["final_confidence"])
            state["events"].append({
                "agent":   "Critic",
                "status":  "warning",
                "message": f"Verdict challenged. Revised confidence: {critic.get('revised_confidence')}%."
            })

    except Exception as e:
        state["critic"] = {
            "verdict_stands":    True,
            "challenge":         "",
            "revised_confidence": state.get("final_confidence", 50),
            "critic_note":       f"Critic skipped: {str(e)[:100]}",
            "raw":               "",
        }
        state["events"].append({"agent": "Critic", "status": "warning", "message": f"Critic used fallback: {str(e)[:100]}"})

    return state


def route_after_critic(state: StockState) -> str:
    critic = state.get("critic") or {}

    if state.get("loop_count", 0) >= 2:
        return END

    if critic.get("verdict_stands", True):
        return END

    return "synthesize"

def build_graph():
    builder = StateGraph(StockState)

    builder.add_node("fetch_data", node_fetch_data)
    builder.add_node("run_agents", node_run_agents)
    builder.add_node("synthesize", node_synthesize)
    builder.add_node("critic", node_critic)

    builder.set_entry_point("fetch_data")
    builder.add_edge("fetch_data", "run_agents")
    builder.add_edge("run_agents", "synthesize")
    builder.add_edge("synthesize", "critic")
    builder.add_conditional_edges("critic", route_after_critic)

    return builder.compile()