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
    """Register a user and return auth headers + user info."""
    response = client.post(
        "/api/auth/register", json={"username": "alice", "password": "pass1234"}
    )
    assert response.status_code == 201
    data = response.json()
    return {
        "headers": {"Authorization": f"Bearer {data['token']}"},
        "user_id": data["user_id"],
        "token": data["token"],
    }


@pytest.fixture
def auth2(client):
    """Second user."""
    response = client.post(
        "/api/auth/register", json={"username": "bob", "password": "pass1234"}
    )
    assert response.status_code == 201
    data = response.json()
    return {"headers": {"Authorization": f"Bearer {data['token']}"}}


def test_user_has_default_board_after_register(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    assert len(boards) == 1
    assert boards[0]["title"] == "My First Board"


def test_create_second_board(client, auth):
    response = client.post(
        "/api/boards",
        headers=auth["headers"],
        json={"title": "Sprint 2"},
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Sprint 2"
    assert response.json()["card_count"] == 8  # default board populated

    boards = client.get("/api/boards", headers=auth["headers"]).json()
    assert len(boards) == 2


def test_board_title_validation(client, auth):
    response = client.post(
        "/api/boards",
        headers=auth["headers"],
        json={"title": ""},
    )
    assert response.status_code == 422


def test_rename_board(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]

    response = client.patch(
        f"/api/boards/{board_id}",
        headers=auth["headers"],
        json={"title": "Renamed Board"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Renamed Board"


def test_rename_board_not_owned_returns_404(client, auth, auth2):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]

    # bob tries to rename alice's board
    response = client.patch(
        f"/api/boards/{board_id}",
        headers=auth2["headers"],
        json={"title": "Hacked"},
    )
    assert response.status_code == 404


def test_delete_board(client, auth):
    # Create a second board to delete
    create_resp = client.post(
        "/api/boards",
        headers=auth["headers"],
        json={"title": "To Delete"},
    )
    board_id = create_resp.json()["id"]

    response = client.delete(f"/api/boards/{board_id}", headers=auth["headers"])
    assert response.status_code == 204

    boards = client.get("/api/boards", headers=auth["headers"]).json()
    ids = [b["id"] for b in boards]
    assert board_id not in ids


def test_delete_board_not_owned_returns_404(client, auth, auth2):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]

    response = client.delete(f"/api/boards/{board_id}", headers=auth2["headers"])
    assert response.status_code == 404


def test_get_board_data(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]

    response = client.get(f"/api/boards/{board_id}", headers=auth["headers"])
    assert response.status_code == 200
    data = response.json()
    assert len(data["columns"]) == 5
    assert len(data["cards"]) == 8


def test_get_board_data_not_owned_returns_404(client, auth, auth2):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]

    response = client.get(f"/api/boards/{board_id}", headers=auth2["headers"])
    assert response.status_code == 404


def test_put_board_data_persists(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]

    board = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()
    updated = deepcopy(board)
    new_card = {"id": "card-new", "title": "Fresh card", "details": "New"}
    updated["cards"][new_card["id"]] = new_card
    updated["columns"][0]["cardIds"].append(new_card["id"])

    response = client.put(
        f"/api/boards/{board_id}",
        headers=auth["headers"],
        json=updated,
    )
    assert response.status_code == 200
    assert "card-new" in response.json()["cards"]

    refreshed = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()
    assert "card-new" in refreshed["cards"]


def test_boards_are_isolated_between_users(client, auth, auth2):
    alice_boards = client.get("/api/boards", headers=auth["headers"]).json()
    bob_boards = client.get("/api/boards", headers=auth2["headers"]).json()

    alice_board_id = alice_boards[0]["id"]
    bob_board_id = bob_boards[0]["id"]

    # Alice modifies her board
    alice_board = client.get(f"/api/boards/{alice_board_id}", headers=auth["headers"]).json()
    updated = deepcopy(alice_board)
    updated["cards"]["alice-only"] = {"id": "alice-only", "title": "Alice card", "details": "x"}
    updated["columns"][0]["cardIds"].append("alice-only")
    client.put(f"/api/boards/{alice_board_id}", headers=auth["headers"], json=updated)

    # Bob's board should not have alice's card
    bob_board = client.get(f"/api/boards/{bob_board_id}", headers=auth2["headers"]).json()
    assert "alice-only" not in bob_board["cards"]


def test_multiple_boards_have_independent_data(client, auth):
    # Create a second board
    board2_resp = client.post(
        "/api/boards", headers=auth["headers"], json={"title": "Board 2"}
    )
    board2_id = board2_resp.json()["id"]

    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board1_id = next(b["id"] for b in boards if b["id"] != board2_id)

    # Add a card to board 1
    board1 = client.get(f"/api/boards/{board1_id}", headers=auth["headers"]).json()
    board1["cards"]["b1-card"] = {"id": "b1-card", "title": "Board 1 only", "details": "x"}
    board1["columns"][0]["cardIds"].append("b1-card")
    client.put(f"/api/boards/{board1_id}", headers=auth["headers"], json=board1)

    # Board 2 should not have that card
    board2 = client.get(f"/api/boards/{board2_id}", headers=auth["headers"]).json()
    assert "b1-card" not in board2["cards"]


def test_default_board_cards_have_priority(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]
    board = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()

    for card in board["cards"].values():
        assert "priority" in card
        assert card["priority"] in ("low", "medium", "high")


def test_card_priority_persists(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]
    board = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()

    # Add a high-priority card
    board["cards"]["priority-card"] = {
        "id": "priority-card",
        "title": "Urgent task",
        "details": "Must be done now",
        "priority": "high",
    }
    board["columns"][0]["cardIds"].append("priority-card")
    client.put(f"/api/boards/{board_id}", headers=auth["headers"], json=board)

    refreshed = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()
    assert refreshed["cards"]["priority-card"]["priority"] == "high"


def test_card_priority_defaults_to_medium(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]
    board = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()

    # Add a card without explicit priority
    board["cards"]["no-priority-card"] = {
        "id": "no-priority-card",
        "title": "Normal task",
        "details": "No priority set",
    }
    board["columns"][0]["cardIds"].append("no-priority-card")
    client.put(f"/api/boards/{board_id}", headers=auth["headers"], json=board)

    refreshed = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()
    assert refreshed["cards"]["no-priority-card"]["priority"] == "medium"


def test_card_priority_validation(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]
    board = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()

    board["cards"]["bad-priority"] = {
        "id": "bad-priority",
        "title": "Bad",
        "details": "x",
        "priority": "urgent",  # invalid value
    }
    board["columns"][0]["cardIds"].append("bad-priority")
    response = client.put(f"/api/boards/{board_id}", headers=auth["headers"], json=board)
    assert response.status_code == 422


def test_card_due_date_persists(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]
    board = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()

    board["cards"]["due-card"] = {
        "id": "due-card",
        "title": "Deadline task",
        "details": "Must finish by date",
        "due_date": "2026-04-01",
    }
    board["columns"][0]["cardIds"].append("due-card")
    client.put(f"/api/boards/{board_id}", headers=auth["headers"], json=board)

    refreshed = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()
    assert refreshed["cards"]["due-card"]["due_date"] == "2026-04-01"


def test_card_due_date_defaults_to_none(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]
    board = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()

    first_card_id = list(board["cards"].keys())[0]
    assert board["cards"][first_card_id]["due_date"] is None


def test_card_due_date_can_be_cleared(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]
    board = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()

    board["cards"]["due-clear"] = {
        "id": "due-clear",
        "title": "Task with date",
        "details": "Has a due date",
        "due_date": "2026-03-20",
    }
    board["columns"][0]["cardIds"].append("due-clear")
    client.put(f"/api/boards/{board_id}", headers=auth["headers"], json=board)

    # Clear the due date
    board2 = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()
    board2["cards"]["due-clear"]["due_date"] = None
    client.put(f"/api/boards/{board_id}", headers=auth["headers"], json=board2)

    refreshed = client.get(f"/api/boards/{board_id}", headers=auth["headers"]).json()
    assert refreshed["cards"]["due-clear"]["due_date"] is None
