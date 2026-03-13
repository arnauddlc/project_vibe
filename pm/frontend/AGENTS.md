# Frontend Code Overview

This is a Next.js (App Router) frontend for the Kanban board. It authenticates locally and persists board changes via the backend `/api/board` endpoint.

## Stack
- Next.js 16 (App Router) with React 19.
- Tailwind CSS v4 via `@import "tailwindcss"` in `src/app/globals.css`.
- Drag and drop powered by `@dnd-kit/*`.
- Unit tests with Vitest + Testing Library.
- E2E tests with Playwright.

## Structure
- `src/app/page.tsx`: Renders the auth gate.
- `src/app/layout.tsx`: App layout and font setup.
- `src/app/globals.css`: Theme variables and base styles.
- `src/components/AuthGate.tsx`: Login UI with hardcoded credentials and logout.
- `src/components/KanbanBoard.tsx`: Top-level board state + DnD context.
- `src/components/KanbanColumn.tsx`: Column UI, rename input, droppable area.
- `src/components/KanbanCard.tsx`: Sortable card with delete action.
- `src/components/KanbanCardPreview.tsx`: Drag overlay preview.
- `src/components/NewCardForm.tsx`: Add-card form with local form state.
- `src/lib/kanban.ts`: Board data types, `initialData`, `moveCard`, `createId`.
- `src/components/KanbanBoard.test.tsx`: Unit tests for rename/add/remove.
- `tests/kanban.spec.ts`: Playwright E2E coverage for render/add/move.

## Key Behaviors
- Board state lives in `KanbanBoard` and is fetched from `/api/board` by user id.
- Board updates are persisted with `PUT /api/board`.
- Drag and drop uses `DndContext` with `closestCorners` collision detection.
- Column rename is immediate and persisted via the API.
- Adding and deleting cards updates the local board state and persists via the API.

## Commands
- `npm run dev`: local dev server.
- `npm run test:unit`: unit tests.
- `npm run test:e2e`: Playwright E2E tests.
