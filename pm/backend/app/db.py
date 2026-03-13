from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from uuid import uuid4

DB_ENV_VAR = "DATABASE_PATH"
DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "app.db")

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_columns_board ON columns(board_id);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  column_id TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(column_id) REFERENCES columns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_id);
"""

DEFAULT_BOARD = {
    "columns": [
        {"id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"]},
        {"id": "col-discovery", "title": "Discovery", "cardIds": ["card-3"]},
        {
            "id": "col-progress",
            "title": "In Progress",
            "cardIds": ["card-4", "card-5"],
        },
        {"id": "col-review", "title": "Review", "cardIds": ["card-6"]},
        {"id": "col-done", "title": "Done", "cardIds": ["card-7", "card-8"]},
    ],
    "cards": {
        "card-1": {
            "id": "card-1",
            "title": "Align roadmap themes",
            "details": "Draft quarterly themes with impact statements and metrics.",
        },
        "card-2": {
            "id": "card-2",
            "title": "Gather customer signals",
            "details": "Review support tags, sales notes, and churn feedback.",
        },
        "card-3": {
            "id": "card-3",
            "title": "Prototype analytics view",
            "details": "Sketch initial dashboard layout and key drill-downs.",
        },
        "card-4": {
            "id": "card-4",
            "title": "Refine status language",
            "details": "Standardize column labels and tone across the board.",
        },
        "card-5": {
            "id": "card-5",
            "title": "Design card layout",
            "details": "Add hierarchy and spacing for scanning dense lists.",
        },
        "card-6": {
            "id": "card-6",
            "title": "QA micro-interactions",
            "details": "Verify hover, focus, and loading states.",
        },
        "card-7": {
            "id": "card-7",
            "title": "Ship marketing page",
            "details": "Final copy approved and asset pack delivered.",
        },
        "card-8": {
            "id": "card-8",
            "title": "Close onboarding sprint",
            "details": "Document release notes and share internally.",
        },
    },
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_db_path() -> str:
    return os.getenv(DB_ENV_VAR, DEFAULT_DB_PATH)


def connect() -> sqlite3.Connection:
    db_path = get_db_path()
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA_SQL)


def get_or_create_user(conn: sqlite3.Connection, user_id: str) -> str:
    row = conn.execute(
        "SELECT id FROM users WHERE username = ?",
        (user_id,),
    ).fetchone()
    if row:
        return row["id"]

    created_at = utc_now()
    conn.execute(
        "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
        (user_id, user_id, created_at),
    )
    return user_id


def create_board(conn: sqlite3.Connection, user_id: str, title: str) -> str:
    board_id = uuid4().hex
    now = utc_now()
    conn.execute(
        "INSERT INTO boards (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (board_id, user_id, title, now, now),
    )
    return board_id


def build_default_board(board_id: str) -> dict:
    column_id_map = {
        column["id"]: f"{board_id}:{column['id']}"
        for column in DEFAULT_BOARD["columns"]
    }
    card_id_map = {card_id: f"{board_id}:{card_id}" for card_id in DEFAULT_BOARD["cards"]}

    columns = []
    for column in DEFAULT_BOARD["columns"]:
        columns.append(
            {
                "id": column_id_map[column["id"]],
                "title": column["title"],
                "cardIds": [card_id_map[card_id] for card_id in column["cardIds"]],
            }
        )

    cards = {}
    for card_id, card in DEFAULT_BOARD["cards"].items():
        new_id = card_id_map[card_id]
        cards[new_id] = {
            "id": new_id,
            "title": card["title"],
            "details": card["details"],
        }

    return {"columns": columns, "cards": cards}


def get_or_create_board(conn: sqlite3.Connection, user_id: str) -> str:
    row = conn.execute(
        "SELECT id FROM boards WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    if row:
        return row["id"]

    board_id = create_board(conn, user_id, "Kanban Board")
    save_board(conn, board_id, build_default_board(board_id))
    return board_id


def load_board(conn: sqlite3.Connection, board_id: str) -> dict:
    columns_rows = conn.execute(
        "SELECT id, title FROM columns WHERE board_id = ? ORDER BY position",
        (board_id,),
    ).fetchall()

    board = {"columns": [], "cards": {}}
    for column_row in columns_rows:
        column_id = column_row["id"]
        card_rows = conn.execute(
            "SELECT id, title, details FROM cards WHERE column_id = ? ORDER BY position",
            (column_id,),
        ).fetchall()

        card_ids = []
        for card_row in card_rows:
            card_id = card_row["id"]
            card_ids.append(card_id)
            board["cards"][card_id] = {
                "id": card_id,
                "title": card_row["title"],
                "details": card_row["details"],
            }

        board["columns"].append(
            {"id": column_id, "title": column_row["title"], "cardIds": card_ids}
        )

    return board


def save_board(conn: sqlite3.Connection, board_id: str, board: dict) -> None:
    conn.execute(
        "DELETE FROM cards WHERE column_id IN (SELECT id FROM columns WHERE board_id = ?)",
        (board_id,),
    )
    conn.execute(
        "DELETE FROM columns WHERE board_id = ?",
        (board_id,),
    )

    now = utc_now()
    for column_index, column in enumerate(board["columns"]):
        conn.execute(
            "INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)",
            (column["id"], board_id, column["title"], column_index),
        )
        for card_index, card_id in enumerate(column["cardIds"]):
            card = board["cards"][card_id]
            conn.execute(
                "INSERT INTO cards (id, column_id, title, details, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    card["id"],
                    column["id"],
                    card["title"],
                    card["details"],
                    card_index,
                    now,
                    now,
                ),
            )

    conn.execute(
        "UPDATE boards SET updated_at = ? WHERE id = ?",
        (now, board_id),
    )
