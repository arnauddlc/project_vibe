import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";
import { initialData } from "@/lib/kanban";

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
const boards = new Map<string, unknown>();

const getUserId = (input: RequestInfo | URL) => {
  const url = new URL(
    typeof input === "string" ? input : input.toString(),
    "http://localhost"
  );
  return url.searchParams.get("user_id") ?? "user";
};

beforeEach(() => {
  boards.clear();
});

vi.stubGlobal(
  "fetch",
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const userId = getUserId(input);

    if (init?.method === "PUT" && init.body) {
      const body =
        typeof init.body === "string" ? JSON.parse(init.body) : init.body;
      boards.set(userId, clone(body));
      return {
        ok: true,
        json: async () => clone(body),
      } as Response;
    }

    const existing = boards.get(userId);
    const board = existing ? clone(existing) : clone(initialData);
    boards.set(userId, clone(board));
    return {
      ok: true,
      json: async () => clone(board),
    } as Response;
  })
);
