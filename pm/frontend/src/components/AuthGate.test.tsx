import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthGate } from "@/components/AuthGate";

const fillAndSubmit = async (username: string, password: string, buttonLabel: RegExp) => {
  await userEvent.type(screen.getByLabelText(/username/i), username);
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole("button", { name: buttonLabel }));
};

describe("AuthGate", () => {
  it("renders the login form", () => {
    render(<AuthGate />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows an error for invalid credentials", async () => {
    render(<AuthGate />);
    await fillAndSubmit("wrong", "creds", /sign in/i);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("logs in with valid credentials and shows board selector", async () => {
    render(<AuthGate />);
    await fillAndSubmit("user", "password", /sign in/i);
    // BoardSelector should appear with logout button and board list
    expect(await screen.findByTestId("logout-button")).toBeInTheDocument();
    expect(await screen.findByTestId("boards-list")).toBeInTheDocument();
  });

  it("logs out and returns to login form", async () => {
    render(<AuthGate />);
    await fillAndSubmit("user", "password", /sign in/i);
    await screen.findByTestId("logout-button");
    await userEvent.click(screen.getByTestId("logout-button"));
    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
  });

  it("can switch to register mode and create a new account", async () => {
    render(<AuthGate />);
    await userEvent.click(screen.getByTestId("toggle-mode"));
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();

    await fillAndSubmit("newuser", "newpassword", /register/i);
    expect(await screen.findByTestId("logout-button")).toBeInTheDocument();
  });

  it("shows error when registering duplicate username", async () => {
    render(<AuthGate />);
    // Register "user" twice - first via login (user already exists in mock), register directly
    await userEvent.click(screen.getByTestId("toggle-mode"));
    // Mock returns 409 for duplicate
    await fillAndSubmit("user", "password", /register/i);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
