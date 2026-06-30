import sqlite3
import os
from pathlib import Path

DB_PATH = os.getenv("DB_PATH", str(Path(__file__).parent / "data" / "doctor_daily.db"))

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY,
        ai_provider TEXT DEFAULT 'opencode',
        api_key TEXT,
        default_currency TEXT DEFAULT 'BDT',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diary_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        raw_content TEXT NOT NULL,
        organized_content TEXT,
        organized_versions TEXT,
        mood TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finance_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        raw_description TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'BDT',
        tx_type TEXT DEFAULT 'expense',
        organized_category TEXT,
        ai_advice TEXT,
        transaction_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        monthly_limit REAL NOT NULL,
        currency TEXT DEFAULT 'BDT',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    conn.commit()
    conn.close()

def migrate_db():
    conn = get_db()
    try:
        cols = [r[1] for r in conn.execute("PRAGMA table_info(diary_entries)").fetchall()]
        if "organized_versions" not in cols:
            conn.execute("ALTER TABLE diary_entries ADD COLUMN organized_versions TEXT")
        cols = [r[1] for r in conn.execute("PRAGMA table_info(finance_transactions)").fetchall()]
        if "currency" not in cols:
            conn.execute("ALTER TABLE finance_transactions ADD COLUMN currency TEXT DEFAULT 'BDT'")
        cols = [r[1] for r in conn.execute("PRAGMA table_info(user_settings)").fetchall()]
        if "default_currency" not in cols:
            conn.execute("ALTER TABLE user_settings ADD COLUMN default_currency TEXT DEFAULT 'BDT'")
        conn.commit()
    except Exception as e:
        print(f"Migration: {e}")
    finally:
        conn.close()
