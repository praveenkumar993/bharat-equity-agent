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


