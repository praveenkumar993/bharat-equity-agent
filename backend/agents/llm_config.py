from crewai import LLM

def get_llm_fast():
    """Llama 3.3 70B via Groq — fast agents."""
    return LLM(
        model="groq/llama-3.3-70b-versatile",
        temperature=0.1,
    )

def get_llm_precise():
    """Llama 3.1 8B via Groq — precise agents."""
    return LLM(
        model="groq/llama-3.1-8b-instant",
        temperature=0.1,
    )