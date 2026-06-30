from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Auth
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Diary
class DiaryCreate(BaseModel):
    raw_content: str
    mood: Optional[str] = None

class DiaryUpdate(BaseModel):
    raw_content: Optional[str] = None
    organized_content: Optional[str] = None
    mood: Optional[str] = None

class DiaryResponse(BaseModel):
    id: int
    raw_content: str
    organized_content: Optional[str] = None
    organized_versions: Optional[str] = None
    mood: Optional[str] = None
    created_at: str
    updated_at: str

class DiarySelectVersion(BaseModel):
    version_index: int  # 0, 1, 2 for AI versions, -1 for keep original

# Finance
class TransactionCreate(BaseModel):
    raw_description: str
    amount: float
    currency: Optional[str] = "BDT"
    tx_type: Optional[str] = None  # None = let AI decide
    transaction_date: Optional[str] = None

class TransactionUpdate(BaseModel):
    raw_description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    tx_type: Optional[str] = None
    organized_category: Optional[str] = None
    transaction_date: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    raw_description: str
    amount: float
    currency: str = "BDT"
    tx_type: str
    organized_category: Optional[str] = None
    ai_advice: Optional[str] = None
    transaction_date: Optional[str] = None
    created_at: str

# Settings
class SettingsUpdate(BaseModel):
    ai_provider: Optional[str] = None
    api_key: Optional[str] = None
    default_currency: Optional[str] = None

class SettingsResponse(BaseModel):
    ai_provider: str
    api_key_set: bool
    default_currency: str = "BDT"
