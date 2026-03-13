# AI Integration

## Structured Output Schema
The backend requests structured JSON from OpenRouter. The model must return an object with:
- `message` (string): the assistant reply shown to the user.
- `board` (object or null): optional full board state. Use `null` when no changes are needed.

When `board` is provided, it must match the existing `BoardData` shape:
- `columns`: list of columns with `id`, `title`, `cardIds`.
- `cards`: map of card IDs to `{id, title, details}`.

Column IDs and existing card IDs should be preserved. New cards must use unique IDs.

## Request Payload
`POST /api/ai/board` expects:
- `question`: the current user prompt.
- `history`: prior messages as `{role: "user" | "assistant", content: string}`.

The backend injects the current board JSON before sending to OpenRouter.
