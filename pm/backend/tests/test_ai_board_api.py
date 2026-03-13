from __future__ import annotations

from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from app import main


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_PATH", str(db_path))
    with TestClient(main.app) as client:
        yield client


def test_ai_endpoint_applies_board_update(client, monkeypatch):
    board = client.get("/api/board", params={"user_id": "user"}).json()

    updated = deepcopy(board)
    new_card = {
        "id": "card-ai-1",
        "title": "AI created",
        "details": "Added by structured output.",
    }
    updated["cards"][new_card["id"]] = new_card
    updated["columns"][0]["cardIds"].append(new_card["id"])

    def fake_call(messages, schema):
        return {"message": "Added a card.", "board": updated}

    monkeypatch.setattr(main, "call_openrouter_structured", fake_call)

    response = client.post(
        "/api/ai/board",
        params={"user_id": "user"},
        json={"question": "Add a card", "history": []},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["applied"] is True
    assert new_card["id"] in payload["board"]["cards"]

    refreshed = client.get("/api/board", params={"user_id": "user"}).json()
    assert new_card["id"] in refreshed["cards"]


def test_ai_endpoint_validates_response_schema(client, monkeypatch):
    def fake_call(messages, schema):
        return {"board": None}

    monkeypatch.setattr(main, "call_openrouter_structured", fake_call)

    response = client.post(
        "/api/ai/board",
        params={"user_id": "user"},
        json={"question": "No message", "history": []},
    )
    assert response.status_code == 502
