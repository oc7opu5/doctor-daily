from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models import TransactionCreate, TransactionUpdate, TransactionResponse
from ..auth import get_current_user
from ..ai_providers import analyze_finance, get_financial_advice, categorize_transaction, generate_weekly_summary

router = APIRouter(prefix="/api/finance", tags=["finance"])

class AdviceRequest(BaseModel):
    question: str

@router.get("", response_model=List[TransactionResponse])
def list_transactions(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()
    conn.close()
    return [TransactionResponse(**dict(r)) for r in rows]

@router.post("", response_model=TransactionResponse)
async def create_transaction(data: TransactionCreate, user: dict = Depends(get_current_user)):
    conn = get_db()
    
    # Get AI settings
    settings = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user["id"],)).fetchone()
    provider = settings["ai_provider"] if settings else "opencode"
    api_key = settings["api_key"] if settings else None
    
    # Auto-categorize with AI if tx_type not specified
    tx_type = data.tx_type
    category = None
    currency = data.currency or "BDT"
    
    if tx_type is None:
        try:
            result = await categorize_transaction(data.raw_description, data.amount, api_key, provider)
            tx_type = result.get("tx_type", "expense")
            category = result.get("category", "Other")
        except Exception:
            tx_type = "expense"
            category = "Other"
    else:
        try:
            result = await categorize_transaction(data.raw_description, data.amount, api_key, provider)
            category = result.get("category", "Other")
        except Exception:
            category = "Other"
    
    cur = conn.execute(
        "INSERT INTO finance_transactions (user_id, raw_description, amount, currency, tx_type, organized_category, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user["id"], data.raw_description, data.amount, currency, tx_type, category, data.transaction_date)
    )
    tx_id = cur.lastrowid
    conn.commit()
    tx = conn.execute("SELECT * FROM finance_transactions WHERE id = ?", (tx_id,)).fetchone()
    conn.close()
    return TransactionResponse(**dict(tx))

@router.put("/{tx_id}", response_model=TransactionResponse)
def update_transaction(tx_id: int, data: TransactionUpdate, user: dict = Depends(get_current_user)):
    conn = get_db()
    tx = conn.execute("SELECT * FROM finance_transactions WHERE id = ? AND user_id = ?", (tx_id, user["id"])).fetchone()
    if not tx:
        conn.close()
        raise HTTPException(404, "Transaction not found")
    
    updates = {}
    if data.raw_description is not None:
        updates["raw_description"] = data.raw_description
    if data.amount is not None:
        updates["amount"] = data.amount
    if data.currency is not None:
        updates["currency"] = data.currency
    if data.tx_type is not None:
        updates["tx_type"] = data.tx_type
    if data.organized_category is not None:
        updates["organized_category"] = data.organized_category
    if data.transaction_date is not None:
        updates["transaction_date"] = data.transaction_date
    
    if updates:
        sets = ", ".join(f"{k} = ?" for k in updates)
        vals = list(updates.values()) + [tx_id]
        conn.execute(f"UPDATE finance_transactions SET {sets} WHERE id = ?", vals)
        conn.commit()
    
    tx = conn.execute("SELECT * FROM finance_transactions WHERE id = ?", (tx_id,)).fetchone()
    conn.close()
    return TransactionResponse(**dict(tx))

@router.delete("/{tx_id}")
def delete_transaction(tx_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    tx = conn.execute("SELECT * FROM finance_transactions WHERE id = ? AND user_id = ?", (tx_id, user["id"])).fetchone()
    if not tx:
        conn.close()
        raise HTTPException(404, "Transaction not found")
    conn.execute("DELETE FROM finance_transactions WHERE id = ?", (tx_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

@router.get("/summary")
def get_summary(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY transaction_date DESC", (user["id"],)).fetchall()
    conn.close()
    
    # Group by currency
    by_currency = {}
    for r in rows:
        cur = r["currency"] or "BDT"
        if cur not in by_currency:
            by_currency[cur] = {"income": 0, "expense": 0, "count": 0}
        by_currency[cur]["count"] += 1
        if r["tx_type"] in ("expense", "loan_given"):
            by_currency[cur]["expense"] += r["amount"]
        elif r["tx_type"] in ("income", "loan_received"):
            by_currency[cur]["income"] += r["amount"]
    
    # Also compute totals across all currencies (for backwards compat)
    total_expense = sum(r["amount"] for r in rows if r["tx_type"] in ("expense", "loan_given"))
    total_income = sum(r["amount"] for r in rows if r["tx_type"] in ("income", "loan_received"))
    
    categories = {}
    for r in rows:
        cat = r["organized_category"] or "Uncategorized"
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += r["amount"]
    
    return {
        "total_expense": total_expense,
        "total_income": total_income,
        "balance": total_income - total_expense,
        "transaction_count": len(rows),
        "categories": categories,
        "by_currency": by_currency,
    }

@router.post("/analyze")
async def analyze_spending(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY transaction_date DESC", (user["id"],)).fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(400, "No transactions to analyze")
    
    tx_text = "\n".join([
        f"- {r['transaction_date'] or 'No date'}: {r['raw_description']} — {r['currency'] or 'BDT'} {r['amount']:.2f} ({r['tx_type']}) [{r['organized_category'] or 'Uncategorized'}]"
        for r in rows
    ])
    
    settings_conn = get_db()
    settings = settings_conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user["id"],)).fetchone()
    provider = settings["ai_provider"] if settings else "opencode"
    api_key = settings["api_key"] if settings else None
    settings_conn.close()
    
    try:
        analysis = await analyze_finance(tx_text, api_key, provider)
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {str(e)}")

@router.post("/advice")
async def ask_advice(body: AdviceRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 50", (user["id"],)).fetchall()
    settings = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user["id"],)).fetchone()
    conn.close()
    
    context = "\n".join([
        f"- {r['transaction_date'] or 'No date'}: {r['raw_description']} — {r['currency'] or 'BDT'} {r['amount']:.2f} ({r['tx_type']}) [{r['organized_category'] or 'Uncategorized'}]"
        for r in rows
    ]) if rows else "No transactions yet"
    
    provider = settings["ai_provider"] if settings else "opencode"
    api_key = settings["api_key"] if settings else None
    
    try:
        advice = await get_financial_advice(body.question, context, api_key, provider)
        return {"advice": advice}
    except Exception as e:
        raise HTTPException(500, f"AI advisor failed: {str(e)}")

@router.get("/search", response_model=List[TransactionResponse])
def search_transactions(q: str = "", user: dict = Depends(get_current_user)):
    conn = get_db()
    if q.strip():
        rows = conn.execute(
            "SELECT * FROM finance_transactions WHERE user_id = ? AND (raw_description LIKE ? OR organized_category LIKE ?) ORDER BY created_at DESC",
            (user["id"], f"%{q}%", f"%{q}%")
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()
    conn.close()
    return [TransactionResponse(**dict(r)) for r in rows]

@router.get("/monthly")
def monthly_data(user: dict = Depends(get_current_user)):
    """Get last 6 months of income/expense data for charts"""
    conn = get_db()
    rows = conn.execute("""
        SELECT strftime('%Y-%m', transaction_date) as month, 
               SUM(CASE WHEN tx_type IN ('income','loan_received') THEN amount ELSE 0 END) as income,
               SUM(CASE WHEN tx_type IN ('expense','loan_given') THEN amount ELSE 0 END) as expense
        FROM finance_transactions 
        WHERE user_id = ? AND transaction_date IS NOT NULL
        GROUP BY month ORDER BY month DESC LIMIT 6
    """, (user["id"],)).fetchall()
    conn.close()
    return [{"month": r["month"], "income": r["income"], "expense": r["expense"]} for r in reversed(rows)]

@router.post("/weekly-summary")
async def weekly_summary(user: dict = Depends(get_current_user)):
    conn = get_db()
    diary = conn.execute("""
        SELECT raw_content FROM diary_entries 
        WHERE user_id = ? AND created_at >= date('now', '-7 days')
    """, (user["id"],)).fetchall()
    finance = conn.execute("""
        SELECT raw_description, amount, currency, tx_type, organized_category, transaction_date 
        FROM finance_transactions 
        WHERE user_id = ? AND transaction_date >= date('now', '-7 days')
    """, (user["id"],)).fetchall()
    settings = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user["id"],)).fetchone()
    conn.close()
    
    diary_text = "\n".join([f"- {r['raw_content'][:200]}" for r in diary]) or "No diary entries this week"
    finance_text = "\n".join([
        f"- {r['transaction_date']}: {r['raw_description']} — {r['currency']} {r['amount']:.2f} ({r['tx_type']}) [{r['organized_category']}]"
        for r in finance
    ]) or "No transactions this week"
    
    provider = settings["ai_provider"] if settings else "opencode"
    api_key = settings["api_key"] if settings else None
    
    try:
        summary = await generate_weekly_summary(diary_text, finance_text, api_key, provider)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(500, f"AI error: {str(e)}")
