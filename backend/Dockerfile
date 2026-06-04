FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc g++ libffi-dev libssl-dev curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip

# Install torch CPU only
RUN pip install --no-cache-dir \
    torch==2.2.0 \
    --index-url https://download.pytorch.org/whl/cpu

# Install litellm first — crewai depends on it
RUN pip install --no-cache-dir litellm

# Install crewai with litellm extra
RUN pip install --no-cache-dir "crewai[litellm]==1.14.5"

# Install everything else
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    websockets \
    python-dotenv \
    httpx \
    aiohttp \
    pydantic \
    langchain \
    langchain-groq \
    langgraph \
    langsmith \
    groq \
    yfinance \
    pandas \
    ta \
    tavily-python \
    fastmcp \
    reportlab \
    matplotlib \
    python-multipart \
    requests \
    mem0ai

COPY . .

RUN mkdir -p crewai_storage

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]