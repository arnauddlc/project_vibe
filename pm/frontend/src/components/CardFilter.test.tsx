import { render, screen } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { CardFilter, defaultFilter, type FilterState } from "@/components/CardFilter";
import { vi } from "vitest";

const StatefulFilter = ({ onChange }: { onChange?: (f: FilterState) => void }) => {
  const [filter, setFilter] = useState(defaultFilter);
  return (
    <CardFilter
      filter={filter}
      onChange={(f) => {
        setFilter(f);
        onChange?.(f);
      }}
    />
  );
};

describe("CardFilter", () => {
  it("renders search input, priority select, and overdue button", () => {
    render(<CardFilter filter={defaultFilter} onChange={vi.fn()} />);
    expect(screen.getByTestId("filter-search")).toBeInTheDocument();
    expect(screen.getByTestId("filter-priority")).toBeInTheDocument();
    expect(screen.getByTestId("filter-overdue")).toBeInTheDocument();
  });

  it("does not show clear button when filter is default", () => {
    render(<CardFilter filter={defaultFilter} onChange={vi.fn()} />);
    expect(screen.queryByTestId("filter-clear")).not.toBeInTheDocument();
  });

  it("shows clear button when search is active", () => {
    render(<CardFilter filter={{ ...defaultFilter, search: "foo" }} onChange={vi.fn()} />);
    expect(screen.getByTestId("filter-clear")).toBeInTheDocument();
  });

  it("updates search text", async () => {
    const onChange = vi.fn();
    render(<StatefulFilter onChange={onChange} />);
    await userEvent.type(screen.getByTestId("filter-search"), "bug");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ search: "bug" }));
  });

  it("updates priority filter", async () => {
    const onChange = vi.fn();
    render(<StatefulFilter onChange={onChange} />);
    await userEvent.selectOptions(screen.getByTestId("filter-priority"), "high");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ priority: "high" }));
  });

  it("toggles overdueOnly", async () => {
    const onChange = vi.fn();
    render(<StatefulFilter onChange={onChange} />);
    await userEvent.click(screen.getByTestId("filter-overdue"));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ overdueOnly: true }));
  });

  it("clears filter when clear is clicked", async () => {
    const onChange = vi.fn();
    render(<StatefulFilter onChange={onChange} />);
    await userEvent.type(screen.getByTestId("filter-search"), "foo");
    await userEvent.click(screen.getByTestId("filter-clear"));
    expect(onChange).toHaveBeenLastCalledWith(defaultFilter);
  });
});
