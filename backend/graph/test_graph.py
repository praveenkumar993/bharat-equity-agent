import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from graph.stock_graph import build_graph

def test_full_pipeline(ticker: str = "RELIANCE.NS"):
    print(f"\n{'='*60}")
    print(f" FULL LANGGRAPH PIPELINE — {ticker}")
    print(f"{'='*60}\n")

    graph = build_graph()

    initial_state = {
        "ticker": ticker,
        "market_data_raw": None,
        "financials_raw": None,
        "indicators_raw": None,
        "price_history": None,
        "news_raw": None,
        "agent_outputs": {},
        "synthesis": {},
        "critic": {},
        "final_verdict": None,
        "final_confidence": None,
        "loop_count": 0,
        "events": [],
        "error": None,
    }

    result = graph.invoke(initial_state)

    print("\n" + "="*60)
    print(" PIPELINE COMPLETE — FINAL RESULTS")
    print("="*60)

    print(f"\n VERDICT: {result['final_verdict']}")
    print(f" CONFIDENCE: {result['final_confidence']}%")

    synthesis = result.get("synthesis", {})
    print(f" PRICE TARGET: {synthesis.get('price_target')}")
    print(f" STOP LOSS: {synthesis.get('stop_loss')}")
    print(f"\n SUMMARY: {synthesis.get('summary')}")
    print(f" BULL CASE: {synthesis.get('bull_case')}")
    print(f" BEAR CASE: {synthesis.get('bear_case')}")

    critic = result.get("critic", {})
    print(f"\n CRITIC VERDICT STANDS: {critic.get('verdict_stands')}")
    print(f" CRITIC CHALLENGE: {critic.get('challenge')}")
    print(f" CRITIC NOTE: {critic.get('critic_note')}")
    print(f" FINAL CONFIDENCE AFTER CRITIC: {critic.get('revised_confidence')}%")

    print(f"\n{'—'*40}")
    print(" AGENT EVENT LOG")
    print(f"{'—'*40}")
    for event in result.get("events", []):
        status_icon = "✓" if event["status"] == "done" else "⚠" if event["status"] == "warning" else "✗" if event["status"] == "error" else "→"
        print(f" {status_icon} [{event['agent']}] {event['message']}")

    return result


if __name__ == "__main__":
    ticker = sys.argv[1] if len(sys.argv) > 1 else "RELIANCE.NS"
    test_full_pipeline(ticker)