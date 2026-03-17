"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BoardSelector } from "@/components/BoardSelector";
import { clearAuth, loadAuth, login, logout, register, saveAuth } from "@/lib/api";

type AuthState = {
  token: string;
  userId: string;
  username: string;
} | null;

export const AuthGate = () => {
  const [auth, setAuth] = useState<AuthState>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const saved = loadAuth();
    if (saved) {
      setAuth({ token: saved.token, userId: saved.user.id, username: saved.user.username });
    }
    setIsRestoring(false);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const authFn = mode === "login" ? login : register;
      const result = await authFn(username.trim(), password);
      saveAuth(result);
      setAuth({ token: result.token, userId: result.user_id, username: result.username });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await logout(auth.token).catch(() => {});
    }
    clearAuth();
    setAuth(null);
    setUsername("");
    setPassword("");
    setErrorMessage(null);
  };

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
        Loading…
      </div>
    );
  }

  if (auth) {
    return (
      <BoardSelector
        token={auth.token}
        username={auth.username}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[1100px] items-center px-6 py-16">
        <section className="w-full rounded-[32px] border border-[var(--stroke)] bg-white/90 p-10 shadow-[var(--shadow)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
            Project Management
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--navy-dark)]">
            {mode === "login" ? "Sign in to Kanban Studio" : "Create your account"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]">
            {mode === "login"
              ? "Sign in to access your boards and track your work."
              : "Register to start managing your projects with multiple boards."}
          </p>

          <form
            onSubmit={(e) => void handleSubmit(e)}
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                placeholder="your username"
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
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                placeholder={mode === "register" ? "at least 4 characters" : "your password"}
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
                disabled={isSubmitting}
                className="rounded-full bg-[var(--secondary-purple)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Please wait…" : mode === "login" ? "Sign in" : "Register"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setErrorMessage(null);
                }}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary-blue)] transition hover:underline"
                data-testid="toggle-mode"
              >
                {mode === "login" ? "Create account" : "Already have an account?"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};
