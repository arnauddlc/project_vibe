from __future__ import annotations

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
    resp = client.post("/api/auth/register", json={"username": "alice", "password": "pass1234"})
    data = resp.json()
    return {"headers": {"Authorization": f"Bearer {data['token']}"}, "token": data["token"]}


# --- Change password tests ---

def test_change_password_success(client, auth):
    response = client.patch(
        "/api/auth/password",
        headers=auth["headers"],
        json={"current_password": "pass1234", "new_password": "newpass99"},
    )
    assert response.status_code == 204

    # Old password should no longer work
    assert client.post(
        "/api/auth/login", json={"username": "alice", "password": "pass1234"}
    ).status_code == 401

    # New password should work
    assert client.post(
        "/api/auth/login", json={"username": "alice", "password": "newpass99"}
    ).status_code == 200


def test_change_password_wrong_current_returns_400(client, auth):
    response = client.patch(
        "/api/auth/password",
        headers=auth["headers"],
        json={"current_password": "wrongpass", "new_password": "newpass99"},
    )
    assert response.status_code == 400


def test_change_password_requires_auth(client):
    response = client.patch(
        "/api/auth/password",
        json={"current_password": "pass1234", "new_password": "newpass99"},
    )
    assert response.status_code == 401


def test_change_password_validates_new_password_length(client, auth):
    response = client.patch(
        "/api/auth/password",
        headers=auth["headers"],
        json={"current_password": "pass1234", "new_password": "ab"},
    )
    assert response.status_code == 422


# --- Board description tests ---

def test_board_has_empty_description_by_default(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    assert boards[0]["description"] == ""


def test_set_board_description(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]

    response = client.put(
        f"/api/boards/{board_id}/description",
        headers=auth["headers"],
        json={"description": "This board tracks Q2 features."},
    )
    assert response.status_code == 200
    assert response.json()["description"] == "This board tracks Q2 features."


def test_board_description_persists(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]

    client.put(
        f"/api/boards/{board_id}/description",
        headers=auth["headers"],
        json={"description": "Persistent description"},
    )
    boards2 = client.get("/api/boards", headers=auth["headers"]).json()
    board = next(b for b in boards2 if b["id"] == board_id)
    assert board["description"] == "Persistent description"


def test_set_board_description_wrong_owner_returns_404(client, auth):
    bob = client.post(
        "/api/auth/register", json={"username": "bob", "password": "pass1234"}
    ).json()
    bob_headers = {"Authorization": f"Bearer {bob['token']}"}

    alice_board_id = client.get("/api/boards", headers=auth["headers"]).json()[0]["id"]

    response = client.put(
        f"/api/boards/{alice_board_id}/description",
        headers=bob_headers,
        json={"description": "Hack"},
    )
    assert response.status_code == 404


def test_board_description_can_be_cleared(client, auth):
    boards = client.get("/api/boards", headers=auth["headers"]).json()
    board_id = boards[0]["id"]

    client.put(
        f"/api/boards/{board_id}/description",
        headers=auth["headers"],
        json={"description": "Some description"},
    )
    client.put(
        f"/api/boards/{board_id}/description",
        headers=auth["headers"],
        json={"description": ""},
    )
    boards2 = client.get("/api/boards", headers=auth["headers"]).json()
    board = next(b for b in boards2 if b["id"] == board_id)
    assert board["description"] == ""
