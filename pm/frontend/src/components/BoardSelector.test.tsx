import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { BoardSelector } from "@/components/BoardSelector";

const selectorProps = {
  token: "test-token",
  username: "user",
  onLogout: vi.fn(),
};

describe("BoardSelector", () => {
  it("renders the board list", async () => {
    render(<BoardSelector {...selectorProps} />);
    expect(await screen.findByTestId("boards-list")).toBeInTheDocument();
    expect(await screen.findByText("My First Board")).toBeInTheDocument();
  });

  it("shows the username", async () => {
    render(<BoardSelector {...selectorProps} />);
    expect(await screen.findByText("user")).toBeInTheDocument();
  });

  it("calls onLogout when logout button clicked", async () => {
    const onLogout = vi.fn();
    render(<BoardSelector {...selectorProps} onLogout={onLogout} />);
    await screen.findByTestId("logout-button");
    await userEvent.click(screen.getByTestId("logout-button"));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("creates a new board", async () => {
    render(<BoardSelector {...selectorProps} />);
    await screen.findByTestId("boards-list");

    await userEvent.click(screen.getByTestId("new-board-button"));
    await userEvent.type(screen.getByTestId("new-board-input"), "Sprint 2");
    await userEvent.click(screen.getByTestId("create-board-submit"));

    await waitFor(() => {
      expect(screen.getByText("Sprint 2")).toBeInTheDocument();
    });
  });

  it("opens a board when clicked", async () => {
    render(<BoardSelector {...selectorProps} />);
    await screen.findByTestId("boards-list");

    const openBtn = await screen.findByTestId("open-board-board-1");
    await userEvent.click(openBtn);

    // Should now show the KanbanBoard with back button
    expect(await screen.findByTestId("back-button")).toBeInTheDocument();
  });

  it("navigates back from board to selector", async () => {
    render(<BoardSelector {...selectorProps} />);
    await screen.findByTestId("boards-list");

    const openBtn = await screen.findByTestId("open-board-board-1");
    await userEvent.click(openBtn);
    await screen.findByTestId("back-button");

    await userEvent.click(screen.getByTestId("back-button"));
    expect(await screen.findByTestId("boards-list")).toBeInTheDocument();
  });
});
