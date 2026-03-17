import { render, screen } from "@testing-library/react";
import { BoardStats } from "@/components/BoardStats";
import type { BoardData } from "@/lib/kanban";

const makeBoard = (): BoardData => ({
  columns: [
    { id: "col-1", title: "To Do", cardIds: ["c1", "c2"] },
    { id: "col-2", title: "Done", cardIds: ["c3"] },
  ],
  cards: {
    c1: { id: "c1", title: "Task A", details: "", priority: "high", due_date: "2020-01-01" },
    c2: { id: "c2", title: "Task B", details: "", priority: "medium", due_date: null },
    c3: { id: "c3", title: "Task C", details: "", priority: "low", due_date: null },
  },
});

describe("BoardStats", () => {
  it("shows total card count", () => {
    render(<BoardStats board={makeBoard()} />);
    const stat = screen.getByTestId("stat-total");
    expect(stat).toHaveTextContent("3");
  });

  it("shows done percentage based on last column", () => {
    render(<BoardStats board={makeBoard()} />);
    // 1 of 3 cards in last column = 33%
    const stat = screen.getByTestId("stat-done");
    expect(stat).toHaveTextContent("33%");
  });

  it("shows high priority count", () => {
    render(<BoardStats board={makeBoard()} />);
    const stat = screen.getByTestId("stat-high-priority");
    expect(stat).toHaveTextContent("1");
  });

  it("shows overdue count", () => {
    render(<BoardStats board={makeBoard()} />);
    // c1 has due_date in 2020 — overdue
    const stat = screen.getByTestId("stat-overdue");
    expect(stat).toHaveTextContent("1");
  });

  it("shows 0% done when board has no cards", () => {
    const empty: BoardData = {
      columns: [{ id: "col-1", title: "To Do", cardIds: [] }],
      cards: {},
    };
    render(<BoardStats board={empty} />);
    expect(screen.getByTestId("stat-done")).toHaveTextContent("0%");
  });
});
