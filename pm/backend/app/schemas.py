from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict


class Card(BaseModel):
    id: str
    title: str
    details: str

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
