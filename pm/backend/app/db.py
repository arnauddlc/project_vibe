from __future__ import annotations

import hashlib
import os
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from uuid import uuid4

DB_ENV_VAR = "DATABASE_PATH"
DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "app.db")

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_boards_user ON boards(user_id);

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
  priority TEXT NOT NULL DEFAULT 'medium',
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
            "priority": "high",
        },
        "card-2": {
            "id": "card-2",
            "title": "Gather customer signals",
            "details": "Review support tags, sales notes, and churn feedback.",
            "priority": "medium",
        },
        "card-3": {
            "id": "card-3",
            "title": "Prototype analytics view",
            "details": "Sketch initial dashboard layout and key drill-downs.",
            "priority": "medium",
        },
        "card-4": {
            "id": "card-4",
            "title": "Refine status language",
            "details": "Standardize column labels and tone across the board.",
            "priority": "low",
        },
        "card-5": {
            "id": "card-5",
            "title": "Design card layout",
            "details": "Add hierarchy and spacing for scanning dense lists.",
            "priority": "medium",
        },
        "card-6": {
            "id": "card-6",
            "title": "QA micro-interactions",
            "details": "Verify hover, focus, and loading states.",
            "priority": "high",
        },
        "card-7": {
            "id": "card-7",
            "title": "Ship marketing page",
            "details": "Final copy approved and asset pack delivered.",
            "priority": "low",
        },
        "card-8": {
            "id": "card-8",
            "title": "Close onboarding sprint",
            "details": "Document release notes and share internally.",
            "priority": "low",
        },
    },
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_db_path() -> str:
    return os.getenv(DB_ENV_VAR, DEFAULT_DB_PATH)


@contextmanager
def connect():
    db_path = get_db_path()
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _migrate_db(conn: sqlite3.Connection) -> None:
    """Apply schema migrations for existing databases."""
    # Add password_hash column to users if missing
    cols = {row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "password_hash" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")

    # Add priority column to cards if missing
    card_cols = {row[1] for row in conn.execute("PRAGMA table_info(cards)").fetchall()}
    if "priority" not in card_cols:
        conn.execute("ALTER TABLE cards ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'")

    # Create sessions table (schema already handles IF NOT EXISTS)

    # If boards table has UNIQUE constraint on user_id (old schema), migrate it
    board_sql_row = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='boards'"
    ).fetchone()
    if board_sql_row and "UNIQUE" in (board_sql_row[0] or "").upper():
        conn.execute("ALTER TABLE boards RENAME TO boards_old")
        conn.execute(
            """
            CREATE TABLE boards (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              title TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute("INSERT INTO boards SELECT * FROM boards_old")
        conn.execute("DROP TABLE boards_old")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_boards_user ON boards(user_id)")


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA_SQL)
        _migrate_db(conn)


# --- Password hashing ---

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, key_hex = stored_hash.split("$", 1)
    except ValueError:
        return False
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return secrets.compare_digest(key.hex(), key_hex)


# --- User management ---

def create_user_with_password(conn: sqlite3.Connection, username: str, password: str) -> str:
    """Create a new user with hashed password. Returns user_id. Raises ValueError if username taken."""
    existing = conn.execute(
        "SELECT id FROM users WHERE username = ?", (username,)
    ).fetchone()
    if existing:
        raise ValueError(f"Username '{username}' is already taken")

    user_id = uuid4().hex
    conn.execute(
        "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
        (user_id, username, hash_password(password), utc_now()),
    )
    return user_id


def authenticate_user(conn: sqlite3.Connection, username: str, password: str) -> str | None:
    """Validate credentials. Returns user_id if valid, None otherwise."""
    row = conn.execute(
        "SELECT id, password_hash FROM users WHERE username = ?", (username,)
    ).fetchone()
    if not row or not row["password_hash"]:
        return None
    if not verify_password(password, row["password_hash"]):
        return None
    return row["id"]


def get_username(conn: sqlite3.Connection, user_id: str) -> str | None:
    row = conn.execute("SELECT username FROM users WHERE id = ?", (user_id,)).fetchone()
    return row["username"] if row else None


# --- Session management ---

def create_session(conn: sqlite3.Connection, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO sessions (id, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, utc_now()),
    )
    return token


def get_user_from_token(conn: sqlite3.Connection, token: str) -> str | None:
    row = conn.execute(
        "SELECT user_id FROM sessions WHERE id = ?", (token,)
    ).fetchone()
    return row["user_id"] if row else None


def delete_session(conn: sqlite3.Connection, token: str) -> None:
    conn.execute("DELETE FROM sessions WHERE id = ?", (token,))


# --- Board management ---

def list_boards(conn: sqlite3.Connection, user_id: str) -> list[dict]:
    rows = conn.execute(
        """
        SELECT b.id, b.title, b.created_at, b.updated_at,
               (SELECT COUNT(*)
                FROM columns c
                JOIN cards ca ON ca.column_id = c.id
                WHERE c.board_id = b.id) AS card_count
        FROM boards b
        WHERE b.user_id = ?
        ORDER BY b.updated_at DESC
        """,
        (user_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def get_board_for_user(conn: sqlite3.Connection, board_id: str, user_id: str) -> bool:
    """Returns True if the board belongs to the user."""
    row = conn.execute(
        "SELECT id FROM boards WHERE id = ? AND user_id = ?", (board_id, user_id)
    ).fetchone()
    return row is not None


def rename_board(conn: sqlite3.Connection, board_id: str, user_id: str, title: str) -> bool:
    result = conn.execute(
        "UPDATE boards SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        (title, utc_now(), board_id, user_id),
    )
    return result.rowcount > 0


def delete_board_for_user(conn: sqlite3.Connection, board_id: str, user_id: str) -> bool:
    result = conn.execute(
        "DELETE FROM boards WHERE id = ? AND user_id = ?",
        (board_id, user_id),
    )
    return result.rowcount > 0


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


# --- Legacy helpers (kept for backward compat in tests) ---

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


def get_or_create_board(conn: sqlite3.Connection, user_id: str) -> str:
    row = conn.execute(
        "SELECT id FROM boards WHERE user_id = ? ORDER BY created_at LIMIT 1",
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
            "SELECT id, title, details, priority FROM cards WHERE column_id = ? ORDER BY position",
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
                "priority": card_row["priority"],
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
                "INSERT INTO cards (id, column_id, title, details, priority, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    card["id"],
                    column["id"],
                    card["title"],
                    card["details"],
                    card.get("priority", "medium"),
                    card_index,
                    now,
                    now,
                ),
            )

    conn.execute(
        "UPDATE boards SET updated_at = ? WHERE id = ?",
        (now, board_id),
    )
