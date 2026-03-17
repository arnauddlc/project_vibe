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

  it("changes password successfully", async () => {
    render(<BoardSelector {...selectorProps} />);
    await screen.findByTestId("boards-list");

    await userEvent.click(screen.getByTestId("change-password-button"));
    expect(screen.getByTestId("password-form")).toBeInTheDocument();

    await userEvent.type(screen.getByTestId("current-password-input"), "password");
    await userEvent.type(screen.getByTestId("new-password-input"), "newpass99");
    await userEvent.click(screen.getByTestId("change-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("password-success")).toBeInTheDocument();
    });
  });

  it("shows error when current password is wrong", async () => {
    render(<BoardSelector {...selectorProps} />);
    await screen.findByTestId("boards-list");

    await userEvent.click(screen.getByTestId("change-password-button"));
    await userEvent.type(screen.getByTestId("current-password-input"), "wrongpass");
    await userEvent.type(screen.getByTestId("new-password-input"), "newpass99");
    await userEvent.click(screen.getByTestId("change-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("password-error")).toBeInTheDocument();
    });
  });

  it("edits and saves board description", async () => {
    render(<BoardSelector {...selectorProps} />);
    await screen.findByTestId("boards-list");

    await userEvent.click(screen.getByTestId("edit-description-board-1"));
    const input = screen.getByTestId("description-input-board-1");
    await userEvent.clear(input);
    await userEvent.type(input, "Q2 features board");
    await userEvent.click(screen.getByTestId("save-description-board-1"));

    await waitFor(() => {
      expect(screen.getByTestId("description-board-1")).toHaveTextContent("Q2 features board");
    });
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
