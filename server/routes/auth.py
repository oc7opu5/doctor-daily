from fastapi import APIRouter, HTTPException, Depends
from ..database import get_db
from ..models import UserRegister, UserLogin, UserResponse, TokenResponse
from ..auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister):
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE username = ? OR email = ?", (data.username, data.email)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(400, "Username or email already exists")
    
    hashed = hash_password(data.password)
    cur = conn.execute("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)", (data.username, data.email, hashed))
    user_id = cur.lastrowid
    conn.execute("INSERT INTO user_settings (user_id) VALUES (?)", (user_id,))
    conn.commit()
    
    user = conn.execute("SELECT id, username, email, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    
    token = create_access_token({"sub": user_id})
    return TokenResponse(access_token=token, user=UserResponse(**dict(user)))

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (data.username,)).fetchone()
    conn.close()
    
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid username or password")
    
    token = create_access_token({"sub": user["id"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], username=user["username"], email=user["email"], created_at=user["created_at"])
    )

@router.get("/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)
