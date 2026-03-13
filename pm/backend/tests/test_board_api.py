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


def test_get_board_creates_default(client):
    response = client.get("/api/board", params={"user_id": "user"})
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["columns"]) == 5
    assert len(payload["cards"]) == 8


def test_put_board_persists_updates(client):
    response = client.get("/api/board", params={"user_id": "user"})
    assert response.status_code == 200
    board = response.json()

    updated = deepcopy(board)
    updated_card = {
        "id": "card-new",
        "title": "New card",
        "details": "Saved in sqlite",
    }
    updated["cards"][updated_card["id"]] = updated_card
    updated["columns"][0]["cardIds"].append(updated_card["id"])

    put_response = client.put(
        "/api/board", params={"user_id": "user"}, json=updated
    )
    assert put_response.status_code == 200

    refreshed = client.get("/api/board", params={"user_id": "user"}).json()
    assert "card-new" in refreshed["cards"]
    assert "card-new" in refreshed["columns"][0]["cardIds"]


def test_users_have_separate_boards(client):
    user_board = client.get("/api/board", params={"user_id": "user"}).json()
    other_board = client.get("/api/board", params={"user_id": "other"}).json()
    assert [column["title"] for column in user_board["columns"]] == [
        column["title"] for column in other_board["columns"]
    ]

    updated = deepcopy(user_board)
    updated["columns"][0]["cardIds"].append("user-card-extra")
    updated["cards"]["user-card-extra"] = {
        "id": "user-card-extra",
        "title": "Extra",
        "details": "Only for user",
    }

    client.put("/api/board", params={"user_id": "user"}, json=updated)

    refreshed_user = client.get("/api/board", params={"user_id": "user"}).json()
    refreshed_other = client.get("/api/board", params={"user_id": "other"}).json()

    assert "user-card-extra" in refreshed_user["cards"]
    assert "user-card-extra" not in refreshed_other["cards"]
