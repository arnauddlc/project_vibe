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


@pytest.fixture
def auth(client):
    resp = client.post(
        "/api/auth/register", json={"username": "user", "password": "password"}
    )
    data = resp.json()
    return {"headers": {"Authorization": f"Bearer {data['token']}"}}


def get_board_id(client, headers):
    boards = client.get("/api/boards", headers=headers).json()
    return boards[0]["id"]


# --- Legacy endpoint tests ---

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


# --- New token-based endpoint tests ---

def test_ai_board_endpoint_with_token(client, auth, monkeypatch):
    board_id = get_board_id(client, auth["headers"])
    board = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()

    updated = deepcopy(board)
    new_card = {"id": "card-ai-new", "title": "Token AI card", "details": "Added."}
    updated["cards"][new_card["id"]] = new_card
    updated["columns"][0]["cardIds"].append(new_card["id"])

    def fake_call(messages, schema):
        return {"message": "Added a card.", "board": updated}

    monkeypatch.setattr(main, "call_openrouter_structured", fake_call)

    response = client.post(
        f"/api/boards/{board_id}/ai",
        headers=auth["headers"],
        json={"question": "Add a card", "history": []},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["applied"] is True
    assert new_card["id"] in payload["board"]["cards"]

    refreshed = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()
    assert new_card["id"] in refreshed["cards"]


def test_ai_board_no_board_change(client, auth, monkeypatch):
    board_id = get_board_id(client, auth["headers"])

    def fake_call(messages, schema):
        return {"message": "No changes needed.", "board": None}

    monkeypatch.setattr(main, "call_openrouter_structured", fake_call)

    response = client.post(
        f"/api/boards/{board_id}/ai",
        headers=auth["headers"],
        json={"question": "How many cards?", "history": []},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["applied"] is False
    assert payload["board"] is None
    assert payload["message"] == "No changes needed."


def test_ai_board_validates_bad_response_schema(client, auth, monkeypatch):
    board_id = get_board_id(client, auth["headers"])

    def fake_call(messages, schema):
        return {"board": None}  # missing required "message" field

    monkeypatch.setattr(main, "call_openrouter_structured", fake_call)

    response = client.post(
        f"/api/boards/{board_id}/ai",
        headers=auth["headers"],
        json={"question": "test", "history": []},
    )
    assert response.status_code == 502


def test_ai_board_wrong_owner_returns_404(client, auth, monkeypatch):
    # Register bob
    bob_resp = client.post(
        "/api/auth/register", json={"username": "bob", "password": "pass1234"}
    )
    bob_headers = {"Authorization": f"Bearer {bob_resp.json()['token']}"}

    alice_board_id = get_board_id(client, auth["headers"])

    def fake_call(messages, schema):
        return {"message": "noop", "board": None}

    monkeypatch.setattr(main, "call_openrouter_structured", fake_call)

    response = client.post(
        f"/api/boards/{alice_board_id}/ai",
        headers=bob_headers,
        json={"question": "test", "history": []},
    )
    assert response.status_code == 404
