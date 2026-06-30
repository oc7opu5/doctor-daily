# 🧠 Doctor Daily — Knowledge Base

> This file grows as we learn. Every lesson, pitfall, and idea goes here.

## 🎯 What It Is

Doctor Daily is a personal AI-powered diary and financial advisor. Users write raw thoughts and expense logs, and AI reorganizes them into beautiful prose and categorized financial reports. Multi-user with JWT auth.

## 🏗️ Tech Stack

- **Backend:** Python 3.12 + FastAPI + SQLite (stdlib)
- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + Recharts
- **Auth:** JWT (python-jose) + bcrypt (passlib)
- **AI:** Multi-provider (OpenCode, OpenAI, Anthropic, Ollama, OpenRouter)
- **Deploy:** Docker + docker-compose (VPS) / start.bat (Windows)

## 🗂️ Project Structure

```
Doctor-Daily/
├── server/
│   ├── main.py              # FastAPI app
│   ├── database.py          # SQLite setup
│   ├── models.py            # Pydantic models
│   ├── auth.py              # JWT auth
│   ├── ai_providers.py      # AI provider abstraction
│   └── routes/
│       ├── __init__.py      # Auth routes
│       ├── diary.py         # Diary CRUD + AI
│       ├── finance.py       # Finance CRUD + AI
│       └── settings.py      # User settings
├── frontend/
│   ├── src/
│   │   ├── api/service.js   # API client
│   │   ├── components/      # Sidebar, etc.
│   │   └── pages/           # Login, Dashboard, Diary, Finance, Settings
│   └── dist/                # Built frontend (served by FastAPI)
├── Dockerfile
├── docker-compose.yml
├── start.bat                # Windows launcher
├── requirements.txt
└── knowledge.md
```

## 🚀 How To Run

### Windows
1. Install Python 3.12+ and Node.js 20+
2. Double-click `start.bat`
3. Open http://localhost:29876

### Docker
```bash
cp .env.example .env
# Edit .env → set SECRET_KEY
docker compose up -d
```

## ⚠️ Pitfalls

- Port 29876 — chosen to avoid conflicts with existing services
- sql.js was avoided — using stdlib sqlite3 for simplicity
- OpenCode uses OpenAI-compatible API format at opencode-zen.com
- Anthropic uses different message format (system as top-level, not in messages array)
- Frontend builds to `frontend/dist/` — FastAPI serves this in production

## 💡 Lessons Learned

- Python stdlib sqlite3 is simpler than sql.js for cross-platform
- OpenCode is free and works well for diary/finance tasks
- Multi-user isolation: always filter by user_id in every query

## 🔮 Future Ideas

- [ ] Add image attachments to diary entries
- [ ] Monthly PDF finance reports
- [ ] Budget alerts and notifications
- [ ] Mobile-responsive design
- [ ] Export diary as PDF/Markdown
- [ ] Recurring transaction templates
- [ ] AI-generated monthly summaries
