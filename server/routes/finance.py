from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..database import get_db
from ..models import TransactionCreate, TransactionResponse
from ..auth import get_current_user
from ..ai_providers import analyze_finance, get_financial_advice

router = APIRouter(prefix="/api/finance", tags=["finance"])

@router.get("", response_model=List[TransactionResponse])
def list_transactions(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()
    conn.close()
    return [TransactionResponse(**dict(r)) for r in rows]

@router.post("", response_model=TransactionResponse)
def create_transaction(data: TransactionCreate, user: dict = Depends(get_current_user)):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO finance_transactions (user_id, raw_description, amount, tx_type, transaction_date) VALUES (?, ?, ?, ?, ?)",
        (user["id"], data.raw_description, data.amount, data.tx_type, data.transaction_date)
    )
    tx_id = cur.lastrowid
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
    
    total_expense = sum(r["amount"] for r in rows if r["tx_type"] == "expense")
    total_income = sum(r["amount"] for r in rows if r["tx_type"] == "income")
    
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
    }

@router.post("/analyze")
async def analyze_spending(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY transaction_date DESC", (user["id"],)).fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(400, "No transactions to analyze")
    
    tx_text = "\n".join([
        f"- {r['transaction_date'] or 'No date'}: {r['raw_description']} — ${r['amount']:.2f} ({r['tx_type']})"
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
        raise HTTPException(500, f"AI error: {str(e)}")

@router.post("/advice")
async def ask_advice(question: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 50", (user["id"],)).fetchall()
    settings = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user["id"],)).fetchone()
    conn.close()
    
    context = "\n".join([
        f"- {r['transaction_date'] or 'No date'}: {r['raw_description']} — ${r['amount']:.2f} ({r['tx_type']})"
        for r in rows
    ]) if rows else "No transactions yet"
    
    provider = settings["ai_provider"] if settings else "opencode"
    api_key = settings["api_key"] if settings else None
    
    try:
        advice = await get_financial_advice(question, context, api_key, provider)
        return {"advice": advice}
    except Exception as e:
        raise HTTPException(500, f"AI error: {str(e)}")
