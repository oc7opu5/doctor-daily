# 🩺 Doctor Daily

**Write messy. AI organizes. Live smarter.**

A personal AI-powered diary and financial advisor. Write your thoughts freely — AI reorganizes them into beautiful prose. Track your spending — your AI accountant helps you save money.

## Features

- **📝 Diary** — Write raw thoughts, AI organizes into clean writing
- **💰 Finance** — Log expenses messily, AI categorizes and advises
- **🤖 AI Providers** — OpenCode (free), OpenAI, Anthropic, Ollama, OpenRouter
- **🔐 Multi-User** — Each user has their own private account
- **🎨 Dark Theme** — Beautiful, modern UI

## Quick Start

### 🪟 Windows (Recommended)

1. Install [Python 3.12+](https://python.org) and [Node.js 20+](https://nodejs.org)
2. Double-click `start.bat`
3. Open `http://localhost:29876`

### 🐳 Docker (VPS/Linux)

```bash
# Clone and build
git clone <repo-url> doctor-daily
cd doctor-daily

# Edit .env (set SECRET_KEY!)
cp .env.example .env

# Run
docker compose up -d
```

### 🔧 Manual Setup

```bash
# Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run build
cd ..

# Run
python -m uvicorn server.main:app --host 0.0.0.0 --port 29876
```

## AI Providers

| Provider | Free? | API Key Needed |
|----------|-------|----------------|
| OpenCode | ✅ Yes | No |
| Ollama | ✅ Yes (local) | No |
| OpenAI | ❌ Paid | Yes |
| Anthropic | ❌ Paid | Yes |
| OpenRouter | ⚡ Varies | Yes |

## Tech Stack

- **Backend:** Python FastAPI + SQLite
- **Frontend:** React + Vite + Tailwind CSS
- **AI:** Multi-provider support (OpenAI-compatible API)

## Privacy

- All data stored locally in SQLite
- Each user's data is fully isolated
- API keys encrypted per-user
- No telemetry, no tracking

## License

MIT
