import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";
import { vi } from "vitest";

const boardProps = {
  boardId: "board-1",
  boardTitle: "Test Board",
  token: "test-token",
  onBack: vi.fn(),
};

const getFirstColumn = async () => {
  const columns = await screen.findAllByTestId(/^column-col-/);
  return columns[0];
};

describe("KanbanBoard", () => {
  it("renders five columns", async () => {
    render(<KanbanBoard {...boardProps} />);
    expect(await screen.findAllByTestId(/^column-col-/)).toHaveLength(5);
  });

  it("shows back button", async () => {
    render(<KanbanBoard {...boardProps} />);
    expect(await screen.findByTestId("back-button")).toBeInTheDocument();
  });

  it("calls onBack when back button clicked", async () => {
    const onBack = vi.fn();
    render(<KanbanBoard {...boardProps} onBack={onBack} />);
    await screen.findByTestId("back-button");
    await userEvent.click(screen.getByTestId("back-button"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("renames a column", async () => {
    render(<KanbanBoard {...boardProps} />);
    const column = await getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard {...boardProps} />);
    const column = await getFirstColumn();
    const addButton = within(column).getByRole("button", {
      name: /add a card/i,
    });
    await userEvent.click(addButton);

    const titleInput = within(column).getByPlaceholderText(/card title/i);
    await userEvent.type(titleInput, "New card");
    const detailsInput = within(column).getByPlaceholderText(/details/i);
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(within(column).getByRole("button", { name: /add card/i }));

    expect(within(column).getByText("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /delete new card/i,
    });
    await userEvent.click(deleteButton);

    expect(within(column).queryByText("New card")).not.toBeInTheDocument();
  });

  it("adds a new column", async () => {
    render(<KanbanBoard {...boardProps} />);
    await screen.findAllByTestId(/^column-col-/);
    await userEvent.click(screen.getByTestId("add-column-button"));
    expect(await screen.findAllByTestId(/^column-col-/)).toHaveLength(6);
  });

  it("shows priority badge on cards", async () => {
    render(<KanbanBoard {...boardProps} />);
    await screen.findAllByTestId(/^column-col-/);
    const priorityBadge = screen.getByTestId("priority-card-1");
    expect(priorityBadge).toBeInTheDocument();
    expect(priorityBadge).toHaveTextContent(/high|medium|low/i);
  });

  it("adds a card with selected priority", async () => {
    render(<KanbanBoard {...boardProps} />);
    const column = await getFirstColumn();
    await userEvent.click(within(column).getByRole("button", { name: /add a card/i }));

    await userEvent.type(within(column).getByPlaceholderText(/card title/i), "Priority card");
    const prioritySelect = within(column).getByRole("combobox", { name: /priority/i });
    await userEvent.selectOptions(prioritySelect, "high");

    await userEvent.click(within(column).getByRole("button", { name: /add card/i }));

    const newCard = within(column).getByText("Priority card");
    expect(newCard).toBeInTheDocument();
  });

  it("shows due date badge on cards with due dates", async () => {
    render(<KanbanBoard {...boardProps} />);
    await screen.findAllByTestId(/^column-col-/);
    // card-1 in initialData has due_date set
    const dueBadge = screen.getByTestId("due-date-card-1");
    expect(dueBadge).toBeInTheDocument();
  });

  it("opens edit form when edit button is clicked", async () => {
    render(<KanbanBoard {...boardProps} />);
    await screen.findAllByTestId(/^column-col-/);
    const editBtn = screen.getByTestId("edit-card-card-1");
    await userEvent.click(editBtn);
    expect(screen.getByTestId("edit-title-card-1")).toBeInTheDocument();
  });

  it("saves edited card title", async () => {
    render(<KanbanBoard {...boardProps} />);
    await screen.findAllByTestId(/^column-col-/);
    await userEvent.click(screen.getByTestId("edit-card-card-1"));

    const titleInput = screen.getByTestId("edit-title-card-1");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated Title");
    await userEvent.click(screen.getByTestId("save-edit-card-1"));

    expect(await screen.findByText("Updated Title")).toBeInTheDocument();
  });
});
