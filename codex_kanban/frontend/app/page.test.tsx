import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

describe("Kanban board", () => {
  it("renders five columns", () => {
    render(<Home />);

    const columnNames = ["Backlog", "Discovery", "Design", "Build", "Review"];

    columnNames.forEach((name) => {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    });
  });

  it("adds and deletes a card", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const backlog = screen.getByRole("region", { name: "Backlog" });

    await user.click(within(backlog).getByRole("button", { name: "New card" }));

    await user.type(
      within(backlog).getByPlaceholderText("Card title"),
      "Draft investor update"
    );
    await user.type(
      within(backlog).getByPlaceholderText("Details (optional)"),
      "Summarize roadmap decisions and risks."
    );

    await user.click(within(backlog).getByRole("button", { name: "Add card" }));

    expect(within(backlog).getByText("Draft investor update")).toBeInTheDocument();
    expect(within(backlog).getByText("3 cards")).toBeInTheDocument();

    const cardHeading = within(backlog).getByText("Map feature scope");
    const card = cardHeading.closest("article");
    expect(card).not.toBeNull();

    await user.click(
      within(card as HTMLElement).getByRole("button", { name: "Delete card" })
    );

    expect(
      within(backlog).queryByText("Map feature scope")
    ).not.toBeInTheDocument();
  });

  it("renames a column", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const discovery = screen.getByRole("region", { name: "Discovery" });
    const input = within(discovery).getByLabelText("Rename column");

    await user.clear(input);
    await user.type(input, "Planning");

    expect(screen.getByRole("region", { name: "Planning" })).toBeInTheDocument();
  });
});
