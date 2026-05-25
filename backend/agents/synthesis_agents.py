import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def call_groq(system: str, user: str, model: str = "llama-3.3-70b-versatile") -> str:
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.1,
        max_tokens=800,
    )
    return response.choices[0].message.content


def run_synthesizer(ticker: str, agent_outputs: dict, market_data: dict = None) -> dict:
    """
    Synthesizer Agent — reads all 6 agent outputs and produces
    a structured BUY/HOLD/SELL verdict with confidence score.
    """
    current_price = market_data.get("current_price", 0) if market_data else 0
    week_52_high = market_data.get("week_52_high", 0) if market_data else 0
    week_52_low = market_data.get("week_52_low", 0) if market_data else 0

    system = """You are a senior portfolio manager at a top Mumbai hedge fund.
    You receive research from 6 specialist agents and must synthesize it into
    a final investment verdict. Be decisive, structured, and professional.
    Use ONLY the actual current price provided — never invent prices.
    Price target must be within 10-20% of current price.
    Stop loss must be 5-8% below current price.
    
    Output EXACTLY in this format:
    VERDICT: [BUY or HOLD or SELL]
    CONFIDENCE: [number between 50 and 90]%
    PRICE_TARGET: [realistic target within 15% of current price]
    STOP_LOSS: [5-8% below current price]
    SUMMARY: [2-3 sentences explaining the verdict]
    BULL_CASE: [one sentence — best case scenario]
    BEAR_CASE: [one sentence — worst case scenario]"""

    user = f"""Synthesize this research for {ticker} and give final verdict.

CURRENT PRICE: ₹{current_price}
52-WEEK HIGH: ₹{week_52_high}
52-WEEK LOW: ₹{week_52_low}

MARKET DATA ANALYSIS:
{agent_outputs.get('market_data', '')}

NEWS ANALYSIS:
{agent_outputs.get('news', '')}

SENTIMENT ANALYSIS:
{agent_outputs.get('sentiment', '')}

FUNDAMENTALS ANALYSIS:
{agent_outputs.get('fundamentals', '')}

TECHNICAL ANALYSIS:
{agent_outputs.get('technical', '')}

RISK ASSESSMENT:
{agent_outputs.get('risk', '')}

Remember: Price target must be realistic based on current price of ₹{current_price}."""

    raw = call_groq(system, user)

    # Parse the structured output
    verdict = "HOLD"
    confidence = 60
    price_target = None
    stop_loss = None
    summary = ""
    bull_case = ""
    bear_case = ""

    for line in raw.split("\n"):
        line = line.strip()
        if line.startswith("VERDICT:"):
            v = line.replace("VERDICT:", "").strip()
            if "BUY" in v.upper():
                verdict = "BUY"
            elif "SELL" in v.upper():
                verdict = "SELL"
            else:
                verdict = "HOLD"
        elif line.startswith("CONFIDENCE:"):
            try:
                confidence = int(''.join(filter(str.isdigit, line.split(":")[1])))
                confidence = max(50, min(90, confidence))
            except:
                confidence = 60
        elif line.startswith("PRICE_TARGET:"):
            try:
                price_target = float(''.join(c for c in line.split(":")[1] if c.isdigit() or c == '.'))
            except:
                price_target = round(current_price * 1.12, 2) if current_price else None
        elif line.startswith("STOP_LOSS:"):
            try:
                stop_loss = float(''.join(c for c in line.split(":")[1] if c.isdigit() or c == '.'))
            except:
                stop_loss = round(current_price * 0.93, 2) if current_price else None
        elif line.startswith("SUMMARY:"):
            summary = line.replace("SUMMARY:", "").strip()
        elif line.startswith("BULL_CASE:"):
            bull_case = line.replace("BULL_CASE:", "").strip()
        elif line.startswith("BEAR_CASE:"):
            bear_case = line.replace("BEAR_CASE:", "").strip()

    # Sanity check — if price_target is wildly wrong, fix it
    if price_target and current_price:
        if price_target > current_price * 2 or price_target < current_price * 0.5:
            price_target = round(current_price * 1.12, 2)
    if stop_loss and current_price:
        if stop_loss > current_price or stop_loss < current_price * 0.5:
            stop_loss = round(current_price * 0.93, 2)

    return {
        "verdict": verdict,
        "confidence": confidence,
        "price_target": price_target,
        "stop_loss": stop_loss,
        "summary": summary,
        "bull_case": bull_case,
        "bear_case": bear_case,
        "raw": raw,
    }

def run_critic(ticker: str, synthesis: dict, agent_outputs: dict) -> dict:
    """
    Critic Agent — challenges the Synthesizer's verdict.
    Looks for contradictions, overconfidence, missed risks.
    Returns whether the verdict stands or needs revision.
    """
    system = """You are a devil's advocate risk officer at an investment committee.
    Your job is to challenge the synthesizer's verdict by finding contradictions,
    overconfidence, or missed risks. Be specific and rigorous.
    
    Output EXACTLY in this format:
    VERDICT_STANDS: [YES or NO]
    CHALLENGE: [specific challenge to the verdict in 2 sentences]
    REVISED_CONFIDENCE: [revised confidence number, can be same or lower]%
    CRITIC_NOTE: [one sentence conclusion]"""

    user = f"""Challenge this investment verdict for {ticker}:

SYNTHESIZER VERDICT: {synthesis.get('verdict')} with {synthesis.get('confidence')}% confidence
SYNTHESIZER SUMMARY: {synthesis.get('summary')}

TECHNICAL SIGNAL: {agent_outputs.get('technical', '')[:200]}
RISK ASSESSMENT: {agent_outputs.get('risk', '')[:200]}
SENTIMENT: {agent_outputs.get('sentiment', '')[:150]}

Find the biggest contradiction or risk the synthesizer may have missed."""

    raw = call_groq(system, user)

    verdict_stands = True
    challenge = ""
    revised_confidence = synthesis.get("confidence", 60)
    critic_note = ""

    for line in raw.split("\n"):
        line = line.strip()
        if line.startswith("VERDICT_STANDS:"):
            verdict_stands = "YES" in line.upper()
        elif line.startswith("CHALLENGE:"):
            challenge = line.replace("CHALLENGE:", "").strip()
        elif line.startswith("REVISED_CONFIDENCE:"):
            try:
                revised_confidence = int(''.join(filter(str.isdigit, line.split(":")[1])))
            except:
                revised_confidence = synthesis.get("confidence", 60)
        elif line.startswith("CRITIC_NOTE:"):
            critic_note = line.replace("CRITIC_NOTE:", "").strip()

    return {
        "verdict_stands": verdict_stands,
        "challenge": challenge,
        "revised_confidence": revised_confidence,
        "critic_note": critic_note,
        "raw": raw,
    }