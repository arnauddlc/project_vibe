"use client";

import { useState, type FormEvent } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";

const VALID_USERNAME = "user";
const VALID_PASSWORD = "password";

const initialFormState = {
  username: "",
  password: "",
};

export const AuthGate = () => {
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = formState.username.trim();
    const password = formState.password;

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setActiveUser(username);
      setErrorMessage(null);
      return;
    }

    setErrorMessage("Invalid credentials. Try user / password.");
  };

  const handleLogout = () => {
    setActiveUser(null);
    setFormState(initialFormState);
    setErrorMessage(null);
  };

  if (activeUser) {
    return (
      <div className="relative">
        <div className="absolute right-6 top-6 z-10 flex items-center gap-3 rounded-full border border-[var(--stroke)] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)] shadow-[var(--shadow)] backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
          Signed in as {activeUser}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-[var(--stroke)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
            data-testid="logout-button"
          >
            Log out
          </button>
        </div>
        <KanbanBoard userId={activeUser} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[1100px] items-center px-6 py-16">
        <section className="w-full rounded-[32px] border border-[var(--stroke)] bg-white/90 p-10 shadow-[var(--shadow)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
            Project Management MVP
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--navy-dark)]">
            Sign in to Kanban Studio
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]">
            Use the demo credentials to access the board and explore the drag and
            drop workflow.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 grid gap-4"
            data-testid="login-form"
          >
            <div className="grid gap-2">
              <label
                htmlFor="username"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                value={formState.username}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                placeholder="user"
                required
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                placeholder="password"
                required
              />
            </div>
            {errorMessage ? (
              <p
                role="alert"
                className="rounded-xl border border-[rgba(117,57,145,0.35)] bg-[rgba(117,57,145,0.08)] px-4 py-3 text-sm font-medium text-[var(--secondary-purple)]"
              >
                {errorMessage}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-[var(--secondary-purple)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
              >
                Sign in
              </button>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
                Demo only
              </span>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};
