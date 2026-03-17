# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an educational monorepo from Ed Donner's "Complete AI Coder Course", containing multiple self-contained projects that progressively increase in complexity. All projects share a common color scheme and coding philosophy.

## Projects

| Directory | Description | Stack |
|-----------|-------------|-------|
| `cursor_kanban/` | Kanban MVP (most complete variant) | Next.js, Zustand, dnd-kit, shadcn/ui |
| `copilot_kanban/` | Kanban MVP (minimal UI libs) | Next.js, dnd-kit |
| `codex_kanban/` | Kanban MVP (with test setup) | Next.js, Vitest, Playwright |
| `antigravity_kanban/` | Kanban MVP (Zustand + testing) | Next.js, Zustand |
| `pm/` | Full-stack Project Manager with AI | Next.js + FastAPI + SQLite + Docker |
| `site/` | Portfolio/demo site | Next.js |
| `arena-shooter/` | 3D browser game | Vanilla JS + Three.js (no build step) |

## Commands

### Kanban projects (run from `<project>/frontend/`)

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:ui      # Vitest with UI
npm run test:e2e     # Playwright E2E tests
```

### PM project

```bash
# Frontend (from pm/frontend/)
npm run dev          # Dev server (frontend only)
npm run build        # Static export to out/ (copied into backend/static via Docker)
npm run test:unit    # Vitest unit tests
npm run test:e2e     # Playwright E2E tests

# Full stack (from pm/)
./scripts/start.sh   # Docker build + run at http://localhost:8000
./scripts/stop.sh    # Stop Docker container
```

### Arena shooter

```bash
npx serve .          # Serve static files (no build step)
```

## Architecture

### Kanban MVPs

Each kanban project has a single `frontend/` directory with a Next.js App Router app. No backend, no persistence. Board state is held in component state (Zustand in some variants). Key data flow: `KanbanBoard` holds state → passes to `KanbanColumn` → `KanbanCard`. Drag-and-drop uses `@dnd-kit` with `DndContext` + `closestCorners`.

### PM Project (full-stack)

```
pm/
├── frontend/       Next.js static export — auth gate → kanban board + AI sidebar
├── backend/
│   ├── app/main.py     FastAPI routes: /api/health, /api/board, /api/ai/board
│   ├── app/db.py       SQLite helpers + schema init
│   ├── app/schemas.py  Pydantic models (BoardData, AIChatRequest/Response)
│   └── app/openrouter.py  OpenRouter API wrapper
│   └── static/         Built frontend output (copied in by Docker)
├── scripts/        start.sh / stop.sh
└── Dockerfile      Multi-stage: Node 20 (frontend build) → Python 3.12 + uv (backend)
```

**Data flow:** Frontend authenticates with hardcoded credentials (`user`/`password`) → fetches board from `GET /api/board` → persists changes via `PUT /api/board` → AI chat uses `POST /api/ai/board` which calls OpenRouter and returns board mutations.

**Docker:** The Dockerfile builds frontend to static files, copies them into `backend/static/`, then FastAPI serves them at `/` alongside the API.

**AI:** Uses OpenRouter with model `openai/gpt-oss-120b`. API key from `.env` at `pm/` root as `OPENROUTER_API_KEY`.

## Coding Standards

1. Use latest library versions with idiomatic approaches
2. Keep it simple — never over-engineer, no unnecessary defensive programming, no extra features
3. No emojis in documentation or code
4. When hitting issues, identify root cause before fixing — prove with evidence, don't guess

## Color Scheme (all projects)

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991`
- Dark Navy: `#032147`
- Gray Text: `#888888`
