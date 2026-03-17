# Comprehensive Code Review

**Project:** Arnaud de La Chaise — Personal Portfolio Website  
**Date:** 11 March 2026  
**Reviewer:** AI Code Review (Antigravity)  
**Scope:** Full codebase review of every file in the project

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Structure & Organisation](#2-project-structure--organisation)
3. [File-by-File Review](#3-file-by-file-review)
   - [3.1 `package.json`](#31-packagejson)
   - [3.2 `tsconfig.json`](#32-tsconfigjson)
   - [3.3 `next.config.ts`](#33-nextconfigts)
   - [3.4 `eslint.config.mjs`](#34-eslintconfigmjs)
   - [3.5 `.env`](#35-env)
   - [3.6 `.gitignore`](#36-gitignore)
   - [3.7 `app/layout.tsx`](#37-applayouttsx)
   - [3.8 `app/globals.css`](#38-appglobalscss)
   - [3.9 `app/page.module.css`](#39-apppagemoudalecss)
   - [3.10 `app/page.tsx`](#310-apppagetsx)
   - [3.11 `components/ChatWidget.tsx`](#311-componentschatwidgettsx)
   - [3.12 `components/SfMusic.tsx`](#312-componentssfmusictsx)
   - [3.13 `app/api/chat/route.ts`](#313-appapichatroutets)
4. [Cross-Cutting Concerns](#4-cross-cutting-concerns)
5. [Summary of All Findings](#5-summary-of-all-findings)
6. [Remedial Actions](#6-remedial-actions)

---

## 1. Executive Summary

The project is a Next.js 16 (App Router) personal portfolio website with a dark, "corporate meets edgy" aesthetic. It features a hero section, about-me cards, a career timeline, a portfolio teaser, a fun facts section, a Web Audio synthesizer button, and an AI-powered chat widget backed by OpenRouter.

**Overall Assessment:** The site works and delivers an impressive visual experience. However, the review has identified several issues ranging from a **critical security vulnerability** (exposed API key) through to architectural improvements, accessibility gaps, and code quality concerns that should be addressed before the site goes to production.

| Severity | Count |
|---|---|
| 🔴 Critical | 2 |
| 🟠 High | 5 |
| 🟡 Medium | 9 |
| 🔵 Low / Informational | 7 |

---

## 2. Project Structure & Organisation

```
site/
├── .env                          # Environment variables (API key)
├── .gitignore
├── app/
│   ├── api/chat/route.ts         # Backend API route for AI chat
│   ├── globals.css               # Global styles & design tokens
│   ├── layout.tsx                # Root layout (Server Component)
│   ├── page.module.css           # CSS Module for homepage
│   └── page.tsx                  # Homepage (Client Component)
├── components/
│   ├── ChatWidget.tsx            # AI chat floating widget
│   └── SfMusic.tsx               # Web Audio sci-fi music toggle
├── public/                       # Static assets (default Next.js SVGs)
├── package.json
├── tsconfig.json
├── next.config.ts
└── eslint.config.mjs
```

**Positive:** The project follows the standard Next.js App Router conventions. Separating reusable components into a `components/` folder is a good practice.

**Concern:** There is only a single page and two components. As the site grows, a more granular component structure (e.g., `components/ui/`, `components/sections/`) would be beneficial.

---

## 3. File-by-File Review

### 3.1 `package.json`

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  }
}
```

| Finding | Severity | Detail |
|---|---|---|
| No `engines` field | 🔵 Low | Specifying `"engines": { "node": ">=18" }` would help collaborators use the correct Node.js version. |
| No lock on devDependency versions | 🔵 Low | `@types/node: "^20"` etc. use wide caret ranges. While `package-lock.json` exists, pinning these more narrowly avoids surprise breakages. |

---

### 3.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "jsx": "react-jsx",
    "paths": { "@/*": ["./*"] }
  }
}
```

| Finding | Severity | Detail |
|---|---|---|
| Path alias `@/*` is defined but never used | 🔵 Low | All imports use relative paths (`../components/...`). Consider adopting the alias consistently (e.g., `@/components/ChatWidget`) for cleaner imports. |

---

### 3.3 `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

| Finding | Severity | Detail |
|---|---|---|
| Empty config | 🟡 Medium | Consider adding `reactStrictMode: true` for development-time error detection. Also consider enabling image optimization config or security headers once deploying. |

---

### 3.4 `eslint.config.mjs`

Standard Next.js ESLint config with core-web-vitals and TypeScript plugins. No issues found.

---

### 3.5 `.env`

```
OPENROUTER_API_KEY=#######
```

| Finding | Severity | Detail |
|---|---|---|
| **API key is committed to the codebase** | 🔴 **Critical** | Although `.gitignore` contains `.env*`, this file currently exists in the working directory. If this key has ever been committed to Git history, it is **permanently exposed**. The key must be **rotated immediately** on the OpenRouter dashboard, and Git history should be scrubbed if it was ever committed. |
| No `.env.example` file | 🟡 Medium | A `.env.example` file with placeholder values (e.g., `OPENROUTER_API_KEY=your_key_here`) should be added so collaborators know which environment variables are required, without exposing real secrets. |

---

### 3.6 `.gitignore`

Well-structured. Correctly ignores `.env*`, `node_modules`, `.next/`, etc. No issues.

---

### 3.7 `app/layout.tsx`

```tsx
export const metadata: Metadata = {
  title: 'Arnaud de La Chaise | Data & AI Strategy',
  description: 'Data & AI Strategy and Governance leader...',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-glow"></div>
        <div className="bg-pattern"></div>
        {children}
      </body>
    </html>
  );
}
```

| Finding | Severity | Detail |
|---|---|---|
| No `<meta name="viewport">` tag | 🟡 Medium | Next.js adds this automatically, but it's worth verifying. Without it, mobile rendering will be broken. |
| No Open Graph / social meta tags | 🟡 Medium | When shared on LinkedIn, X/Twitter, or Slack, the link preview will be generic. Adding `openGraph` and `twitter` metadata fields to the `metadata` export is strongly recommended for a portfolio site. |
| Google Fonts loaded via CSS `@import` | 🟠 High | Fonts are loaded in `globals.css` via `@import url(...)`. Next.js provides `next/font/google` which **self-hosts** fonts, eliminates render-blocking requests, and improves Core Web Vitals. This is the recommended approach. |
| No `<a>` skip-to-content link | 🔵 Low | For accessibility, a "Skip to main content" link should be the first child of `<body>`. |

---

### 3.8 `app/globals.css`

```css
:root {
  --bg-color: #050505;
  --text-primary: #f8f9fa;
  --accent: #4f46e5;
  --accent-glow: rgba(79, 70, 229, 0.4);
  --accent-edgy: #10b981;
  --border-color: rgba(255, 255, 255, 0.1);
  --card-bg: rgba(255, 255, 255, 0.03);
}
```

| Finding | Severity | Detail |
|---|---|---|
| Deprecated `clip: rect(...)` used in glitch animation | 🟡 Medium | The `clip` CSS property is deprecated per MDN. Replace with `clip-path: inset(...)` for long-term compatibility. |
| `scroll-behavior: smooth` on `body` | 🔵 Low | Should be on `html` rather than `body` for broader browser consistency, or use `@media (prefers-reduced-motion: no-preference)` to respect user motion preferences. |
| No `prefers-reduced-motion` media query | 🟠 High | Users who have motion sensitivity and have set "Reduce Motion" in their OS preferences will still see all animations (glitch, pulse, hover transforms). This is an **accessibility requirement** (WCAG 2.1 Level AA). |
| No responsive breakpoints defined | 🟡 Medium | No `@media` queries exist in this file. While the page uses `clamp()` for font sizes (good!), smaller screens may have layout issues with the card grid, timeline, and fixed-position elements. |

---

### 3.9 `app/page.module.css`

Well-structured CSS Module with clear naming conventions for the timeline, card grid, hero, and footer.

| Finding | Severity | Detail |
|---|---|---|
| No responsive / mobile styles | 🟠 High | There are zero `@media` queries. The timeline (with `padding-left: 5rem`) and the card grid (`minmax(300px, 1fr)`) will likely overflow or look cramped on mobile devices (< 480px). The CTA button group (`.ctaGrid`) will also overflow on small screens. |
| `.hero` has `min-height: 85vh` but no max-height safeguard | 🔵 Low | On very short landscape screens (e.g., phones rotated sideways), the hero may push content off-screen. |

---

### 3.10 `app/page.tsx`

```tsx
'use client';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  // ... renders the whole page
}
```

| Finding | Severity | Detail |
|---|---|---|
| **Entire page is a Client Component** | 🔴 **Critical (SEO / Performance)** | Wrapping the entire homepage in `'use client'` means **no content is server-rendered**. Search engines will see an empty page on first load. For a personal portfolio site, this destroys SEO. The `mounted` check (`if (!mounted) return null`) makes it even worse: the initial server HTML is literally `null`. Static content (hero, about, career, portfolio, footer) should remain Server Components. Only interactive parts (`SfMusic`, `ChatWidget`) need to be Client Components — and they already have `'use client'` in their own files. |
| All content is hardcoded in JSX | 🟡 Medium | Career history, about-me cards, and portfolio entries are all embedded directly in the component. Extracting this into a data file (`data.ts` or `content.json`) would make the component much easier to maintain. |
| `style={{ padding: '4rem 0' }}` inline overrides | 🟡 Medium | Several sections use inline `style` props to override padding. These should be CSS Module classes to keep styling consistent and maintainable. |
| No semantic `<nav>` element | 🟡 Medium | There is no navigation bar. Anchor links exist (`#career`, `#portfolio`) but are only in the CTA buttons. A proper `<nav>` with links to all sections would improve usability and accessibility. |
| Using array index as React `key` in mapped lists | 🔵 Low | Not applicable in `page.tsx` (no `.map`), but noted for consistency with `ChatWidget.tsx`. |

---

### 3.11 `components/ChatWidget.tsx`

```tsx
const sendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() || loading) return;
  // ... fetch('/api/chat', ...)
};
```

| Finding | Severity | Detail |
|---|---|---|
| Every style is inline | 🟠 High | The entire component — the button, the chat container, the header, message bubbles, input, and submit button — uses inline `style={{}}` objects. This results in ~100 lines of JSX that are mostly styles, making the logic extremely hard to read. A CSS Module file should be created. |
| Using array index as React `key` | 🟡 Medium | `messages.map((msg, i) => <div key={i} ...>)` — using the array index as a key can cause rendering bugs if messages are ever reordered or deleted. A unique ID (e.g., `crypto.randomUUID()`) assigned at message creation time would be safer. |
| No input sanitisation or length limit | 🟠 High | A user can submit arbitrarily long messages to the API. There is no `maxLength` on the input, and no trimming or validation beyond empty-string checks. This could lead to unnecessarily large (and expensive) API calls, or even abuse. |
| Conversation history grows unbounded | 🟡 Medium | The entire `messages` array is sent to the API on every request. Over a long conversation, this will exceed the LLM's context window and cause errors (or silently truncate). The history should be capped (e.g., last 20 messages) or use a sliding window. |
| No ARIA labels or roles | 🟡 Medium | The chat toggle button has no `aria-label` (screen readers will just say "button"). The chat window has no `role="dialog"` or `aria-modal`. The input has no `<label>`. |
| Missing `loading` state UX feedback | 🔵 Low | While the text "Twin is thinking..." is shown, the send button and input field remain active. Users can spam the send button. The input/button should be disabled during loading. |

---

### 3.12 `components/SfMusic.tsx`

```tsx
const togglePlay = () => {
  if (isPlaying) {
    // ... stop oscillators
  } else {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // ... create drone oscillators, LFOs, delay, filters
  }
};
```

| Finding | Severity | Detail |
|---|---|---|
| `(window as any).webkitAudioContext` uses `any` cast | 🟡 Medium | This bypasses TypeScript's type safety. A cleaner approach is to extend the `Window` interface in a `.d.ts` file. |
| Empty `catch` block: `try { osc.stop(t + 1); } catch (e) {}` | 🟠 High | Silently swallowing errors makes debugging impossible. At minimum, log the error to the console: `catch (e) { console.warn('Oscillator stop error:', e); }`. |
| Audio logic is tightly coupled to the UI | 🟡 Medium | The `togglePlay` function is ~60 lines long and mixes Web Audio graph construction with React state management. Extracting the audio engine into a custom hook (`useSciFiAudio`) or utility module would improve testability and readability. |
| No `aria-label` on the toggle button | 🟡 Medium | Screen readers will read the emoji text content ("▶ Play Epic SF Music") which is acceptable, but an explicit `aria-label="Toggle background music"` would be cleaner. |
| Potential AudioContext lifecycle issue | 🟡 Medium | If the component unmounts while audio is playing, the `useEffect` cleanup calls `audioCtxRef.current.close()`, but the `isPlaying` state is lost. If the component remounts, it starts in `isPlaying: false` but the AudioContext may already be closed. This is minor in a single-page app but could cause bugs if the component is conditionally rendered. |

---

### 3.13 `app/api/chat/route.ts`

```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    // ...
  },
  body: JSON.stringify({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: openRouterMessages,
  })
});
```

| Finding | Severity | Detail |
|---|---|---|
| No rate limiting | 🟠 High | The endpoint is completely open. A malicious user (or bot) could spam the endpoint, exhausting your OpenRouter credits or hitting provider rate limits. Consider implementing basic rate limiting (e.g., using an in-memory counter, or a library like `rate-limiter-flexible`). |
| No input validation on the server side | 🟠 High | The `message` and `history` fields from the request body are used directly without any validation. A crafted request could send an enormous payload. Validate that `message` is a string under a reasonable length (e.g., 2000 characters) and that `history` is a valid array with a bounded length. |
| Retry logic duplicates config | 🟡 Medium | The retry block (lines 41–58) duplicates almost the entire `fetch` call. This should be extracted into a helper function that accepts a model name. |
| `history.filter(...)` logic is fragile | 🟡 Medium | `history.filter((msg: any) => msg.role !== 'system').slice(1)` uses `any` type and `.slice(1)` to skip the initial greeting. This is brittle — if the greeting changes or more system messages are added, it could silently break. |
| No request timeout | 🟡 Medium | If OpenRouter is slow or hangs, the fetch will wait indefinitely. Adding `AbortController` with a timeout (e.g., 30 seconds) would prevent hanging requests. |
| `console.error` only for logging | 🔵 Low | In production, consider using a structured logging library or sending errors to a monitoring service (e.g., Sentry). |
| `HTTP-Referer` and `X-Title` headers are hardcoded to localhost | 🟡 Medium | When deployed, these should reflect the actual domain. Use `process.env.NEXT_PUBLIC_BASE_URL` or similar. |

---

## 4. Cross-Cutting Concerns

### 4.1 Accessibility (a11y)

| Issue | Files Affected | Severity |
|---|---|---|
| No `prefers-reduced-motion` support | `globals.css`, `page.module.css` | 🟠 High |
| No ARIA labels on interactive elements | `ChatWidget.tsx`, `SfMusic.tsx` | 🟡 Medium |
| No skip-to-content link | `layout.tsx` | 🔵 Low |
| No focus styles defined (relies on browser defaults) | `globals.css` | 🟡 Medium |
| Colour contrast not verified | `globals.css` | 🟡 Medium |

### 4.2 Responsive Design

| Issue | Files Affected | Severity |
|---|---|---|
| Zero `@media` queries in the entire project | `globals.css`, `page.module.css` | 🟠 High |
| Fixed-position elements (`ChatWidget`, `SfMusic`) may overlap on small screens | `ChatWidget.tsx`, `SfMusic.tsx` | 🟡 Medium |
| Timeline `.timelineItem` has `padding-left: 5rem` which will overflow on narrow viewports | `page.module.css` | 🟡 Medium |

### 4.3 Performance

| Issue | Files Affected | Severity |
|---|---|---|
| Entire page is client-rendered (no SSR) | `page.tsx` | 🔴 Critical |
| Fonts loaded via render-blocking CSS `@import` | `globals.css` | 🟠 High |
| Multiple constantly-running CSS animations (`pulse`, `glitch`) | `globals.css` | 🔵 Low |
| `backdrop-filter: blur()` used on multiple elements (GPU-intensive) | `page.module.css`, `ChatWidget.tsx` | 🔵 Low |

### 4.4 Security

| Issue | Files Affected | Severity |
|---|---|---|
| API key potentially in Git history | `.env` | 🔴 Critical |
| No rate limiting on API route | `route.ts` | 🟠 High |
| No input validation/sanitisation on API route | `route.ts` | 🟠 High |
| Chat messages rendered as raw text (safe), but no CSP headers configured | `next.config.ts`, `ChatWidget.tsx` | 🟡 Medium |

### 4.5 Testing

| Issue | Severity |
|---|---|
| **No tests exist** — no unit tests, integration tests, or E2E tests | 🟡 Medium |
| No CI/CD configuration | 🔵 Low |

### 4.6 Documentation

| Issue | Severity |
|---|---|
| `README.md` exists but is the default Next.js boilerplate | 🔵 Low |
| No `CONTRIBUTING.md` or deployment instructions | 🔵 Low |

---

## 5. Summary of All Findings

### 🔴 Critical (2)

| # | Finding | File | Remedial Action |
|---|---|---|---|
| C1 | API key exposed in `.env` (potentially committed to Git) | `.env` | Rotate key immediately. Scrub Git history if committed. Add `.env.example`. |
| C2 | Entire homepage is a Client Component — zero SSR, zero SEO | `page.tsx` | Remove `'use client'` from `page.tsx`. Extract interactive elements into a thin client wrapper. |

### 🟠 High (5)

| # | Finding | File | Remedial Action |
|---|---|---|---|
| H1 | No responsive / mobile styles at all | `page.module.css` | Add `@media` queries for breakpoints (480px, 768px, 1024px). |
| H2 | Fonts loaded via blocking CSS `@import` | `globals.css` | Migrate to `next/font/google`. |
| H3 | No `prefers-reduced-motion` support | `globals.css` | Wrap all animations/transitions in `@media (prefers-reduced-motion: no-preference)`. |
| H4 | No rate limiting or input validation on chat API | `route.ts` | Add input length validation, history size cap, and basic rate limiting. |
| H5 | All styles in `ChatWidget.tsx` are inline (~100+ lines) | `ChatWidget.tsx` | Extract to `ChatWidget.module.css`. |

### 🟡 Medium (9)

| # | Finding | File | Remedial Action |
|---|---|---|---|
| M1 | No Open Graph / social sharing metadata | `layout.tsx` | Add `openGraph` and `twitter` fields to the `metadata` export. |
| M2 | Content is hardcoded in JSX | `page.tsx` | Extract career data, about cards, and portfolio items into a `data.ts` file. |
| M3 | Deprecated `clip` property in glitch animation | `globals.css` | Replace with `clip-path: inset(...)`. |
| M4 | `history` sent to API grows unbounded | `ChatWidget.tsx` | Cap history to last N messages before sending. |
| M5 | Using array index as React `key` | `ChatWidget.tsx` | Assign unique IDs to messages at creation time. |
| M6 | No ARIA labels on buttons/chat dialog | `ChatWidget.tsx`, `SfMusic.tsx` | Add `aria-label`, `role="dialog"`, `aria-modal`, and `<label>` elements. |
| M7 | Retry logic duplicated in API route | `route.ts` | Extract into a reusable `callOpenRouter(model, messages)` helper. |
| M8 | `HTTP-Referer` header hardcoded to `localhost` | `route.ts` | Use an environment variable for the base URL. |
| M9 | Empty Next.js config — no `reactStrictMode` | `next.config.ts` | Enable `reactStrictMode: true`. |

### 🔵 Low / Informational (7)

| # | Finding | File | Remedial Action |
|---|---|---|---|
| L1 | No `engines` field in `package.json` | `package.json` | Add `"engines": { "node": ">=18" }`. |
| L2 | `@/*` path alias defined but never used | `tsconfig.json` | Either adopt the alias project-wide or remove it. |
| L3 | No skip-to-content link | `layout.tsx` | Add an `<a href="#main" class="sr-only">Skip to content</a>` element. |
| L4 | Empty `catch` block swallows audio errors | `SfMusic.tsx` | Log a warning in the catch block. |
| L5 | `scroll-behavior: smooth` on `body` instead of `html` | `globals.css` | Move to `html` selector. |
| L6 | Default Next.js SVGs unused in `public/` | `public/` | Remove unused default assets. |
| L7 | No tests or CI/CD | — | Set up at least basic Playwright or Cypress smoke tests. |

---

## 6. Remedial Actions

Below is a prioritised action plan. Items are grouped into phases for practical implementation.

### Phase 1 — Immediate (Security & Critical)

1. **Rotate the OpenRouter API key** on the OpenRouter dashboard.
2. **Check Git history** — run `git log --all -- .env` to see if the `.env` was ever committed. If so, use `git filter-repo` or `BFG Repo-Cleaner` to scrub it from history.
3. **Create `.env.example`** with placeholder values.
4. **Remove `'use client'` from `app/page.tsx`** — make the homepage a Server Component. Wrap only `<SfMusic />` and `<ChatWidget />` in a small Client Component wrapper if needed (they already have their own `'use client'` directives, so they should work as-is).

### Phase 2 — High Priority (UX & Performance)

5. **Add responsive breakpoints** — create `@media` queries at 480px, 768px, and 1024px in `page.module.css`. Key areas: timeline padding, card grid columns, hero font sizes, CTA button stacking, and fixed-position widget sizing.
6. **Migrate fonts to `next/font/google`** — remove the CSS `@import` in `globals.css` and use the Next.js font optimiser in `layout.tsx`.
7. **Add `prefers-reduced-motion`** — wrap all `animation` and `transition` properties in `@media (prefers-reduced-motion: no-preference) { ... }`.
8. **Add rate limiting & input validation to `app/api/chat/route.ts`** — validate `message` length (max 2000 chars), cap `history` array length (max 20 entries), and implement basic IP-based rate limiting.
9. **Extract inline styles from `ChatWidget.tsx`** into `ChatWidget.module.css`.

### Phase 3 — Medium Priority (Quality & Maintainability)

10. **Add Open Graph metadata** to `layout.tsx` (title, description, image, type).
11. **Extract hardcoded content** from `page.tsx` into a `data/content.ts` file.
12. **Replace deprecated `clip` property** with `clip-path` in `globals.css`.
13. **Cap conversation history** in `ChatWidget.tsx` before sending to the API.
14. **Add ARIA attributes** — `aria-label` on buttons, `role="dialog"` on the chat window, `<label>` for the chat input.
15. **Refactor API route** — extract `callOpenRouter()` helper, use `AbortController` for timeouts, dynamically set `HTTP-Referer`.
16. **Enable `reactStrictMode: true`** in `next.config.ts`.

### Phase 4 — Polish (Low Priority)

17. Add `"engines"` field to `package.json`.
18. Adopt `@/*` path alias consistently or remove it from `tsconfig.json`.
19. Add a skip-to-content link in `layout.tsx`.
20. Replace empty `catch` blocks in `SfMusic.tsx` with `console.warn`.
21. Move `scroll-behavior: smooth` to the `html` selector.
22. Remove unused default SVGs from `public/`.
23. Set up basic E2E tests with Playwright or Cypress.
24. Write a proper `README.md` with setup and deployment instructions.

---

*End of review. No code changes have been made.*
