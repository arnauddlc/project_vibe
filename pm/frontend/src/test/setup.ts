import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";
import { initialData, type BoardData } from "@/lib/kanban";
import type { BoardSummary } from "@/lib/api";

const createStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (!window.localStorage || typeof window.localStorage.getItem !== "function") {
  Object.defineProperty(window, "localStorage", {
    value: createStorage(),
    configurable: true,
  });
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// In-memory stores
const boards = new Map<string, BoardData>();
const boardMetas = new Map<string, BoardSummary>();
const sessions = new Map<string, { userId: string; username: string }>();
const users = new Map<string, { id: string; password: string }>();

let userCounter = 0;
let boardCounter = 0;

const getToken = (input: RequestInfo | URL, init?: RequestInit): string | null => {
  const headers = (init?.headers ?? {}) as Record<string, string>;
  const auth = headers["Authorization"] ?? headers["authorization"] ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
};

const getPathname = (input: RequestInfo | URL): string =>
  new URL(typeof input === "string" ? input : input.toString(), "http://localhost").pathname;

const matchBoard = (pathname: string): string | null => {
  const m = pathname.match(/^\/api\/boards\/([^/]+)$/);
  return m ? m[1] : null;
};

const matchBoardAI = (pathname: string): string | null => {
  const m = pathname.match(/^\/api\/boards\/([^/]+)\/ai$/);
  return m ? m[1] : null;
};

const makeResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

// Seed a default user and board for tests
const SEED_TOKEN = "test-token";
const SEED_USER_ID = "user-1";
const SEED_USERNAME = "user";
const SEED_BOARD_ID = "board-1";

const resetStores = () => {
  boards.clear();
  boardMetas.clear();
  sessions.clear();
  users.clear();

  sessions.set(SEED_TOKEN, { userId: SEED_USER_ID, username: SEED_USERNAME });
  users.set(SEED_USERNAME, { id: SEED_USER_ID, password: "password" });
  boards.set(SEED_BOARD_ID, clone(initialData));
  boardMetas.set(SEED_BOARD_ID, {
    id: SEED_BOARD_ID,
    title: "My First Board",
    card_count: Object.keys(initialData.cards).length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
};

beforeEach(() => {
  resetStores();
  userCounter = 1;
  boardCounter = 1;
  // Clear localStorage
  window.localStorage.clear();
});

vi.stubGlobal(
  "fetch",
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const pathname = getPathname(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const token = getToken(input, init);

    // --- Auth endpoints ---
    if (pathname === "/api/auth/register" && method === "POST") {
      const body = JSON.parse(init?.body as string) as { username: string; password: string };
      if (users.has(body.username)) {
        return makeResponse({ detail: "Username already taken" }, 409);
      }
      const userId = `user-${++userCounter}`;
      const newToken = `token-${userId}`;
      users.set(body.username, { id: userId, password: body.password });
      sessions.set(newToken, { userId, username: body.username });
      // Create default board for new user
      const boardId = `board-${++boardCounter}`;
      boards.set(boardId, clone(initialData));
      boardMetas.set(boardId, {
        id: boardId,
        title: "My First Board",
        card_count: Object.keys(initialData.cards).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      // Associate boards to user
      sessions.set(newToken, { userId, username: body.username });
      // Store userId->boards mapping via a user-boards key
      const userBoardsKey = `user-boards-${userId}`;
      const existing = JSON.parse(localStorage.getItem(userBoardsKey) ?? "[]") as string[];
      localStorage.setItem(userBoardsKey, JSON.stringify([...existing, boardId]));
      return makeResponse({ token: newToken, user_id: userId, username: body.username }, 201);
    }

    if (pathname === "/api/auth/login" && method === "POST") {
      const body = JSON.parse(init?.body as string) as { username: string; password: string };
      const user = users.get(body.username);
      if (!user || user.password !== body.password) {
        return makeResponse({ detail: "Invalid username or password" }, 401);
      }
      const newToken = `token-${user.id}-${Date.now()}`;
      sessions.set(newToken, { userId: user.id, username: body.username });
      return makeResponse({ token: newToken, user_id: user.id, username: body.username });
    }

    if (pathname === "/api/auth/logout" && method === "POST") {
      if (token) sessions.delete(token);
      return makeResponse(null, 204);
    }

    // --- Auth check for protected endpoints ---
    if (pathname.startsWith("/api/boards")) {
      if (!token || !sessions.has(token)) {
        return makeResponse({ detail: "Missing or invalid token" }, 401);
      }
    }

    const session = token ? sessions.get(token) : null;

    // --- Board list endpoints ---
    if (pathname === "/api/boards" && method === "GET") {
      // Return all boards for seed user (simple: return boards associated with SEED_USER_ID or registered boards)
      if (session?.userId === SEED_USER_ID) {
        const meta = boardMetas.get(SEED_BOARD_ID);
        return makeResponse(meta ? [meta] : []);
      }
      // For other users, get their boards from localStorage
      const userBoardsKey = `user-boards-${session!.userId}`;
      const boardIds = JSON.parse(localStorage.getItem(userBoardsKey) ?? "[]") as string[];
      const userBoards = boardIds
        .map((id) => boardMetas.get(id))
        .filter(Boolean) as BoardSummary[];
      return makeResponse(userBoards);
    }

    if (pathname === "/api/boards" && method === "POST") {
      const body = JSON.parse(init?.body as string) as { title: string };
      const newBoardId = `board-${++boardCounter}`;
      boards.set(newBoardId, clone(initialData));
      const meta: BoardSummary = {
        id: newBoardId,
        title: body.title,
        card_count: Object.keys(initialData.cards).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      boardMetas.set(newBoardId, meta);
      const userBoardsKey = `user-boards-${session!.userId}`;
      const existing = JSON.parse(localStorage.getItem(userBoardsKey) ?? "[]") as string[];
      localStorage.setItem(userBoardsKey, JSON.stringify([...existing, newBoardId]));
      return makeResponse(meta, 201);
    }

    // --- Individual board endpoints ---
    const boardId = matchBoard(pathname);
    if (boardId) {
      if (method === "GET") {
        const board = boards.get(boardId);
        if (!board) return makeResponse({ detail: "Board not found" }, 404);
        return makeResponse(clone(board));
      }

      if (method === "PUT" && init?.body) {
        const body = JSON.parse(init.body as string) as BoardData;
        boards.set(boardId, clone(body));
        const meta = boardMetas.get(boardId);
        if (meta) {
          boardMetas.set(boardId, {
            ...meta,
            card_count: Object.keys(body.cards).length,
            updated_at: new Date().toISOString(),
          });
        }
        return makeResponse(clone(body));
      }

      if (method === "PATCH" && init?.body) {
        const body = JSON.parse(init.body as string) as { title: string };
        const meta = boardMetas.get(boardId);
        if (!meta) return makeResponse({ detail: "Board not found" }, 404);
        const updated = { ...meta, title: body.title, updated_at: new Date().toISOString() };
        boardMetas.set(boardId, updated);
        return makeResponse(updated);
      }

      if (method === "DELETE") {
        const existed = boards.has(boardId);
        boards.delete(boardId);
        boardMetas.delete(boardId);
        return existed ? makeResponse(null, 204) : makeResponse({ detail: "Not found" }, 404);
      }
    }

    // --- AI endpoint ---
    const aiBoardId = matchBoardAI(pathname);
    if (aiBoardId && method === "POST") {
      const board = boards.get(aiBoardId);
      if (!board) return makeResponse({ detail: "Board not found" }, 404);
      const updated = clone(board);
      const cardId = "card-ai-1";
      if (!updated.cards[cardId]) {
        updated.cards[cardId] = {
          id: cardId,
          title: "AI planned follow-up",
          details: "Added via AI suggestion.",
        };
        updated.columns[0].cardIds.push(cardId);
      }
      boards.set(aiBoardId, clone(updated));
      return makeResponse({
        message: "Added a card via AI.",
        board: clone(updated),
        applied: true,
      });
    }

    return makeResponse({ detail: "Not found" }, 404);
  })
);
