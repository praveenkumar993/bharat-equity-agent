import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crewai import Crew, Process
from dotenv import load_dotenv

load_dotenv()

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGSMITH_PROJECT", "bharat-equity-agent")
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGSMITH_API_KEY", "")

from agents.research_agents import (
    create_market_data_agent,
    create_news_agent,
    create_sentiment_agent,
    create_fundamentals_agent,
    create_technical_agent,
    create_risk_agent,
)
from agents.research_tasks import (
    create_market_data_task,
    create_news_task,
    create_sentiment_task,
    create_fundamentals_task,
    create_technical_task,
    create_risk_task,
)
from mcp_servers.yfinance_server import get_stock_data, get_financials
from mcp_servers.tavily_server import search_stock_news, search_market_sentiment
from mcp_servers.technical_server import get_technical_indicators


def run_research_crew(ticker: str) -> dict:
    print(f"\n{'='*60}")
    print(f" BHARAT EQUITY AGENT — Fetching data for {ticker}...")
    print(f"{'='*60}\n")

    # Pre-fetch ALL data before CrewAI runs — no tool calls inside agents
    print(" Fetching market data...")
    market_data = get_stock_data(ticker)

    print(" Fetching financials...")
    financials = get_financials(ticker)

    print(" Fetching technical indicators...")
    indicators = get_technical_indicators(ticker)

    print(" Fetching news...")
    company = ticker.replace(".NS", "").replace(".BO", "")
    news = search_stock_news(ticker, company, max_results=4)

    print(" Fetching sentiment data...")
    sentiment_data = search_market_sentiment(f"{company} stock sentiment 2026")

    print("\n All data fetched. Starting 6 CrewAI agents...\n")

    # Create agents
    market_agent = create_market_data_agent()
    news_agent = create_news_agent()
    sentiment_agent = create_sentiment_agent()
    fundamentals_agent = create_fundamentals_agent()
    technical_agent = create_technical_agent()
    risk_agent = create_risk_agent()

    # Create tasks with pre-fetched data embedded
    market_task = create_market_data_task(market_agent, ticker, market_data)
    news_task = create_news_task(news_agent, ticker, news)
    sentiment_task = create_sentiment_task(sentiment_agent, ticker, news, sentiment_data)
    fundamentals_task = create_fundamentals_task(fundamentals_agent, ticker, financials, market_data)
    technical_task = create_technical_task(technical_agent, ticker, indicators)
    risk_task = create_risk_task(risk_agent, ticker, market_data, financials, news)

    crew = Crew(
        agents=[
            market_agent,
            news_agent,
            sentiment_agent,
            fundamentals_agent,
            technical_agent,
            risk_agent,
        ],
        tasks=[
            market_task,
            news_task,
            sentiment_task,
            fundamentals_task,
            technical_task,
            risk_task,
        ],
        process=Process.sequential,
        verbose=True,
    )

    result = crew.kickoff()

    return {
        "ticker": ticker,
        "market_data_raw": market_data,
        "financials_raw": financials,
        "indicators_raw": indicators,
        "market_data": str(market_task.output),
        "news": str(news_task.output),
        "sentiment": str(sentiment_task.output),
        "fundamentals": str(fundamentals_task.output),
        "technical": str(technical_task.output),
        "risk": str(risk_task.output),
    }


if __name__ == "__main__":
    ticker = sys.argv[1] if len(sys.argv) > 1 else "RELIANCE.NS"
    results = run_research_crew(ticker)

    print("\n" + "="*60)
    print("ALL 6 AGENTS COMPLETE — RESEARCH REPORT")
    print("="*60)
    for key, value in results.items():
        if key not in ["ticker", "market_data_raw", "financials_raw", "indicators_raw"]:
            print(f"\n{'—'*40}")
            print(f" {key.upper().replace('_', ' ')}")
            print(f"{'—'*40}")
            print(str(value)[:400])