import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthGate } from "@/components/AuthGate";

const fillLoginForm = async (username: string, password: string) => {
  await userEvent.type(screen.getByLabelText(/username/i), username);
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
};

describe("AuthGate", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the login form", () => {
    render(<AuthGate />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows an error for invalid credentials", async () => {
    render(<AuthGate />);
    await fillLoginForm("wrong", "creds");
    expect(screen.getByRole("alert")).toHaveTextContent(/invalid credentials/i);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("logs in with valid credentials and logs out", async () => {
    render(<AuthGate />);
    await fillLoginForm("user", "password");

    expect(
      await screen.findByRole("heading", { name: /kanban studio/i })
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("logout-button"));
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("persists board changes across logout", async () => {
    render(<AuthGate />);
    await fillLoginForm("user", "password");

    const column = (await screen.findAllByTestId(/column-/i))[0];
    await userEvent.click(
      within(column).getByRole("button", { name: /add a card/i })
    );
    await userEvent.type(
      within(column).getByPlaceholderText(/card title/i),
      "Persistent card"
    );
    await userEvent.click(
      within(column).getByRole("button", { name: /add card/i })
    );
    expect(within(column).getByText("Persistent card")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("logout-button"));
    await fillLoginForm("user", "password");

    expect(await screen.findByText("Persistent card")).toBeInTheDocument();
  });
});
