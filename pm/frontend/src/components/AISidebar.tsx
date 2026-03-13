"use client";

import { useMemo, useState } from "react";
import { createId, type BoardData } from "@/lib/kanban";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  applied?: boolean;
};

type AIChatResponse = {
  message: string;
  board?: BoardData | null;
  applied: boolean;
};

type AISidebarProps = {
  userId: string;
  board: BoardData;
  onBoardUpdate: (board: BoardData) => void;
};

const starterPrompts = [
  "Add a high-priority QA card to Review.",
  "Move “Gather customer signals” to Discovery.",
  "Rename the Backlog column to Intake.",
];

const initialMessages: ChatMessage[] = [
  {
    id: createId("ai"),
    role: "assistant",
    content:
      "Tell me how you want to change the board. I can add, move, or edit cards.",
  },
];

export const AISidebar = ({ userId, board, onBoardUpdate }: AISidebarProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const history = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  const buildErrorMessage = (detail: string) => {
    const normalized = detail.toLowerCase();
    if (normalized.includes("insufficient credits")) {
      return "The AI account has no credits. Add OpenRouter credits and try again.";
    }
    return detail;
  };

  const handleSend = async (prompt?: string) => {
    const question = (prompt ?? input).trim();
    if (!question || isSending) {
      return;
    }

    setErrorMessage(null);
    setInput("");
    const userMessage: ChatMessage = {
      id: createId("ai"),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await fetch(
        `/api/ai/board?user_id=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            history,
          }),
        }
      );

      if (!response.ok) {
        let detail = `AI request failed (${response.status})`;
        try {
          const data = (await response.json()) as { detail?: string };
          if (data.detail) {
            detail = buildErrorMessage(data.detail);
          }
        } catch {
          // ignore JSON parsing failures
        }
        throw new Error(detail);
      }

      const payload = (await response.json()) as AIChatResponse;
      const assistantMessage: ChatMessage = {
        id: createId("ai"),
        role: "assistant",
        content: payload.message,
        applied: payload.applied,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (payload.board) {
        onBoardUpdate(payload.board);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "AI is unavailable right now. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside
      className="flex h-full flex-col rounded-[32px] border border-[var(--stroke)] bg-white/90 shadow-[var(--shadow)] backdrop-blur"
      data-testid="ai-sidebar"
    >
      <header className="rounded-[28px] border border-transparent bg-[linear-gradient(135deg,_rgba(32,157,215,0.16),_rgba(236,173,10,0.12)_50%,_rgba(117,57,145,0.12))] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
          AI Copilot
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--navy-dark)]">
          Board assistant
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--gray-text)]">
          Ask for edits, moves, or new cards. I will update the board and summarize
          what changed.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-6 py-5">
        <div className="flex flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void handleSend(prompt)}
              className="rounded-full border border-[var(--stroke)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary-blue)] transition hover:border-[var(--primary-blue)]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[80%] rounded-2xl bg-[var(--navy-dark)] px-4 py-3 text-sm text-white shadow"
                  : "mr-auto max-w-[80%] rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm text-[var(--navy-dark)] shadow"
              }
            >
              <p>{message.content}</p>
              {message.applied ? (
                <span className="mt-2 inline-flex rounded-full border border-[rgba(32,157,215,0.35)] bg-[rgba(32,157,215,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--primary-blue)]">
                  Board updated
                </span>
              ) : null}
            </div>
          ))}
          {isSending ? (
            <div className="mr-auto max-w-[80%] rounded-2xl border border-dashed border-[var(--stroke)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
              Thinking…
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-2xl border border-[rgba(117,57,145,0.35)] bg-[rgba(117,57,145,0.08)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--secondary-purple)]">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[var(--stroke)] bg-white p-3">
          <label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
            Your request
          </label>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask the AI to update your board…"
            className="mt-2 h-20 w-full resize-none rounded-xl border border-transparent bg-[var(--surface)] px-3 py-2 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
            data-testid="ai-input"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
              {board.cards ? Object.keys(board.cards).length : 0} cards in board
            </span>
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={isSending}
              className="rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="ai-send"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
