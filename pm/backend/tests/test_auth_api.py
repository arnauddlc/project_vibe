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


def test_register_creates_user_and_token(client):
    response = client.post(
        "/api/auth/register", json={"username": "alice", "password": "secret123"}
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["username"] == "alice"
    assert "token" in payload
    assert "user_id" in payload
    assert len(payload["token"]) > 10


def test_register_creates_default_board(client):
    response = client.post(
        "/api/auth/register", json={"username": "alice", "password": "secret123"}
    )
    token = response.json()["token"]

    boards = client.get("/api/boards", headers={"Authorization": f"Bearer {token}"}).json()
    assert len(boards) == 1
    assert boards[0]["title"] == "My First Board"
    assert boards[0]["card_count"] == 8


def test_register_duplicate_username_returns_409(client):
    client.post("/api/auth/register", json={"username": "alice", "password": "pass"})
    response = client.post(
        "/api/auth/register", json={"username": "alice", "password": "other"}
    )
    assert response.status_code == 409


def test_register_validates_short_username(client):
    response = client.post(
        "/api/auth/register", json={"username": "a", "password": "pass"}
    )
    assert response.status_code == 422


def test_register_validates_short_password(client):
    response = client.post(
        "/api/auth/register", json={"username": "alice", "password": "abc"}
    )
    assert response.status_code == 422


def test_login_returns_token(client):
    client.post("/api/auth/register", json={"username": "alice", "password": "secret123"})
    response = client.post(
        "/api/auth/login", json={"username": "alice", "password": "secret123"}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["username"] == "alice"
    assert "token" in payload


def test_login_wrong_password_returns_401(client):
    client.post("/api/auth/register", json={"username": "alice", "password": "secret123"})
    response = client.post(
        "/api/auth/login", json={"username": "alice", "password": "wrongpass"}
    )
    assert response.status_code == 401


def test_login_unknown_user_returns_401(client):
    response = client.post(
        "/api/auth/login", json={"username": "nobody", "password": "pass"}
    )
    assert response.status_code == 401


def test_logout_invalidates_token(client):
    reg = client.post(
        "/api/auth/register", json={"username": "alice", "password": "secret"}
    )
    token = reg.json()["token"]
    auth = {"Authorization": f"Bearer {token}"}

    assert client.get("/api/boards", headers=auth).status_code == 200
    client.post("/api/auth/logout", headers=auth)
    assert client.get("/api/boards", headers=auth).status_code == 401


def test_protected_endpoint_without_token_returns_401(client):
    response = client.get("/api/boards")
    assert response.status_code == 401


def test_protected_endpoint_with_invalid_token_returns_401(client):
    response = client.get("/api/boards", headers={"Authorization": "Bearer bad-token"})
    assert response.status_code == 401
