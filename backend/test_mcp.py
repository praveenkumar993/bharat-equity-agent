import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

print("=" * 50)
print("Testing yfinance MCP server...")
from mcp_servers.yfinance_server import get_stock_data, get_price_history
data = get_stock_data("RELIANCE.NS")
print(f"Stock: {data['name']}")
print(f"Price: {data['current_price']}")
print(f"P/E: {data['pe_ratio']}")
history = get_price_history("RELIANCE.NS", "1mo")
print(f"History rows: {len(history)} days")

print("=" * 50)
print("Testing technical MCP server...")
from mcp_servers.technical_server import get_technical_indicators
tech = get_technical_indicators("RELIANCE.NS")
print(f"RSI: {tech['rsi']} — {tech['rsi_signal']}")
print(f"MACD: {tech['macd']} — {tech['macd_label']}")
print(f"SMA 50: {tech['sma_50']}")
print(f"SMA 200: {tech['sma_200']}")
print(f"Support: {tech['support']} | Resistance: {tech['resistance']}")

print("=" * 50)
print("Testing Tavily news MCP server...")
from mcp_servers.tavily_server import search_stock_news
news = search_stock_news("RELIANCE.NS", "Reliance Industries", max_results=3)
for article in news:
    print(f"- {article['title'][:70]}...")

print("=" * 50)
print("ALL MCP SERVERS WORKING")