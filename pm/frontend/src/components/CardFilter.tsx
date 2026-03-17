"use client";

import type { Priority } from "@/lib/kanban";

export type FilterState = {
  search: string;
  priority: Priority | "all";
  overdueOnly: boolean;
};

export const defaultFilter: FilterState = {
  search: "",
  priority: "all",
  overdueOnly: false,
};

type CardFilterProps = {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
};

export const CardFilter = ({ filter, onChange }: CardFilterProps) => {
  const hasActive = filter.search !== "" || filter.priority !== "all" || filter.overdueOnly;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="card-filter">
      <input
        type="search"
        value={filter.search}
        onChange={(e) => onChange({ ...filter, search: e.target.value })}
        placeholder="Search cards…"
        aria-label="Search cards"
        className="rounded-full border border-[var(--stroke)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)] w-36"
        data-testid="filter-search"
      />
      <select
        value={filter.priority}
        onChange={(e) => onChange({ ...filter, priority: e.target.value as Priority | "all" })}
        aria-label="Filter by priority"
        className="rounded-full border border-[var(--stroke)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
        data-testid="filter-priority"
      >
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <button
        type="button"
        onClick={() => onChange({ ...filter, overdueOnly: !filter.overdueOnly })}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] transition ${
          filter.overdueOnly
            ? "border-[var(--secondary-purple)] bg-[rgba(117,57,145,0.08)] text-[var(--secondary-purple)]"
            : "border-[var(--stroke)] text-[var(--gray-text)] hover:text-[var(--navy-dark)]"
        }`}
        data-testid="filter-overdue"
      >
        Overdue
      </button>
      {hasActive ? (
        <button
          type="button"
          onClick={() => onChange(defaultFilter)}
          className="rounded-full border border-[var(--stroke)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
          data-testid="filter-clear"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
};
