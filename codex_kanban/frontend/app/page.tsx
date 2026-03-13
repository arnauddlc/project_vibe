"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const initialColumns = [
  { id: "backlog", title: "Backlog" },
  { id: "discovery", title: "Discovery" },
  { id: "design", title: "Design" },
  { id: "build", title: "Build" },
  { id: "review", title: "Review" },
];

type Column = {
  id: string;
  title: string;
};

type Card = {
  id: string;
  title: string;
  details: string;
  columnId: string;
};

type Draft = {
  title: string;
  details: string;
  open: boolean;
};

const initialCards: Record<string, Card[]> = {
  backlog: [
    {
      id: "card-1",
      title: "Map feature scope",
      details: "Align on MVP boundaries and the quality bar for launch.",
      columnId: "backlog",
    },
    {
      id: "card-2",
      title: "Capture customer quotes",
      details: "Collect 5 short quotes for the launch page hero section.",
      columnId: "backlog",
    },
  ],
  discovery: [
    {
      id: "card-3",
      title: "Audit current workflow",
      details: "Document the handoffs and common blockers across teams.",
      columnId: "discovery",
    },
    {
      id: "card-4",
      title: "Define success metrics",
      details: "Agree on adoption, cycle time, and stakeholder reporting goals.",
      columnId: "discovery",
    },
  ],
  design: [
    {
      id: "card-5",
      title: "Board layout studies",
      details: "Explore hierarchy, spacing, and card density options.",
      columnId: "design",
    },
  ],
  build: [
    {
      id: "card-6",
      title: "Implement drag-and-drop",
      details: "Smooth dragging, column drop targets, and reorder support.",
      columnId: "build",
    },
    {
      id: "card-7",
      title: "Polish interactions",
      details: "Hover states, focus rings, and motion guidelines.",
      columnId: "build",
    },
  ],
  review: [
    {
      id: "card-8",
      title: "Stakeholder walkthrough",
      details: "Capture final feedback and confirm release readiness.",
      columnId: "review",
    },
  ],
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildInitialDrafts = () =>
  initialColumns.reduce<Record<string, Draft>>((acc, column) => {
    acc[column.id] = { title: "", details: "", open: false };
    return acc;
  }, {});

export default function Home() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [cardsByColumn, setCardsByColumn] = useState<Record<string, Card[]>>(
    initialCards
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    buildInitialDrafts()
  );
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const findCard = (id: string) => {
    for (const [columnId, cards] of Object.entries(cardsByColumn)) {
      const index = cards.findIndex((card) => card.id === id);
      if (index !== -1) {
        return { columnId, index, card: cards[index] };
      }
    }
    return null;
  };

  const activeCard = activeCardId
    ? findCard(activeCardId)?.card ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeInfo = findCard(activeId);
    if (!activeInfo) return;

    const overColumn = columns.find((column) => column.id === overId);
    const overInfo = overColumn ? null : findCard(overId);
    const targetColumnId = overColumn ? overColumn.id : overInfo?.columnId;

    if (!targetColumnId) return;

    if (activeInfo.columnId === targetColumnId) {
      const currentCards = cardsByColumn[targetColumnId];
      const targetIndex = overInfo ? overInfo.index : currentCards.length - 1;

      if (activeInfo.index === targetIndex) return;

      const reordered = arrayMove(currentCards, activeInfo.index, targetIndex);
      setCardsByColumn((prev) => ({
        ...prev,
        [targetColumnId]: reordered,
      }));
      return;
    }

    setCardsByColumn((prev) => {
      const sourceCards = [...prev[activeInfo.columnId]];
      const [moving] = sourceCards.splice(activeInfo.index, 1);
      const targetCards = [...prev[targetColumnId]];
      const insertIndex = overInfo ? overInfo.index : targetCards.length;

      targetCards.splice(insertIndex, 0, {
        ...moving,
        columnId: targetColumnId,
      });

      return {
        ...prev,
        [activeInfo.columnId]: sourceCards,
        [targetColumnId]: targetCards,
      };
    });
  };

  const handleDragCancel = () => {
    setActiveCardId(null);
  };

  const handleColumnRename = (columnId: string, value: string) => {
    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId ? { ...column, title: value } : column
      )
    );
  };

  const handleDeleteCard = (cardId: string) => {
    const info = findCard(cardId);
    if (!info) return;
    setCardsByColumn((prev) => {
      const nextCards = [...prev[info.columnId]];
      nextCards.splice(info.index, 1);
      return {
        ...prev,
        [info.columnId]: nextCards,
      };
    });
  };

  const handleDraftToggle = (columnId: string, open: boolean) => {
    setDrafts((prev) => ({
      ...prev,
      [columnId]: { ...prev[columnId], open },
    }));
  };

  const handleDraftChange = (
    columnId: string,
    field: "title" | "details",
    value: string
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [columnId]: { ...prev[columnId], [field]: value },
    }));
  };

  const handleAddCard = (columnId: string) => {
    const draft = drafts[columnId];
    if (!draft.title.trim()) return;

    const newCard: Card = {
      id: createId(),
      title: draft.title.trim(),
      details: draft.details.trim(),
      columnId,
    };

    setCardsByColumn((prev) => ({
      ...prev,
      [columnId]: [...prev[columnId], newCard],
    }));

    setDrafts((prev) => ({
      ...prev,
      [columnId]: { title: "", details: "", open: false },
    }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Single Board</p>
          <h1>Orion Launch Kanban</h1>
          <p className="subtitle">
            Keep delivery focused with a clean, confident workflow.
          </p>
        </div>
        <div className="stats">
          <div>
            <span className="stat-value">
              {Object.values(cardsByColumn).flat().length}
            </span>
            <span className="stat-label">Active cards</span>
          </div>
          <div>
            <span className="stat-value">5</span>
            <span className="stat-label">Fixed columns</span>
          </div>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="board">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              cards={cardsByColumn[column.id] ?? []}
              onRename={handleColumnRename}
              onDeleteCard={handleDeleteCard}
              draft={drafts[column.id]}
              onDraftToggle={handleDraftToggle}
              onDraftChange={handleDraftChange}
              onAddCard={handleAddCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? <CardPreview card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

type ColumnProps = {
  column: Column;
  cards: Card[];
  onRename: (columnId: string, value: string) => void;
  onDeleteCard: (cardId: string) => void;
  draft: Draft;
  onDraftToggle: (columnId: string, open: boolean) => void;
  onDraftChange: (
    columnId: string,
    field: "title" | "details",
    value: string
  ) => void;
  onAddCard: (columnId: string) => void;
};

function Column({
  column,
  cards,
  onRename,
  onDeleteCard,
  draft,
  onDraftToggle,
  onDraftChange,
  onAddCard,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section
      ref={setNodeRef}
      className={`column ${isOver ? "is-over" : ""}`}
      aria-label={column.title}
      data-column-id={column.id}
    >
      <div className="column-header">
        <input
          className="column-title"
          value={column.title}
          onChange={(event) => onRename(column.id, event.target.value)}
          aria-label="Rename column"
        />
        <span className="column-count">{cards.length} cards</span>
      </div>

      <div className="column-body">
        <SortableContext
          items={cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="column-footer">
        {draft.open ? (
          <div className="card-form">
            <input
              className="card-input"
              placeholder="Card title"
              value={draft.title}
              onChange={(event) =>
                onDraftChange(column.id, "title", event.target.value)
              }
            />
            <textarea
              className="card-textarea"
              placeholder="Details (optional)"
              rows={3}
              value={draft.details}
              onChange={(event) =>
                onDraftChange(column.id, "details", event.target.value)
              }
            />
            <div className="card-form-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => onAddCard(column.id)}
              >
                Add card
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => onDraftToggle(column.id, false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => onDraftToggle(column.id, true)}
          >
            New card
          </button>
        )}
      </div>
    </section>
  );
}

type CardItemProps = {
  card: Card;
  onDelete: () => void;
};

function CardItem({ card, onDelete }: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`card ${isDragging ? "is-dragging" : ""}`}
      data-card-id={card.id}
    >
      <div className="card-top">
        <button
          className="card-delete"
          type="button"
          onClick={onDelete}
          aria-label="Delete card"
        >
          Remove
        </button>
        <span className="card-grip" {...attributes} {...listeners}>
          Drag
        </span>
      </div>
      <h3>{card.title}</h3>
      <p>{card.details || "No details yet."}</p>
    </article>
  );
}

type CardPreviewProps = {
  card: Card;
};

function CardPreview({ card }: CardPreviewProps) {
  return (
    <article className="card is-overlay" data-card-id={card.id}>
      <div className="card-top">
        <span className="card-delete">Remove</span>
        <span className="card-grip">Drag</span>
      </div>
      <h3>{card.title}</h3>
      <p>{card.details || "No details yet."}</p>
    </article>
  );
}
