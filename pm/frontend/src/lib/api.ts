export type BoardSummary = {
  id: string;
  title: string;
  description: string;
  card_count: number;
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  token: string;
  user_id: string;
  username: string;
};

const TOKEN_KEY = "pm_token";
const USER_KEY = "pm_user";

export const saveAuth = (auth: AuthResponse) => {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(USER_KEY, JSON.stringify({ id: auth.user_id, username: auth.username }));
};

export const loadAuth = (): { token: string; user: { id: string; username: string } } | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    return { token, user: JSON.parse(userRaw) as { id: string; username: string } };
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const apiFetch = async (
  url: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> => {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

export const register = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const data = (await response.json()) as { detail?: string };
    throw new Error(data.detail ?? "Registration failed");
  }
  return response.json() as Promise<AuthResponse>;
};

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const data = (await response.json()) as { detail?: string };
    throw new Error(data.detail ?? "Login failed");
  }
  return response.json() as Promise<AuthResponse>;
};

export const logout = async (token: string): Promise<void> => {
  await apiFetch("/api/auth/logout", { method: "POST" }, token);
};

export const fetchBoards = async (token: string): Promise<BoardSummary[]> => {
  const response = await apiFetch("/api/boards", {}, token);
  if (!response.ok) throw new Error("Failed to load boards");
  return response.json() as Promise<BoardSummary[]>;
};

export const createBoard = async (token: string, title: string): Promise<BoardSummary> => {
  const response = await apiFetch(
    "/api/boards",
    { method: "POST", body: JSON.stringify({ title }) },
    token
  );
  if (!response.ok) {
    const data = (await response.json()) as { detail?: string };
    throw new Error(data.detail ?? "Failed to create board");
  }
  return response.json() as Promise<BoardSummary>;
};

export const deleteBoard = async (token: string, boardId: string): Promise<void> => {
  const response = await apiFetch(`/api/boards/${boardId}`, { method: "DELETE" }, token);
  if (!response.ok) throw new Error("Failed to delete board");
};

export const renameBoard = async (
  token: string,
  boardId: string,
  title: string
): Promise<BoardSummary> => {
  const response = await apiFetch(
    `/api/boards/${boardId}`,
    { method: "PATCH", body: JSON.stringify({ title }) },
    token
  );
  if (!response.ok) throw new Error("Failed to rename board");
  return response.json() as Promise<BoardSummary>;
};

export const updateBoardDescription = async (
  token: string,
  boardId: string,
  description: string
): Promise<BoardSummary> => {
  const response = await apiFetch(
    `/api/boards/${boardId}/description`,
    { method: "PUT", body: JSON.stringify({ description }) },
    token
  );
  if (!response.ok) throw new Error("Failed to update description");
  return response.json() as Promise<BoardSummary>;
};

export const changePassword = async (
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const response = await apiFetch(
    "/api/auth/password",
    { method: "PATCH", body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) },
    token
  );
  if (!response.ok) {
    const data = (await response.json()) as { detail?: string };
    throw new Error(data.detail ?? "Failed to change password");
  }
};
