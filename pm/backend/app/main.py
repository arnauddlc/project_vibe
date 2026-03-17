import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from app.db import (
    authenticate_user,
    build_default_board,
    connect,
    create_board,
    create_session,
    create_user_with_password,
    delete_board_for_user,
    delete_session,
    get_board_for_user,
    get_or_create_board,
    get_or_create_user,
    get_user_from_token,
    get_username,
    init_db,
    list_boards,
    load_board,
    rename_board,
    save_board,
)
from app.openrouter import call_openrouter_structured
from app.schemas import (
    AIChatRequest,
    AIChatResponse,
    AIResponse,
    BoardCreate,
    BoardData,
    BoardRename,
    BoardSummary,
    TokenResponse,
    UserCreate,
    UserLogin,
)

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization[7:]
    with connect() as conn:
        user_id = get_user_from_token(conn, token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_id


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


# --- Auth endpoints ---

@app.post("/api/auth/register", response_model=TokenResponse, status_code=201)
def register(body: UserCreate) -> TokenResponse:
    try:
        with connect() as conn:
            user_id = create_user_with_password(conn, body.username, body.password)
            board_id = create_board(conn, user_id, "My First Board")
            save_board(conn, board_id, build_default_board(board_id))
            token = create_session(conn, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return TokenResponse(token=token, user_id=user_id, username=body.username)


@app.post("/api/auth/login", response_model=TokenResponse)
def login(body: UserLogin) -> TokenResponse:
    with connect() as conn:
        user_id = authenticate_user(conn, body.username, body.password)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        token = create_session(conn, user_id)
        username = get_username(conn, user_id) or body.username
    return TokenResponse(token=token, user_id=user_id, username=username)


@app.post("/api/auth/logout", status_code=204)
def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        with connect() as conn:
            delete_session(conn, token)
    return Response(status_code=204)


# --- Board management endpoints ---

@app.get("/api/boards", response_model=List[BoardSummary])
def get_boards(user_id: str = Depends(get_current_user)) -> List[BoardSummary]:
    with connect() as conn:
        boards = list_boards(conn, user_id)
    return [BoardSummary(**b) for b in boards]


@app.post("/api/boards", response_model=BoardSummary, status_code=201)
def create_new_board(body: BoardCreate, user_id: str = Depends(get_current_user)) -> BoardSummary:
    with connect() as conn:
        board_id = create_board(conn, user_id, body.title)
        save_board(conn, board_id, build_default_board(board_id))
        boards = list_boards(conn, user_id)
    board = next((b for b in boards if b["id"] == board_id), None)
    if not board:
        raise HTTPException(status_code=500, detail="Board creation failed")
    return BoardSummary(**board)


@app.delete("/api/boards/{board_id}", status_code=204)
def delete_board(board_id: str, user_id: str = Depends(get_current_user)):
    with connect() as conn:
        deleted = delete_board_for_user(conn, board_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Board not found")
    return Response(status_code=204)


@app.patch("/api/boards/{board_id}", response_model=BoardSummary)
def update_board(board_id: str, body: BoardRename, user_id: str = Depends(get_current_user)) -> BoardSummary:
    with connect() as conn:
        updated = rename_board(conn, board_id, user_id, body.title)
        if not updated:
            raise HTTPException(status_code=404, detail="Board not found")
        boards = list_boards(conn, user_id)
    board = next((b for b in boards if b["id"] == board_id), None)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return BoardSummary(**board)


@app.get("/api/boards/{board_id}", response_model=BoardData)
def get_board_data(board_id: str, user_id: str = Depends(get_current_user)) -> BoardData:
    with connect() as conn:
        if not get_board_for_user(conn, board_id, user_id):
            raise HTTPException(status_code=404, detail="Board not found")
        board = load_board(conn, board_id)
    return BoardData(**board)


@app.put("/api/boards/{board_id}", response_model=BoardData)
def put_board_data(board_id: str, board: BoardData, user_id: str = Depends(get_current_user)) -> BoardData:
    validate_board(board)
    with connect() as conn:
        if not get_board_for_user(conn, board_id, user_id):
            raise HTTPException(status_code=404, detail="Board not found")
        save_board(conn, board_id, board.model_dump())
        updated = load_board(conn, board_id)
    return BoardData(**updated)


@app.post("/api/boards/{board_id}/ai", response_model=AIChatResponse)
def ai_board(board_id: str, request: AIChatRequest, user_id: str = Depends(get_current_user)):
    with connect() as conn:
        if not get_board_for_user(conn, board_id, user_id):
            raise HTTPException(status_code=404, detail="Board not found")
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
            "content": f"Current board JSON:\n{json.dumps(board)}",
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
            if not get_board_for_user(conn, board_id, user_id):
                raise HTTPException(status_code=404, detail="Board not found")
            save_board(conn, board_id, ai_response.board.model_dump())
            updated_board = load_board(conn, board_id)
        applied = True

    return AIChatResponse(
        message=ai_response.message,
        board=BoardData(**updated_board) if updated_board else None,
        applied=applied,
    )


# --- Legacy endpoints (backward compat) ---

@app.get("/api/board", response_model=BoardData)
def get_board_legacy(user_id: str = Query(..., min_length=1)) -> BoardData:
    with connect() as conn:
        get_or_create_user(conn, user_id)
        board_id = get_or_create_board(conn, user_id)
        board = load_board(conn, board_id)
    return BoardData(**board)


@app.put("/api/board", response_model=BoardData)
def put_board_legacy(
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
def ai_board_legacy(request: AIChatRequest, user_id: str = Query(..., min_length=1)):
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
            "content": f"Current board JSON:\n{json.dumps(board)}",
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


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
