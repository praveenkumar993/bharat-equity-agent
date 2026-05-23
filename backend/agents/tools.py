import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crewai.tools import tool
from mcp_servers.yfinance_server import get_stock_data, get_price_history, get_financials
from mcp_servers.tavily_server import search_stock_news, search_market_sentiment
from mcp_servers.technical_server import get_technical_indicators


@tool("Get Stock Market Data")
def market_data_tool(ticker: str) -> str:
    """Fetches live price, volume, P/E, EPS, market cap, 52W high/low for a stock ticker."""
    data = get_stock_data(ticker)
    return str(data)


@tool("Get Price History")
def price_history_tool(ticker: str) -> str:
    """Fetches historical OHLCV price data for a stock ticker over 6 months."""
    data = get_price_history(ticker, period="6mo")
    return str(data[-10:])


@tool("Get Financial Statements")
def financials_tool(ticker: str) -> str:
    """Fetches revenue growth, profit margins, ROE, debt/equity, free cashflow."""
    data = get_financials(ticker)
    return str(data)


@tool("Get Technical Indicators")
def technical_tool(ticker: str) -> str:
    """Calculates RSI, MACD, Bollinger Bands, SMA 50, SMA 200, support and resistance."""
    data = get_technical_indicators(ticker)
    return str(data)


@tool("Search Stock News")
def news_tool(ticker: str) -> str:
    """Searches for the latest financial news articles about a stock."""
    company = ticker.replace(".NS", "").replace(".BO", "")
    data = search_stock_news(ticker, company, max_results=6)
    return str(data)


@tool("Search Market Sentiment")
def sentiment_search_tool(query: str) -> str:
    """Searches for broader market sentiment and analyst opinions."""
    data = search_market_sentiment(query)
    return str(data)