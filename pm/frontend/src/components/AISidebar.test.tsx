import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AISidebar } from "@/components/AISidebar";
import { initialData } from "@/lib/kanban";

describe("AISidebar", () => {
  it("sends a prompt and applies the board update", async () => {
    const onBoardUpdate = vi.fn();
    render(
      <AISidebar boardId="board-1" token="test-token" board={initialData} onBoardUpdate={onBoardUpdate} />
    );

    await userEvent.type(
      screen.getByPlaceholderText(/ask the ai to update your board/i),
      "Add a card"
    );
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText(/added a card via ai/i)).toBeInTheDocument();
    expect(onBoardUpdate).toHaveBeenCalled();
  });
});
