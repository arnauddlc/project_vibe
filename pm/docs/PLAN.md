# Project Plan

**Part 1: Plan**
- [x] Review `AGENTS.md` and the existing frontend implementation.
- [x] Create `frontend/AGENTS.md` describing the current frontend codebase.
- [x] Expand this plan with detailed checklists, tests, and success criteria for each part.
- [x] Get explicit user approval before starting Part 2.

Tests:
- None (documentation-only changes).

Success criteria:
- `docs/PLAN.md` is fully detailed.
- `frontend/AGENTS.md` accurately describes the current frontend.
- User approves the plan.

**Part 2: Scaffolding**
- [x] Create `backend/` FastAPI app with basic project layout.
- [x] Add a `/api/health` (or similar) endpoint returning JSON status.
- [x] Serve a simple static “hello world” page at `/` to validate static serving.
- [x] Add Dockerfile and any required config to run frontend+backend in one container.
- [x] Use `uv` for Python dependency management inside the container.
- [x] Add start/stop scripts for Mac, Windows, and Linux in `scripts/`.

Tests:
- `docker build` succeeds.
- Container starts via scripts.
- `curl /` returns the static HTML.
- `curl /api/health` returns the expected JSON.

Success criteria:
- A single container runs locally and serves both `/` and `/api/health`.

**Part 3: Add In Frontend**
- [x] Configure Docker build to produce a static Next.js build.
- [x] Serve the built frontend from FastAPI at `/`.
- [x] Ensure the existing Kanban demo renders correctly in the container.
- [x] Add/adjust integration tests to confirm static assets are served.

Tests:
- `npm run build` (inside container build) completes.
- Frontend unit tests pass (`npm run test:unit`).
- E2E tests pass (`npm run test:e2e`) against the running container.

Success criteria:
- The Kanban demo loads at `/` from the container.
- Frontend tests are green.

**Part 4: Fake User Sign In**
- [x] Add a login screen at `/` with hardcoded credentials (`user` / `password`).
- [x] Gate the Kanban UI behind authentication.
- [x] Add logout capability.
- [x] Keep state minimal and consistent with future backend auth integration.

Tests:
- Unit tests for login UI state.
- E2E test: invalid login fails, valid login shows board, logout returns to login.

Success criteria:
- Users must log in to view the board.
- Login/logout flow works in the container.

**Part 5: Database Modeling**
- [x] Propose a SQLite schema for users, board, columns, cards, and ordering.
- [x] Save the schema proposal as JSON in `docs/`.
- [x] Document rationale and constraints in `docs/`.
- [x] Get user sign-off before implementing.

Tests:
- None (design-only).

Success criteria:
- Schema JSON and docs are complete and approved.

**Part 6: Backend**
- [x] Implement SQLite initialization (create DB if missing).
- [x] Add API routes to read/update board state per user.
- [x] Keep API surface minimal and consistent with the schema.
- [x] Add backend unit tests for all routes and DB operations.

Tests:
- Backend unit tests pass (pytest or equivalent).
- API returns correct board state for a user.

Success criteria:
- Backend can persist and mutate board data.
- Tests cover the core CRUD paths.

**Part 7: Frontend + Backend**
- [x] Replace in-memory frontend state with API-backed state.
- [x] Implement create/edit/move card flows via backend calls.
- [x] Keep UI responsive with simple loading/error handling.
- [x] Add integration and E2E tests for API-backed flows.

Tests:
- Frontend unit tests pass.
- Backend tests pass.
- E2E tests cover add/edit/move flows with persistence.

Success criteria:
- Board changes persist across refresh.
- UI remains functional with backend integration.

**Part 8: AI Connectivity**
- [x] Add backend client for OpenRouter using `OPENROUTER_API_KEY`.
- [x] Implement a simple endpoint that asks the model “2+2”.
- [x] Ensure requests use model `openai/gpt-oss-120b`.

Tests:
- [x] Unit test with mocked OpenRouter response.
- [ ] Manual smoke test of live call (when API key available).

Success criteria:
- Backend can successfully call OpenRouter and return a response.

**Part 9: Structured Outputs for Board Updates**
- [x] Define a structured response schema for AI output.
- [x] Send current board JSON + conversation history + user question.
- [x] Parse structured outputs and apply optional board updates.
- [x] Add tests for schema validation and board mutation logic.

Tests:
- [x] Unit tests for parsing/validation.
- [x] Integration test: AI response updates board state as expected.

Success criteria:
- AI responses can update the Kanban board deterministically.

**Part 10: AI Sidebar UI**
- [x] Add a sidebar chat UI to the frontend.
- [x] Wire chat to backend AI endpoint.
- [x] Apply AI-proposed board updates and refresh UI automatically.
- [x] Add E2E tests for chat + board update behavior.

Tests:
- [x] Frontend unit tests for chat components.
- [x] E2E test covering chat request and board update.

Success criteria:
- Sidebar chat works end-to-end and updates the board when instructed.
