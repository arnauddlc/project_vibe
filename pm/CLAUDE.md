# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Full stack (from `pm/`)

```bash
./scripts/start.sh   # Docker build + run at http://localhost:8000
./scripts/stop.sh    # Stop Docker container
```

### Frontend (from `pm/frontend/`)

```bash
npm run dev          # Dev server (frontend only, no backend)
npm run build        # Static export to out/ (used by Docker)
npm run lint         # ESLint
npm run test:unit    # Vitest unit tests
npm run test:unit:watch  # Vitest in watch mode
npm run test:e2e     # Playwright E2E tests (requires running server)
npm run test:all     # Unit + E2E
```

Run a single unit test file:
```bash
npx vitest run src/components/AuthGate.test.tsx
```

### Backend (from `pm/backend/`)

```bash
pytest               # All backend tests
pytest tests/test_board_api.py  # Single test file
DATABASE_PATH=/tmp/test.db uvicorn app.main:app --reload  # Dev server
```

## Architecture

### Data flow

1. Frontend (`/`) shows `AuthGate` — hardcoded login (`user` / `password`)
2. After login, `KanbanBoard` fetches board via `GET /api/board?user_id=user`
3. All mutations go through `PUT /api/board?user_id=user` — the full `BoardData` is replaced each time (delete-all, re-insert)
4. AI sidebar sends conversation + current board to `POST /api/ai/board?user_id=user`, which calls OpenRouter and may return a mutated `BoardData`

### Board data model

`BoardData` is a denormalized JSON structure used everywhere (frontend state, API requests/responses, DB save/load):
- `columns: Column[]` — ordered list with `id`, `title`, `cardIds: string[]`
- `cards: Record<string, Card>` — map of card id to `{ id, title, details }`

The SQLite schema normalizes this into `users → boards → columns → cards`, but `save_board` deletes and re-inserts all columns/cards on every write. Column and card IDs are stable across saves and are prefixed with the board UUID at creation (e.g. `<board_id>:col-backlog`).

### Key files

| File | Role |
|------|------|
| `backend/app/main.py` | FastAPI routes: `/api/health`, `/api/board`, `/api/ai/board`; mounts static files last |
| `backend/app/db.py` | SQLite init, `connect()` context manager, `load_board` / `save_board` |
| `backend/app/schemas.py` | Pydantic models shared across routes and OpenRouter integration |
| `backend/app/openrouter.py` | `call_openrouter_structured()` — sends board JSON + conversation to OpenRouter with JSON schema enforcement |
| `frontend/src/lib/kanban.ts` | `BoardData` types, `moveCard` logic, `createId` utility |
| `frontend/src/components/KanbanBoard.tsx` | Main board component — owns board state, syncs with backend |
| `frontend/src/components/AISidebar.tsx` | Chat UI — calls `/api/ai/board` and applies returned board updates |
| `frontend/src/components/AuthGate.tsx` | Login gate wrapping the entire app |

### Docker build

Multi-stage: Node 20 builds the Next.js static export → Python 3.12 + uv installs backend deps → static files are copied to `backend/static/` → FastAPI serves them at `/`. The API routes must be registered before `app.mount("/", StaticFiles(...))` in `main.py`.

### Environment

- `OPENROUTER_API_KEY` — required in `pm/.env`, read at runtime by `openrouter.py`
- `DATABASE_PATH` — optional override for SQLite path (default: `backend/data/app.db`)

## Coding standards

- Keep it simple — no over-engineering, no unnecessary defensive programming
- No emojis in code or docs
- Identify root cause before fixing — prove with evidence, don't guess
- AI model: `openai/gpt-oss-120b` via OpenRouter

## Color scheme

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991`
- Dark Navy: `#032147`
- Gray Text: `#888888`
