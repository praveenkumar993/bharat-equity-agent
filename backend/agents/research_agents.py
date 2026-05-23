import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crewai import Agent
from agents.llm_config import get_llm_fast, get_llm_precise


def create_market_data_agent():
    return Agent(
        role="Market Data Specialist",
        goal="Analyze market data and write a concise report. No tools needed.",
        backstory="Expert market analyst. Always concise. Max 150 words.",
        tools=[],
        llm=get_llm_fast(),
        verbose=True,
        max_iter=1,
    )

def create_news_agent():
    return Agent(
        role="Financial News Analyst",
        goal="Rank news by price impact. No tools needed.",
        backstory="Financial journalist. Concise. Max 150 words.",
        tools=[],
        llm=get_llm_fast(),
        verbose=True,
        max_iter=1,
    )

def create_sentiment_agent():
    return Agent(
        role="Sentiment Analysis Expert",
        goal="Produce sentiment score 0-1. No tools needed.",
        backstory="Behavioral finance expert. Score, %, drivers only. Max 100 words.",
        tools=[],
        llm=get_llm_fast(),
        verbose=True,
        max_iter=1,
    )

def create_fundamentals_agent():
    return Agent(
        role="Equity Research Analyst",
        goal="Analyze fundamentals and give valuation verdict. No tools needed.",
        backstory="CFA charterholder. Key ratios and verdict only. Max 150 words.",
        tools=[],
        llm=get_llm_precise(),
        verbose=True,
        max_iter=1,
    )

def create_technical_agent():
    return Agent(
        role="Technical Analysis Expert",
        goal="Analyze technicals and give signal. No tools needed.",
        backstory="Technical analyst. Key signals and levels only. Max 150 words.",
        tools=[],
        llm=get_llm_fast(),
        verbose=True,
        max_iter=1,
    )

def create_risk_agent():
    return Agent(
        role="Risk Assessment Officer",
        goal="Identify top 3 risks and rating. No tools needed.",
        backstory="SEBI risk manager. Top risks and rating only. Max 150 words.",
        tools=[],
        llm=get_llm_precise(),
        verbose=True,
        max_iter=1,
    )