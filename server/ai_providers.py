import httpx
import os
from typing import Optional

PROVIDERS = {
    "openrouter": {
        "name": "OpenRouter (Free models available)",
        "base_url": "https://openrouter.ai/api/v1",
        "default_model": "deepseek/deepseek-chat-v3-0324:free",
        "requires_key": True,
    },
    "opencode": {
        "name": "OpenCode (Free)",
        "base_url": "https://opencode.ai/zen/v1",
        "default_model": "deepseek-v4-flash-free",
        "requires_key": False,
    },
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o-mini",
        "requires_key": True,
    },
    "anthropic": {
        "name": "Anthropic",
        "base_url": "https://api.anthropic.com/v1",
        "default_model": "claude-sonnet-4-20250514",
        "requires_key": True,
    },
    "ollama": {
        "name": "Ollama (Local)",
        "base_url": "http://localhost:11434/v1",
        "default_model": "llama3.1",
        "requires_key": False,
    },
}

DIARY_SYSTEM = """You are Doctor Daily, a writing assistant. The user writes raw diary thoughts.
Reorganize their thoughts into beautiful, clean prose while EXACTLY preserving their voice, tone, and style.
Do NOT change their personality. Do NOT add your own opinions. Just clean up the structure, fix grammar, 
and make it flow naturally. Keep it personal and warm. Write in the same language they use."""

FINANCE_SYSTEM = """You are Doctor Daily, an expert chartered accountant and financial advisor.
Analyze the user's spending data and provide:
1. Category breakdown (Food, Transport, Bills, Entertainment, etc.)
2. Monthly summary
3. Wise advice on where they can save
4. Warning signs if spending is too high
Be direct, practical, and caring like a real human advisor. Use the same language as the user."""

async def call_ai(provider: str, api_key: Optional[str], messages: list, purpose: str = "general") -> str:
    config = PROVIDERS.get(provider)
    if not config:
        raise ValueError(f"Unknown provider: {provider}")
    
    headers = {"Content-Type": "application/json"}
    
    if provider == "anthropic":
        headers["x-api-key"] = api_key or ""
        headers["anthropic-version"] = "2023-06-01"
        system_msg = messages[0]["content"] if messages[0]["role"] == "system" else ""
        chat_messages = [m for m in messages if m["role"] != "system"]
        payload = {
            "model": config["default_model"],
            "max_tokens": 2048,
            "system": system_msg,
            "messages": chat_messages,
        }
        url = f"{config['base_url']}/messages"
    else:
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        elif provider == "openrouter":
            # OpenRouter requires a key even for free models
            raise ValueError("OpenRouter requires an API key. Get one free at openrouter.ai")
        
        payload = {
            "model": config["default_model"],
            "messages": messages,
            "max_tokens": 2048,
            "temperature": 0.7,
        }
        url = f"{config['base_url']}/chat/completions"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
    
    if provider == "anthropic":
        return data["content"][0]["text"]
    return data["choices"][0]["message"]["content"]

async def reorganize_diary(raw_text: str, api_key: Optional[str], provider: str = "opencode") -> str:
    messages = [
        {"role": "system", "content": DIARY_SYSTEM},
        {"role": "user", "content": f"Reorganize this diary entry:\n\n{raw_text}"},
    ]
    return await call_ai(provider, api_key, messages, "diary")

async def analyze_finance(transactions_text: str, api_key: Optional[str], provider: str = "opencode") -> str:
    messages = [
        {"role": "system", "content": FINANCE_SYSTEM},
        {"role": "user", "content": f"Analyze my spending:\n\n{transactions_text}"},
    ]
    return await call_ai(provider, api_key, messages, "finance")

async def get_financial_advice(question: str, context: str, api_key: Optional[str], provider: str = "opencode") -> str:
    messages = [
        {"role": "system", "content": FINANCE_SYSTEM},
        {"role": "user", "content": f"Context:\n{context}\n\nMy question:\n{question}"},
    ]
    return await call_ai(provider, api_key, messages, "advice")
