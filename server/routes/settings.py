from fastapi import APIRouter, Depends
from ..database import get_db
from ..models import SettingsUpdate, SettingsResponse
from ..auth import get_current_user
from ..ai_providers import PROVIDERS

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=SettingsResponse)
def get_settings(user: dict = Depends(get_current_user)):
    conn = get_db()
    settings = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user["id"],)).fetchone()
    conn.close()
    
    if not settings:
        return SettingsResponse(ai_provider="opencode", api_key_set=False)
    
    return SettingsResponse(
        ai_provider=settings["ai_provider"],
        api_key_set=bool(settings["api_key"])
    )

@router.put("", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate, user: dict = Depends(get_current_user)):
    conn = get_db()
    settings = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user["id"],)).fetchone()
    
    if not settings:
        conn.execute("INSERT INTO user_settings (user_id, ai_provider, api_key) VALUES (?, ?, ?)",
                      (user["id"], data.ai_provider or "opencode", data.api_key))
    else:
        updates = {}
        if data.ai_provider is not None:
            updates["ai_provider"] = data.ai_provider
        if data.api_key is not None:
            updates["api_key"] = data.api_key
        if updates:
            sets = ", ".join(f"{k} = ?" for k in updates)
            vals = list(updates.values()) + [user["id"]]
            conn.execute(f"UPDATE user_settings SET {sets} WHERE user_id = ?", vals)
    
    conn.commit()
    settings = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user["id"],)).fetchone()
    conn.close()
    
    return SettingsResponse(
        ai_provider=settings["ai_provider"],
        api_key_set=bool(settings["api_key"])
    )

@router.get("/providers")
def list_providers():
    return {k: {"name": v["name"], "requires_key": v["requires_key"]} for k, v in PROVIDERS.items()}
