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

export const KanbanCard = ({ card, onDelete }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group rounded-2xl border border-transparent bg-white px-4 py-3 shadow-[0_12px_24px_rgba(3,33,71,0.08)]",
        "transition-all duration-150",
        isDragging && "opacity-60 shadow-[0_18px_32px_rgba(3,33,71,0.16)]"
      )}
      {...attributes}
      {...listeners}
      data-testid={`card-${card.id}`}
    >
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
          </div>
          <h4 className="font-display text-sm font-semibold leading-snug text-[var(--navy-dark)]">
            {card.title}
          </h4>
          <p className="mt-1.5 text-xs leading-5 text-[var(--gray-text)]">
            {card.details}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-0.5 flex-shrink-0 rounded-full p-1 text-[var(--gray-text)] opacity-0 transition-all duration-150 hover:bg-[var(--surface)] hover:text-[var(--navy-dark)] group-hover:opacity-100"
          aria-label={`Delete ${card.title}`}
        >
          <XIcon />
        </button>
      </div>
    </article>
  );
};
