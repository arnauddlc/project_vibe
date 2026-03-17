from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator


class Card(BaseModel):
    id: str
    title: str
    details: str
    priority: Literal["low", "medium", "high"] = "medium"
    due_date: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class Column(BaseModel):
    id: str
    title: str
    cardIds: List[str]

    model_config = ConfigDict(extra="forbid")


class BoardData(BaseModel):
    columns: List[Column]
    cards: Dict[str, Card]

    model_config = ConfigDict(extra="forbid")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

    model_config = ConfigDict(extra="forbid")


class AIChatRequest(BaseModel):
    question: str
    history: List[ChatMessage] = []

    model_config = ConfigDict(extra="forbid")


class AIResponse(BaseModel):
    message: str
    board: Optional[BoardData] = None

    model_config = ConfigDict(extra="forbid")


class AIChatResponse(BaseModel):
    message: str
    board: Optional[BoardData] = None
    applied: bool

    model_config = ConfigDict(extra="forbid")


# --- Auth schemas ---

class UserCreate(BaseModel):
    username: str
    password: str

    model_config = ConfigDict(extra="forbid")

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Username cannot be empty")
        if len(v) < 2:
            raise ValueError("Username must be at least 2 characters")
        if len(v) > 50:
            raise ValueError("Username must be at most 50 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, v: str) -> str:
        if len(v) < 4:
            raise ValueError("Password must be at least 4 characters")
        return v


class UserLogin(BaseModel):
    username: str
    password: str

    model_config = ConfigDict(extra="forbid")


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    model_config = ConfigDict(extra="forbid")

    @field_validator("new_password")
    @classmethod
    def new_password_length(cls, v: str) -> str:
        if len(v) < 4:
            raise ValueError("New password must be at least 4 characters")
        return v


class TokenResponse(BaseModel):
    token: str
    user_id: str
    username: str

    model_config = ConfigDict(extra="forbid")


# --- Board management schemas ---

class BoardSummary(BaseModel):
    id: str
    title: str
    description: str
    card_count: int
    created_at: str
    updated_at: str

    model_config = ConfigDict(extra="forbid")


class BoardDescription(BaseModel):
    description: str

    model_config = ConfigDict(extra="forbid")


class BoardCreate(BaseModel):
    title: str

    model_config = ConfigDict(extra="forbid")

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        if len(v) > 100:
            raise ValueError("Title must be at most 100 characters")
        return v


class BoardRename(BaseModel):
    title: str

    model_config = ConfigDict(extra="forbid")

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        if len(v) > 100:
            raise ValueError("Title must be at most 100 characters")
        return v
