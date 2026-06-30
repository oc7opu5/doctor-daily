from fastapi import APIRouter, HTTPException, Depends
from typing import List
import json
from ..database import get_db
from ..models import DiaryCreate, DiaryUpdate, DiaryResponse, DiarySelectVersion
from ..auth import get_current_user
from ..ai_providers import reorganize_diary, reorganize_diary_variants

router = APIRouter(prefix="/api/diary", tags=["diary"])

@router.get("", response_model=List[DiaryResponse])
def list_entries(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM diary_entries WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()
    conn.close()
    return [DiaryResponse(**dict(r)) for r in rows]

@router.post("", response_model=DiaryResponse)
def create_entry(data: DiaryCreate, user: dict = Depends(get_current_user)):
    conn = get_db()
    cur = conn.execute("INSERT INTO diary_entries (user_id, raw_content, mood) VALUES (?, ?, ?)", (user["id"], data.raw_content, data.mood))
    entry_id = cur.lastrowid
    conn.commit()
    entry = conn.execute("SELECT * FROM diary_entries WHERE id = ?", (entry_id,)).fetchone()
    conn.close()
    return DiaryResponse(**dict(entry))

@router.get("/{entry_id}", response_model=DiaryResponse)
def get_entry(entry_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    entry = conn.execute("SELECT * FROM diary_entries WHERE id = ? AND user_id = ?", (entry_id, user["id"])).fetchone()
    conn.close()
    if not entry:
        raise HTTPException(404, "Entry not found")
    return DiaryResponse(**dict(entry))

@router.put("/{entry_id}", response_model=DiaryResponse)
def update_entry(entry_id: int, data: DiaryUpdate, user: dict = Depends(get_current_user)):
    conn = get_db()
    entry = conn.execute("SELECT * FROM diary_entries WHERE id = ? AND user_id = ?", (entry_id, user["id"])).fetchone()
    if not entry:
        conn.close()
        raise HTTPException(404, "Entry not found")
    
    updates = {}
    if data.raw_content is not None:
        updates["raw_content"] = data.raw_content
    if data.organized_content is not None:
        updates["organized_content"] = data.organized_content
    if data.mood is not None:
        updates["mood"] = data.mood
    
    if updates:
        sets = ", ".join(f"{k} = ?" for k in updates)
        vals = list(updates.values()) + [entry_id]
        conn.execute(f"UPDATE diary_entries SET {sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?", vals)
        conn.commit()
    
    entry = conn.execute("SELECT * FROM diary_entries WHERE id = ?", (entry_id,)).fetchone()
    conn.close()
    return DiaryResponse(**dict(entry))

@router.delete("/{entry_id}")
def delete_entry(entry_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    entry = conn.execute("SELECT * FROM diary_entries WHERE id = ? AND user_id = ?", (entry_id, user["id"])).fetchone()
    if not entry:
        conn.close()
        raise HTTPException(404, "Entry not found")
    conn.execute("DELETE FROM diary_entries WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

@router.post("/{entry_id}/organize")
async def organize_entry(entry_id: int, user: dict = Depends(get_current_user)):
    """Generate 3 AI versions and return them (not saved yet)"""
    conn = get_db()
    entry = conn.execute("SELECT * FROM diary_entries WHERE id = ? AND user_id = ?", (entry_id, user["id"])).fetchone()
    if not entry:
        conn.close()
        raise HTTPException(404, "Entry not found")
    
    settings = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user["id"],)).fetchone()
    provider = settings["ai_provider"] if settings else "opencode"
    api_key = settings["api_key"] if settings else None
    
    try:
        versions = await reorganize_diary_variants(entry["raw_content"], api_key, provider)
        # Store all versions as JSON
        versions_json = json.dumps(versions)
        conn.execute("UPDATE diary_entries SET organized_versions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (versions_json, entry_id))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(500, f"AI error: {str(e)}")
    
    entry = conn.execute("SELECT * FROM diary_entries WHERE id = ?", (entry_id,)).fetchone()
    conn.close()
    return DiaryResponse(**dict(entry))

@router.post("/{entry_id}/select-version", response_model=DiaryResponse)
def select_version(entry_id: int, data: DiarySelectVersion, user: dict = Depends(get_current_user)):
    """Select a version (0-2 for AI, -1 for original) and save it"""
    conn = get_db()
    entry = conn.execute("SELECT * FROM diary_entries WHERE id = ? AND user_id = ?", (entry_id, user["id"])).fetchone()
    if not entry:
        conn.close()
        raise HTTPException(404, "Entry not found")
    
    if data.version_index == -1:
        # Keep original — clear organized content
        conn.execute("UPDATE diary_entries SET organized_content = NULL, organized_versions = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (entry_id,))
    else:
        versions = json.loads(entry["organized_versions"] or "[]")
        if data.version_index < 0 or data.version_index >= len(versions):
            conn.close()
            raise HTTPException(400, "Invalid version index")
        selected = versions[data.version_index]
        if not selected:
            conn.close()
            raise HTTPException(400, "That version failed to generate")
        conn.execute("UPDATE diary_entries SET organized_content = ?, organized_versions = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (selected, entry_id))
    
    conn.commit()
    entry = conn.execute("SELECT * FROM diary_entries WHERE id = ?", (entry_id,)).fetchone()
    conn.close()
    return DiaryResponse(**dict(entry))
