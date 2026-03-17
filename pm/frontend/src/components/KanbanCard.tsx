import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card, Priority } from "@/lib/kanban";

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-[rgba(117,57,145,0.12)] text-[var(--secondary-purple)]",
  medium: "bg-[rgba(32,157,215,0.12)] text-[var(--primary-blue)]",
  low: "bg-[rgba(136,136,136,0.12)] text-[var(--gray-text)]",
};

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
  onEdit: (cardId: string, updates: Partial<Omit<Card, "id">>) => void;
};

const XIcon = () => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
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

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

const isOverdue = (dateStr: string) => {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr < today;
};

export const KanbanCard = ({ card, onDelete, onEdit }: KanbanCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDetails, setEditDetails] = useState(card.details);
  const [editPriority, setEditPriority] = useState<Priority>(card.priority ?? "medium");
  const [editDueDate, setEditDueDate] = useState(card.due_date ?? "");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEditSave = () => {
    if (!editTitle.trim()) return;
    onEdit(card.id, {
      title: editTitle.trim(),
      details: editDetails.trim(),
      priority: editPriority,
      due_date: editDueDate || null,
    });
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditTitle(card.title);
    setEditDetails(card.details);
    setEditPriority(card.priority ?? "medium");
    setEditDueDate(card.due_date ?? "");
    setIsEditing(false);
  };

  const overdue = card.due_date ? isOverdue(card.due_date) : false;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group rounded-2xl border bg-white px-4 py-3 shadow-[0_12px_24px_rgba(3,33,71,0.08)]",
        "transition-all duration-150",
        isDragging && "opacity-60 shadow-[0_18px_32px_rgba(3,33,71,0.16)]",
        overdue ? "border-[rgba(117,57,145,0.3)]" : "border-transparent"
      )}
      {...attributes}
      {...(isEditing ? {} : listeners)}
      data-testid={`card-${card.id}`}
    >
      {isEditing ? (
        <div className="space-y-2" onPointerDown={(e) => e.stopPropagation()}>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded-lg border border-[var(--stroke)] bg-white px-2 py-1.5 text-sm font-semibold text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
            aria-label="Card title"
            data-testid={`edit-title-${card.id}`}
            autoFocus
          />
          <textarea
            value={editDetails}
            onChange={(e) => setEditDetails(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-[var(--stroke)] bg-white px-2 py-1.5 text-xs text-[var(--gray-text)] outline-none focus:border-[var(--primary-blue)]"
            aria-label="Card details"
          />
          <div className="flex gap-2">
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as Priority)}
              aria-label="Priority"
              className="flex-1 rounded-lg border border-[var(--stroke)] bg-white px-2 py-1.5 text-xs font-medium text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              aria-label="Due date"
              className="flex-1 rounded-lg border border-[var(--stroke)] bg-white px-2 py-1.5 text-xs font-medium text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
              data-testid={`edit-due-date-${card.id}`}
            />
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleEditSave}
              className="rounded-full bg-[var(--primary-blue)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white"
              data-testid={`save-edit-${card.id}`}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleEditCancel}
              className="rounded-full border border-[var(--stroke)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--gray-text)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em]",
                  PRIORITY_STYLES[card.priority ?? "medium"]
                )}
                data-testid={`priority-${card.id}`}
              >
                {card.priority ?? "medium"}
              </span>
              {card.due_date ? (
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-[0.1em]",
                    overdue
                      ? "bg-[rgba(117,57,145,0.12)] text-[var(--secondary-purple)]"
                      : "bg-[rgba(32,157,215,0.08)] text-[var(--gray-text)]"
                  )}
                  data-testid={`due-date-${card.id}`}
                >
                  {overdue ? "Overdue " : ""}{formatDate(card.due_date)}
                </span>
              ) : null}
            </div>
            <h4 className="font-display text-sm font-semibold leading-snug text-[var(--navy-dark)]">
              {card.title}
            </h4>
            <p className="mt-1.5 text-xs leading-5 text-[var(--gray-text)]">
              {card.details}
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-0.5 rounded-full p-1 text-[var(--gray-text)] transition hover:bg-[var(--surface)] hover:text-[var(--navy-dark)]"
              aria-label={`Edit ${card.title}`}
              data-testid={`edit-card-${card.id}`}
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              onClick={() => onDelete(card.id)}
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-0.5 rounded-full p-1 text-[var(--gray-text)] transition hover:bg-[var(--surface)] hover:text-[var(--navy-dark)]"
              aria-label={`Delete ${card.title}`}
            >
              <XIcon />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
