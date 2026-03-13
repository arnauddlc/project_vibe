import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from app.db import (
    connect,
    get_or_create_board,
    get_or_create_user,
    init_db,
    load_board,
    save_board,
)
from app.openrouter import MODEL, call_openrouter, call_openrouter_structured
from app.schemas import AIChatRequest, AIChatResponse, AIResponse, BoardData

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


@app.post("/api/ai/board", response_model=AIChatResponse)
def ai_board(request: AIChatRequest, user_id: str = Query(..., min_length=1)):
    with connect() as conn:
        get_or_create_user(conn, user_id)
        board_id = get_or_create_board(conn, user_id)
        board = load_board(conn, board_id)

    instructions = (
        "You are an assistant for a Kanban board. "
        "Return only JSON that matches the provided schema. "
        "If no board changes are needed, set board to null. "
        "When modifying the board, preserve existing column IDs and card IDs. "
        "Ensure column cardIds only reference cards present in the cards map."
    )
    messages = [
        {"role": "system", "content": instructions},
        {
            "role": "system",
            "content": f"Current board JSON:\\n{json.dumps(board)}",
        },
    ]
    messages.extend(message.model_dump() for message in request.history)
    messages.append({"role": "user", "content": request.question})

    schema = AIResponse.model_json_schema()
    raw_response = call_openrouter_structured(messages, schema)
    try:
        ai_response = AIResponse.model_validate(raw_response)
    except ValidationError as exc:
        raise HTTPException(
            status_code=502,
            detail="OpenRouter response failed schema validation",
        ) from exc

    applied = False
    updated_board = None
    if ai_response.board is not None:
        validate_board(ai_response.board)
        with connect() as conn:
            get_or_create_user(conn, user_id)
            board_id = get_or_create_board(conn, user_id)
            save_board(conn, board_id, ai_response.board.model_dump())
            updated_board = load_board(conn, board_id)
        applied = True

    return AIChatResponse(
        message=ai_response.message,
        board=BoardData(**updated_board) if updated_board else None,
        applied=applied,
    )


@app.get("/api/ai/test")
def ai_test():
    prompt = "What is 2+2?"
    response = call_openrouter(prompt)
    return {"model": MODEL, "prompt": prompt, "response": response}


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
