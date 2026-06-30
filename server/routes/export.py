from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api/export", tags=["export"])

@router.get("/finance/csv")
def export_finance_csv(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY transaction_date DESC", (user["id"],)).fetchall()
    conn.close()
    
    csv_lines = ["Date,Description,Amount,Currency,Type,Category"]
    for r in rows:
        desc = r["raw_description"].replace('"', '""')
        csv_lines.append(f'"{r["transaction_date"] or ""}","{desc}",{r["amount"]},"{r["currency"]}","{r["tx_type"]}","{r["organized_category"] or ""}"')
    
    csv_content = "\n".join(csv_lines)
    from fastapi.responses import Response
    return Response(content=csv_content, media_type="text/csv",
                   headers={"Content-Disposition": "attachment; filename=finance_export.csv"})

@router.get("/diary/pdf")
def export_diary_pdf(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM diary_entries WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()
    conn.close()
    
    entries_html = ""
    for r in rows:
        content = r["organized_content"] or r["raw_content"]
        content = content.replace("\n", "<br>")
        entries_html += f"""
        <div style="margin-bottom:30px; page-break-inside:avoid;">
            <h3 style="color:#6366f1;">{r['created_at'][:10]} {f"— {r['mood']}" if r['mood'] else ""}</h3>
            <p style="white-space:pre-wrap; line-height:1.8;">{content}</p>
            <hr style="border-color:#333; margin-top:20px;">
        </div>
        """
    
    html = f"""<!DOCTYPE html>
<html><head><title>Doctor Daily - My Diary</title>
<style>
    body {{ font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; background: #0a0a0a; color: #e5e5e5; }}
    h1 {{ color: #818cf8; border-bottom: 1px solid #333; padding-bottom: 10px; }}
    h3 {{ color: #818cf8; }}
    @media print {{ body {{ background: white; color: black; }} h1, h3 {{ color: #4f46e5; }} }}
</style></head><body>
<h1>🩺 Doctor Daily — My Diary</h1>
<p style="color:#888;">Exported entries: {len(rows)}</p>
{entries_html}
<script>setTimeout(()=>window.print(), 500);</script>
</body></html>"""
    
    return HTMLResponse(content=html)
