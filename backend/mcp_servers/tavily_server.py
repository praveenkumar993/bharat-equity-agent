import os
from tavily import TavilyClient
from fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv()

mcp = FastMCP("tavily-server")
client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@mcp.tool()
def search_stock_news(ticker: str, company_name: str, max_results: int = 6) -> list:
    """Search for latest financial news about a stock."""
    query = f"{company_name} {ticker} stock news financial results 2026"
    results = client.search(query, max_results=max_results, search_depth="advanced")
    articles = []
    for r in results.get("results", []):
        articles.append({
            "title": r.get("title"),
            "url": r.get("url"),
            "source": r.get("url", "").split("/")[2] if r.get("url") else "unknown",
            "content": r.get("content", "")[:300],
            "published_date": r.get("published_date", ""),
        })
    return articles

@mcp.tool()
def search_market_sentiment(query: str) -> dict:
    """Search for broader market sentiment on a topic."""
    results = client.search(query, max_results=4, search_depth="basic")
    return {
        "query": query,
        "results": [
            {"title": r.get("title"), "content": r.get("content", "")[:200]}
            for r in results.get("results", [])
        ]
    }

if __name__ == "__main__":
    mcp.run()