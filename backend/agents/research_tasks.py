from crewai import Task


def create_market_data_task(agent, ticker: str, market_data: dict):
    return Task(
        description=f"""Analyze this live market data for {ticker} and write a concise report.
        DATA: {market_data}
        Include: price position in 52W range as %, volume vs average, key metrics.
        Flag unusual volume if >20% above average. Max 150 words.""",
        expected_output="Concise market data report under 150 words with key metrics and volume analysis.",
        agent=agent,
    )


def create_news_task(agent, ticker: str, news_data: list):
    return Task(
        description=f"""Rank these news articles for {ticker} by price impact.
        NEWS: {str(news_data)[:800]}
        Label each: Positive/Negative/Neutral and HIGH/MEDIUM/LOW impact. Max 150 words.""",
        expected_output="Ranked news list under 150 words with sentiment and impact labels.",
        agent=agent,
    )


def create_sentiment_task(agent, ticker: str, news_data: list, sentiment_data: dict):
    return Task(
        description=f"""Analyze sentiment for {ticker} from this data.
        NEWS: {str(news_data)[:400]}
        SENTIMENT: {str(sentiment_data)[:300]}
        Output: score (0.0-1.0), positive%, neutral%, negative%, top 2 drivers, label. Max 100 words.""",
        expected_output="Sentiment score, percentages, top 2 drivers, overall label. Under 100 words.",
        agent=agent,
    )


def create_fundamentals_task(agent, ticker: str, financials: dict, market_data: dict):
    return Task(
        description=f"""Analyze fundamentals for {ticker}.
        FINANCIALS: {financials}
        MARKET: price={market_data.get('current_price')}, pe={market_data.get('pe_ratio')}, eps={market_data.get('eps')}
        Give: valuation verdict (Undervalued/Fairly Valued/Overvalued), biggest strength, biggest risk. Max 150 words.""",
        expected_output="Fundamentals report under 150 words with valuation verdict, strength, risk.",
        agent=agent,
    )


def create_technical_task(agent, ticker: str, indicators: dict):
    return Task(
        description=f"""Analyze technical indicators for {ticker}.
        INDICATORS: {indicators}
        Give: RSI signal, MACD signal, SMA analysis, support/resistance, overall signal (Bullish/Neutral/Bearish).
        State the most important level to watch. Max 150 words.""",
        expected_output="Technical report under 150 words with overall signal and key level.",
        agent=agent,
    )


def create_risk_task(agent, ticker: str, market_data: dict, financials: dict, news_data: list):
    return Task(
        description=f"""Assess risks for {ticker}.
        BETA: {market_data.get('beta')} | DEBT/EQUITY: {financials.get('debt_to_equity')}
        NEWS SUMMARY: {str(news_data)[:300]}
        Give: overall risk rating (Low/Moderate/High), top 3 specific risks. Max 150 words.""",
        expected_output="Risk report under 150 words with rating and top 3 risks.",
        agent=agent,
    )