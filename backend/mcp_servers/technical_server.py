import yfinance as yf
import ta
import pandas as pd
from fastmcp import FastMCP

mcp = FastMCP("technical-server")

@mcp.tool()
def get_technical_indicators(ticker: str) -> dict:
    """Calculate RSI, MACD, Bollinger Bands, SMA 50, SMA 200 for a ticker."""
    t = yf.Ticker(ticker)
    hist = t.history(period="1y")

    if hist.empty:
        return {"error": f"No data found for {ticker}"}

    close = hist["Close"]

    rsi = ta.momentum.RSIIndicator(close=close, window=14)
    macd = ta.trend.MACD(close=close)
    bb = ta.volatility.BollingerBands(close=close)
    sma50 = ta.trend.SMAIndicator(close=close, window=50)
    sma200 = ta.trend.SMAIndicator(close=close, window=200)

    current_price = round(float(close.iloc[-1]), 2)
    rsi_val = round(float(rsi.rsi().iloc[-1]), 2)
    macd_val = round(float(macd.macd().iloc[-1]), 2)
    macd_signal = round(float(macd.macd_signal().iloc[-1]), 2)
    bb_upper = round(float(bb.bollinger_hband().iloc[-1]), 2)
    bb_lower = round(float(bb.bollinger_lband().iloc[-1]), 2)
    bb_mid = round(float(bb.bollinger_mavg().iloc[-1]), 2)
    sma50_val = round(float(sma50.sma_indicator().iloc[-1]), 2)
    sma200_val = round(float(sma200.sma_indicator().iloc[-1]), 2)

    rsi_signal = "Overbought" if rsi_val > 70 else "Oversold" if rsi_val < 30 else "Neutral"
    macd_signal_label = "Bullish" if macd_val > macd_signal else "Bearish"
    sma50_signal = "Price above SMA50" if current_price > sma50_val else "Price below SMA50"
    sma200_signal = "Strong uptrend" if current_price > sma200_val else "Downtrend"

    support = round(float(close.rolling(window=20).min().iloc[-1]), 2)
    resistance = round(float(close.rolling(window=20).max().iloc[-1]), 2)

    return {
        "current_price": current_price,
        "rsi": rsi_val,
        "rsi_signal": rsi_signal,
        "macd": macd_val,
        "macd_signal_line": macd_signal,
        "macd_label": macd_signal_label,
        "bollinger_upper": bb_upper,
        "bollinger_lower": bb_lower,
        "bollinger_mid": bb_mid,
        "sma_50": sma50_val,
        "sma_200": sma200_val,
        "sma50_signal": sma50_signal,
        "sma200_signal": sma200_signal,
        "support": support,
        "resistance": resistance,
    }

if __name__ == "__main__":
    mcp.run()