from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..database import get_db
from ..models import BudgetCreate, BudgetResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/budgets", tags=["budgets"])

@router.get("", response_model=List[BudgetResponse])
def list_budgets(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM budgets WHERE user_id = ?", (user["id"],)).fetchall()
    conn.close()
    return [BudgetResponse(**dict(r)) for r in rows]

@router.post("", response_model=BudgetResponse)
def create_budget(data: BudgetCreate, user: dict = Depends(get_current_user)):
    conn = get_db()
    # Check if budget for this category already exists
    existing = conn.execute("SELECT * FROM budgets WHERE user_id = ? AND category = ?", (user["id"], data.category)).fetchone()
    if existing:
        # Update instead
        conn.execute("UPDATE budgets SET monthly_limit = ?, currency = ? WHERE id = ?", (data.monthly_limit, data.currency or "BDT", existing["id"]))
        conn.commit()
        budget = conn.execute("SELECT * FROM budgets WHERE id = ?", (existing["id"],)).fetchone()
    else:
        cur = conn.execute("INSERT INTO budgets (user_id, category, monthly_limit, currency) VALUES (?, ?, ?, ?)",
                          (user["id"], data.category, data.monthly_limit, data.currency or "BDT"))
        conn.commit()
        budget = conn.execute("SELECT * FROM budgets WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return BudgetResponse(**dict(budget))

@router.delete("/{budget_id}")
def delete_budget(budget_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    budget = conn.execute("SELECT * FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user["id"])).fetchone()
    if not budget:
        conn.close()
        raise HTTPException(404, "Budget not found")
    conn.execute("DELETE FROM budgets WHERE id = ?", (budget_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

@router.get("/status")
def budget_status(user: dict = Depends(get_current_user)):
    conn = get_db()
    budgets = conn.execute("SELECT * FROM budgets WHERE user_id = ?", (user["id"],)).fetchall()
    # Get current month transactions
    rows = conn.execute("""
        SELECT organized_category, SUM(amount) as total 
        FROM finance_transactions 
        WHERE user_id = ? AND tx_type IN ('expense', 'loan_given')
        AND transaction_date >= date('now', 'start of month')
        GROUP BY organized_category
    """, (user["id"],)).fetchall()
    conn.close()
    
    spent = {r["organized_category"]: r["total"] for r in rows if r["organized_category"]}
    
    results = []
    for b in budgets:
        cat = b["category"]
        spent_amount = spent.get(cat, 0)
        limit = b["monthly_limit"]
        results.append({
            "id": b["id"],
            "category": cat,
            "monthly_limit": limit,
            "currency": b["currency"],
            "spent": spent_amount,
            "remaining": limit - spent_amount,
            "percentage": round((spent_amount / limit * 100), 1) if limit > 0 else 0,
            "exceeded": spent_amount > limit,
        })
    
    return results
