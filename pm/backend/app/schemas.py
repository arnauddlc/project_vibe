from __future__ import annotations

from typing import Dict, List

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
