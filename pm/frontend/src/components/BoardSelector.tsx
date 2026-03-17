"use client";

import { useCallback, useEffect, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import {
  changePassword,
  createBoard,
  deleteBoard,
  fetchBoards,
  renameBoard,
  updateBoardDescription,
  type BoardSummary,
} from "@/lib/api";

type BoardSelectorProps = {
  token: string;
  username: string;
  onLogout: () => void;
};

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const BoardSelector = ({ token, username, onLogout }: BoardSelectorProps) => {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<BoardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [descriptionValue, setDescriptionValue] = useState("");

  const loadBoards = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchBoards(token);
      setBoards(data);
    } catch {
      setErrorMessage("Unable to load boards. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  const handleCreate = async () => {
    const title = newBoardTitle.trim();
    if (!title) return;
    setIsCreating(true);
    try {
      const board = await createBoard(token, title);
      setBoards((prev) => [board, ...prev]);
      setNewBoardTitle("");
      setShowCreateForm(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create board");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (boardId: string) => {
    try {
      await deleteBoard(token, boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      setConfirmDeleteId(null);
    } catch {
      setErrorMessage("Failed to delete board");
    }
  };

  const handleRename = async (boardId: string) => {
    const title = renameValue.trim();
    if (!title) return;
    try {
      const updated = await renameBoard(token, boardId, title);
      setBoards((prev) => prev.map((b) => (b.id === boardId ? updated : b)));
      setRenamingId(null);
    } catch {
      setErrorMessage("Failed to rename board");
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setIsChangingPassword(true);
    try {
      await changePassword(token, currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess(false);
      }, 1500);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveDescription = async (boardId: string) => {
    try {
      const updated = await updateBoardDescription(token, boardId, descriptionValue);
      setBoards((prev) => prev.map((b) => (b.id === boardId ? updated : b)));
      setEditingDescriptionId(null);
    } catch {
      setErrorMessage("Failed to update description");
    }
  };

  const handleBoardBack = useCallback(async () => {
    setSelectedBoard(null);
    await loadBoards();
  }, [loadBoards]);

  if (selectedBoard) {
    return (
      <KanbanBoard
        boardId={selectedBoard.id}
        boardTitle={selectedBoard.title}
        token={token}
        onBack={() => void handleBoardBack()}
      />
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[900px] flex-col gap-6 px-6 pb-12 pt-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--stroke)] bg-white/80 px-6 py-4 shadow-[var(--shadow)] backdrop-blur">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
              Project Management
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-semibold text-[var(--navy-dark)]">
              Your Boards
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[var(--stroke)] bg-[var(--surface)] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-yellow)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]">
                {username}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPasswordForm((v) => !v);
                setPasswordError(null);
                setPasswordSuccess(false);
              }}
              className="rounded-full border border-[var(--stroke)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
              data-testid="change-password-button"
            >
              Password
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-[var(--stroke)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
              data-testid="logout-button"
            >
              Log out
            </button>
          </div>
        </header>

        {showPasswordForm ? (
          <div className="rounded-2xl border border-[var(--stroke)] bg-white/90 p-5 shadow-[var(--shadow)]" data-testid="password-form">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]">Change Password</p>
            {passwordSuccess ? (
              <p className="text-xs font-semibold text-[var(--primary-blue)]" data-testid="password-success">
                Password changed successfully.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="min-w-0 flex-1 rounded-xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                  data-testid="current-password-input"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="min-w-0 flex-1 rounded-xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  onClick={() => void handleChangePassword()}
                  disabled={isChangingPassword || !currentPassword || !newPassword}
                  className="rounded-full bg-[var(--primary-blue)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:opacity-60"
                  data-testid="change-password-submit"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
                >
                  Cancel
                </button>
                {passwordError ? (
                  <p className="w-full text-xs font-medium text-[var(--secondary-purple)]" data-testid="password-error">
                    {passwordError}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-xl border border-[rgba(117,57,145,0.35)] bg-[rgba(117,57,145,0.08)] px-4 py-3 text-sm font-medium text-[var(--secondary-purple)]">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
            Loading boards…
          </div>
        ) : (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
                {boards.length} {boards.length === 1 ? "board" : "boards"}
              </p>
              <button
                type="button"
                onClick={() => setShowCreateForm((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                data-testid="new-board-button"
              >
                <PlusIcon />
                New board
              </button>
            </div>

            {showCreateForm ? (
              <div className="mb-4 flex gap-2 rounded-2xl border border-[var(--stroke)] bg-white/90 p-4 shadow-[var(--shadow)]">
                <input
                  type="text"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreate();
                    if (e.key === "Escape") setShowCreateForm(false);
                  }}
                  placeholder="Board title"
                  className="min-w-0 flex-1 rounded-xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                  data-testid="new-board-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={isCreating || !newBoardTitle.trim()}
                  className="rounded-full bg-[var(--primary-blue)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:opacity-60"
                  data-testid="create-board-submit"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {boards.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--stroke)] bg-white/60 py-16 text-center">
                <p className="text-sm font-semibold text-[var(--navy-dark)]">No boards yet</p>
                <p className="text-xs text-[var(--gray-text)]">
                  Create your first board to get started.
                </p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2" data-testid="boards-list">
                {boards.map((board) => (
                  <li
                    key={board.id}
                    className="group relative rounded-2xl border border-[var(--stroke)] bg-white/90 p-5 shadow-[var(--shadow)] transition hover:shadow-md"
                    data-testid={`board-item-${board.id}`}
                  >
                    {renamingId === board.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void handleRename(board.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="min-w-0 flex-1 rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
                          autoFocus
                          data-testid="rename-input"
                        />
                        <button
                          type="button"
                          onClick={() => void handleRename(board.id)}
                          className="rounded-full bg-[var(--primary-blue)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingId(null)}
                          className="rounded-full border border-[var(--stroke)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {editingDescriptionId === board.id ? (
                          <div className="flex flex-col gap-2">
                            <p className="font-display text-lg font-semibold text-[var(--navy-dark)]">
                              {board.title}
                            </p>
                            <textarea
                              value={descriptionValue}
                              onChange={(e) => setDescriptionValue(e.target.value)}
                              placeholder="Add a description..."
                              rows={2}
                              className="w-full resize-none rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                              data-testid={`description-input-${board.id}`}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void handleSaveDescription(board.id)}
                                className="rounded-full bg-[var(--primary-blue)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white"
                                data-testid={`save-description-${board.id}`}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingDescriptionId(null)}
                                className="rounded-full border border-[var(--stroke)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--gray-text)]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => setSelectedBoard(board)}
                            data-testid={`open-board-${board.id}`}
                          >
                            <p className="font-display text-lg font-semibold text-[var(--navy-dark)]">
                              {board.title}
                            </p>
                            {board.description ? (
                              <p className="mt-1 text-xs text-[var(--gray-text)]" data-testid={`description-${board.id}`}>
                                {board.description}
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs text-[var(--gray-text)]">
                              {board.card_count} {board.card_count === 1 ? "card" : "cards"}
                            </p>
                          </button>
                        )}
                        <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {confirmDeleteId === board.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleDelete(board.id)}
                                className="rounded-full border border-[rgba(117,57,145,0.35)] bg-[rgba(117,57,145,0.08)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--secondary-purple)]"
                                data-testid={`confirm-delete-${board.id}`}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-full border border-[var(--stroke)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--gray-text)]"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDescriptionId(board.id);
                                  setDescriptionValue(board.description);
                                }}
                                className="rounded-full border border-[var(--stroke)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
                                aria-label={`Edit description for ${board.title}`}
                                data-testid={`edit-description-${board.id}`}
                              >
                                Desc
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingId(board.id);
                                  setRenameValue(board.title);
                                }}
                                className="rounded-full border border-[var(--stroke)] p-1.5 text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
                                aria-label={`Rename ${board.title}`}
                                data-testid={`rename-board-${board.id}`}
                              >
                                <PencilIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(board.id)}
                                className="rounded-full border border-[var(--stroke)] p-1.5 text-[var(--gray-text)] transition hover:text-[var(--secondary-purple)]"
                                aria-label={`Delete ${board.title}`}
                                data-testid={`delete-board-${board.id}`}
                              >
                                <TrashIcon />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
