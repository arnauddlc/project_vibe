from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

from app.db import (
    connect,
    get_or_create_board,
    get_or_create_user,
    init_db,
    load_board,
    save_board,
)
from app.schemas import BoardData

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI()


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


def validate_board(board: BoardData) -> None:
    missing = [
        card_id
        for column in board.columns
        for card_id in column.cardIds
        if card_id not in board.cards
    ]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing cards for ids: {', '.join(missing)}",
        )


@app.get("/api/board", response_model=BoardData)
def get_board(user_id: str = Query(..., min_length=1)) -> BoardData:
    with connect() as conn:
        get_or_create_user(conn, user_id)
        board_id = get_or_create_board(conn, user_id)
        board = load_board(conn, board_id)
    return BoardData(**board)


@app.put("/api/board", response_model=BoardData)
def put_board(
    board: BoardData, user_id: str = Query(..., min_length=1)
) -> BoardData:
    validate_board(board)
    with connect() as conn:
        get_or_create_user(conn, user_id)
        board_id = get_or_create_board(conn, user_id)
        save_board(conn, board_id, board.model_dump())
        updated = load_board(conn, board_id)
    return BoardData(**updated)


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
