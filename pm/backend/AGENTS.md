# Backend Code Overview

This backend is a minimal FastAPI service used by the Docker container. It serves the statically built Next.js frontend at `/`, exposes `/api/health`, and provides `/api/board` for reading and persisting a user's Kanban board in SQLite.

## Structure
- `app/main.py`: FastAPI app, `/api/health`, `/api/board`, and static files mounting.
- `app/db.py`: SQLite connection helpers, schema initialization, and board persistence.
- `app/schemas.py`: Pydantic models for board payloads.
- `static/`: Output directory for the statically built frontend (copied in via Docker).
- `requirements.txt`: Backend dependencies (installed via `uv` in Docker).
