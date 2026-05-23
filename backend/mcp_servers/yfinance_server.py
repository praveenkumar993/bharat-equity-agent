import yfinance as yf
from fastmcp import FastMCP

mcp = FastMCP("yfinance-server")

@mcp.tool()
def get_stock_data(ticker: str) -> dict:
    """Fetch live price, fundamentals and key metrics for a stock ticker."""
    t = yf.Ticker(ticker)
    info = t.info
    return {
        "ticker": ticker,
        "name": info.get("longName", ticker),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
        "previous_close": info.get("previousClose"),
        "day_high": info.get("dayHigh"),
        "day_low": info.get("dayLow"),
        "week_52_high": info.get("fiftyTwoWeekHigh"),
        "week_52_low": info.get("fiftyTwoWeekLow"),
        "volume": info.get("volume"),
        "avg_volume": info.get("averageVolume"),
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        "eps": info.get("trailingEps"),
        "beta": info.get("beta"),
        "dividend_yield": info.get("dividendYield"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "exchange": info.get("exchange"),
    }

@mcp.tool()
def get_price_history(ticker: str, period: str = "6mo") -> list:
    """Fetch OHLCV price history for charting. Period options: 1d 5d 1mo 3mo 6mo 1y."""
    t = yf.Ticker(ticker)
    hist = t.history(period=period)
    hist = hist.reset_index()
    records = []
    for _, row in hist.iterrows():
        records.append({
            "date": str(row["Date"])[:10],
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
        })
    return records

@mcp.tool()
def get_financials(ticker: str) -> dict:
    """Fetch income statement and balance sheet data for fundamentals analysis."""
    t = yf.Ticker(ticker)
    info = t.info
    return {
        "revenue_growth": info.get("revenueGrowth"),
        "earnings_growth": info.get("earningsGrowth"),
        "profit_margins": info.get("profitMargins"),
        "operating_margins": info.get("operatingMargins"),
        "return_on_equity": info.get("returnOnEquity"),
        "debt_to_equity": info.get("debtToEquity"),
        "current_ratio": info.get("currentRatio"),
        "free_cashflow": info.get("freeCashflow"),
        "total_revenue": info.get("totalRevenue"),
        "net_income": info.get("netIncomeToCommon"),
    }

if __name__ == "__main__":
    mcp.run()