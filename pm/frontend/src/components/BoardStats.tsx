import type { BoardData } from "@/lib/kanban";

type BoardStatsProps = {
  board: BoardData;
};

const today = () => new Date().toISOString().slice(0, 10);

export const BoardStats = ({ board }: BoardStatsProps) => {
  const cards = Object.values(board.cards);
  const total = cards.length;
  const overdue = cards.filter((c) => c.due_date && c.due_date < today()).length;
  const highPriority = cards.filter((c) => c.priority === "high").length;

  const lastColumn = board.columns[board.columns.length - 1];
  const doneCount = lastColumn ? lastColumn.cardIds.length : 0;
  const donePercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const stats = [
    { label: "Cards", value: total, testId: "stat-total" },
    { label: "Done", value: `${donePercent}%`, testId: "stat-done" },
    { label: "High priority", value: highPriority, testId: "stat-high-priority" },
    { label: "Overdue", value: overdue, testId: "stat-overdue" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-1.5 rounded-full border border-[var(--stroke)] bg-[var(--surface)] px-3 py-1.5"
          data-testid={s.testId}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--gray-text)]">
            {s.label}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--navy-dark)]">
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
};
