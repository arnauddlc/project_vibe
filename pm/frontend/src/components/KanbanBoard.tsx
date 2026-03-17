"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AISidebar } from "@/components/AISidebar";
import { BoardStats } from "@/components/BoardStats";
import { CardFilter, defaultFilter, type FilterState } from "@/components/CardFilter";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { apiFetch } from "@/lib/api";
import { createId, moveCard, type BoardData, type Priority } from "@/lib/kanban";

type KanbanBoardProps = {
  boardId: string;
  boardTitle: string;
  token: string;
  onBack: () => void;
};

type BoardStatus = {
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
};

const initialStatus: BoardStatus = {
  isLoading: true,
  isSaving: false,
  errorMessage: null,
};

export const KanbanBoard = ({ boardId, boardTitle, token, onBack }: KanbanBoardProps) => {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [status, setStatus] = useState<BoardStatus>(initialStatus);
  const [filter, setFilter] = useState<FilterState>(defaultFilter);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const collisionDetection: CollisionDetection = (args) => {
    const rectCollisions = rectIntersection(args);
    return rectCollisions.length > 0 ? rectCollisions : closestCorners(args);
  };

  const cardsById = useMemo(() => board?.cards ?? {}, [board]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const matchesFilter = useMemo(() => {
    const q = filter.search.trim().toLowerCase();
    return (cardId: string) => {
      const card = cardsById[cardId];
      if (!card) return false;
      if (q && !card.title.toLowerCase().includes(q) && !card.details.toLowerCase().includes(q)) return false;
      if (filter.priority !== "all" && card.priority !== filter.priority) return false;
      if (filter.overdueOnly && (!card.due_date || card.due_date >= todayStr)) return false;
      return true;
    };
  }, [cardsById, filter, todayStr]);

  const fetchBoard = useCallback(async () => {
    setStatus((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
    try {
      const response = await apiFetch(`/api/boards/${boardId}`, {}, token);
      if (!response.ok) {
        throw new Error(`Failed to load board (${response.status})`);
      }
      const data = (await response.json()) as BoardData;
      setBoard(data);
    } catch (error) {
      console.error(error);
      setStatus((prev) => ({
        ...prev,
        errorMessage: "Unable to load the board. Please retry.",
      }));
    } finally {
      setStatus((prev) => ({ ...prev, isLoading: false }));
    }
  }, [boardId, token]);

  const persistBoard = async (nextBoard: BoardData) => {
    setStatus((prev) => ({ ...prev, isSaving: true, errorMessage: null }));
    try {
      const response = await apiFetch(
        `/api/boards/${boardId}`,
        {
          method: "PUT",
          body: JSON.stringify(nextBoard),
        },
        token
      );
      if (!response.ok) {
        throw new Error(`Failed to save board (${response.status})`);
      }
      const data = (await response.json()) as BoardData;
      setBoard(data);
    } catch (error) {
      console.error(error);
      setStatus((prev) => ({
        ...prev,
        errorMessage: "Unable to save changes. Please retry.",
      }));
    } finally {
      setStatus((prev) => ({ ...prev, isSaving: false }));
    }
  };

  const applyBoardUpdate = (updater: (current: BoardData) => BoardData) => {
    if (!board) return;
    const next = updater(board);
    setBoard(next);
    void persistBoard(next);
  };

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) {
      return;
    }

    applyBoardUpdate((prev) => ({
      ...prev,
      columns: moveCard(prev.columns, active.id as string, over.id as string),
    }));
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    applyBoardUpdate((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }));
  };

  const handleAddCard = (
    columnId: string,
    title: string,
    details: string,
    priority: Priority = "medium",
    due_date?: string | null
  ) => {
    const id = createId("card");
    applyBoardUpdate((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [id]: { id, title, details: details || "No details yet.", priority, due_date: due_date ?? null },
      },
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, id] }
          : column
      ),
    }));
  };

  const handleEditCard = (
    _columnId: string,
    cardId: string,
    updates: Partial<Omit<import("@/lib/kanban").Card, "id">>
  ) => {
    applyBoardUpdate((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardId]: { ...prev.cards[cardId], ...updates },
      },
    }));
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    applyBoardUpdate((prev) => {
      return {
        ...prev,
        cards: Object.fromEntries(
          Object.entries(prev.cards).filter(([id]) => id !== cardId)
        ),
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cardIds: column.cardIds.filter((id) => id !== cardId),
              }
            : column
        ),
      };
    });
  };

  const handleAddColumn = () => {
    const id = createId("col");
    applyBoardUpdate((prev) => ({
      ...prev,
      columns: [...prev.columns, { id, title: "New Column", cardIds: [] }],
    }));
  };

  const handleDeleteColumn = (columnId: string) => {
    applyBoardUpdate((prev) => {
      const column = prev.columns.find((c) => c.id === columnId);
      if (!column) return prev;
      const cardIdsToRemove = new Set(column.cardIds);
      return {
        ...prev,
        columns: prev.columns.filter((c) => c.id !== columnId),
        cards: Object.fromEntries(
          Object.entries(prev.cards).filter(([id]) => !cardIdsToRemove.has(id))
        ),
      };
    });
  };

  const handleAiBoardUpdate = (nextBoard: BoardData) => {
    setBoard(nextBoard);
  };

  const activeCard = activeCardId ? cardsById[activeCardId] : null;

  if (status.isLoading && !board) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
        Loading board…
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-2xl border border-[var(--stroke)] bg-white px-6 py-4 text-sm font-semibold text-[var(--navy-dark)] shadow-[var(--shadow)]">
          Unable to load the board.
          <button
            type="button"
            onClick={() => void fetchBoard()}
            className="ml-3 rounded-full border border-[var(--stroke)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary-blue)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-6 pb-12 pt-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--stroke)] bg-white/80 px-6 py-4 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-[var(--stroke)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
              data-testid="back-button"
            >
              All boards
            </button>
            <div className="hidden h-8 w-px bg-[var(--stroke)] sm:block" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
                Kanban Board
              </p>
              <h1 className="mt-0.5 font-display text-2xl font-semibold text-[var(--navy-dark)]">
                {boardTitle}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status.isSaving ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
                Saving…
              </span>
            ) : null}
            {status.errorMessage ? (
              <span className="rounded-full border border-[rgba(117,57,145,0.35)] bg-[rgba(117,57,145,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--secondary-purple)]">
                {status.errorMessage}
              </span>
            ) : null}
            <CardFilter filter={filter} onChange={setFilter} />
            <button
              type="button"
              onClick={handleAddColumn}
              className="flex items-center gap-1.5 rounded-full border border-[var(--stroke)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--primary-blue)] transition hover:border-[var(--primary-blue)]"
              data-testid="add-column-button"
            >
              + Column
            </button>
          </div>
        </header>

        <BoardStats board={board} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={collisionDetection}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <section
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${board.columns.length}, minmax(220px, 1fr))`,
                }}
              >
                {board.columns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cards={column.cardIds.map((cardId) => board.cards[cardId]).filter(Boolean)}
                    matchesFilter={matchesFilter}
                    onRename={handleRenameColumn}
                    onAddCard={handleAddCard}
                    onDeleteCard={handleDeleteCard}
                    onEditCard={handleEditCard}
                    onDeleteColumn={handleDeleteColumn}
                    canDelete={board.columns.length > 1}
                  />
                ))}
              </section>
              <DragOverlay>
                {activeCard ? (
                  <div className="w-[260px]">
                    <KanbanCardPreview card={activeCard} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
          <AISidebar
            boardId={boardId}
            token={token}
            board={board}
            onBoardUpdate={handleAiBoardUpdate}
          />
        </div>
      </main>
    </div>
  );
};
