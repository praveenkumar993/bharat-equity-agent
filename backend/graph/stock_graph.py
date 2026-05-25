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
        state["agent_outputs"] = {
            "market_data": results.get("market_data", ""),
            "news": results.get("news", ""),
            "sentiment": results.get("sentiment", ""),
            "fundamentals": results.get("fundamentals", ""),
            "technical": results.get("technical", ""),
            "risk": results.get("risk", ""),
        }
        state["events"].append({"agent": "CrewAI Orchestrator", "status": "done", "message": "All 6 agents completed analysis."})
    except Exception as e:
        state["error"] = str(e)
        state["events"].append({"agent": "CrewAI Orchestrator", "status": "error", "message": str(e)})

    return state


def node_synthesize(state: StockState) -> StockState:
    ticker = state["ticker"]
    state["events"].append({"agent": "Synthesizer", "status": "running", "message": "Synthesizing all research into investment verdict..."})

    try:
        synthesis = run_synthesizer(
            ticker,
            state["agent_outputs"],
            market_data=state.get("market_data_raw", {})  # pass real price data
        )
        state["synthesis"] = synthesis
        state["final_verdict"] = synthesis["verdict"]
        state["final_confidence"] = synthesis["confidence"]
        state["events"].append({
            "agent": "Synthesizer",
            "status": "done",
            "message": f"Verdict: {synthesis['verdict']} with {synthesis['confidence']}% confidence."
        })
    except Exception as e:
        state["error"] = str(e)
        state["events"].append({"agent": "Synthesizer", "status": "error", "message": str(e)})

    return state


def node_critic(state: StockState) -> StockState:
    ticker = state["ticker"]
    state["loop_count"] = state.get("loop_count", 0) + 1
    state["events"].append({"agent": "Critic", "status": "running", "message": f"Challenging verdict (loop {state['loop_count']})..."})

    try:
        critic = run_critic(ticker, state["synthesis"], state["agent_outputs"])
        state["critic"] = critic

        if critic["verdict_stands"]:
            state["events"].append({
                "agent": "Critic",
                "status": "done",
                "message": f"Verdict upheld. {critic.get('critic_note', '')}"
            })
        else:
            state["final_confidence"] = critic["revised_confidence"]
            state["events"].append({
                "agent": "Critic",
                "status": "warning",
                "message": f"Verdict challenged. Revised confidence: {critic['revised_confidence']}%. {critic.get('challenge', '')}"
            })
    except Exception as e:
        state["error"] = str(e)
        state["events"].append({"agent": "Critic", "status": "error", "message": str(e)})

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