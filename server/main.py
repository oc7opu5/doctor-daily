import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database import init_db, get_db
from .routes.auth import router as auth_router
from .routes.diary import router as diary_router
from .routes.finance import router as finance_router
from .routes.settings import router as settings_router

app = FastAPI(title="Doctor Daily", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(diary_router)
app.include_router(finance_router)
app.include_router(settings_router)

# Serve frontend in production
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIR / "index.html"))

@app.on_event("startup")
def startup():
    init_db()
    migrate_db()
    print("Doctor Daily v1.1 is running!")

def migrate_db():
    """Add new columns to existing databases"""
    conn = get_db()
    try:
        # Check if organized_versions column exists
        cols = [r[1] for r in conn.execute("PRAGMA table_info(diary_entries)").fetchall()]
        if "organized_versions" not in cols:
            conn.execute("ALTER TABLE diary_entries ADD COLUMN organized_versions TEXT")
            conn.commit()
            print("Migration: Added organized_versions column")
    except Exception as e:
        print(f"Migration note: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "29876"))
    uvicorn.run("server.main:app", host="0.0.0.0", port=port, reload=True)
