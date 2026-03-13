# Frontend Coding Tutorial: Building Arnaud's Portfolio Website

Welcome to this beginner-friendly tutorial! In this guide, we'll walk through the codebase of the professional portfolio website we've built. We will cover the core technologies used, give a high-level overview of the structure, do a detailed code review, and wrap up with ideas for further improvements.

## 1. Summary of the Technology

Here is a quick rundown of the main tools and technologies powering this website:

*   **HTML & CSS:** The fundamental building blocks of the web. HTML gives our site structure (sections, headings, paragraphs), while CSS provides the visual styling (colors, layout, typography).
*   **JavaScript & TypeScript:** JavaScript is the programming language that makes the web interactive. **TypeScript** is a strict syntactical superset of JavaScript that adds optional static typing. This helps catch errors early during development (e.g., trying to call a string like a function).
*   **React:** A popular JavaScript library developed by Facebook for building user interfaces. React allows us to build reusable "components" (like a button, or a chat widget) that manage their own state.
*   **Next.js (App Router):** A powerful framework built on top of React. It handles the heavy lifting of building a web application, including:
    *   **Routing:** Automatically creating web pages based on your file structure.
    *   **API Routes:** Allowing us to write backend code (like our AI chat endpoint) within the same project.
    *   **Server-Side Rendering:** Making pages load faster and perform better for Search Engine Optimization (SEO).
*   **Web Audio API:** A browser technology that allows us to generate and manipulate audio directly in the frontend, which we used for the "Epic SF Music" component.
*   **OpenRouter API:** An external service we connected to in our backend route to power the AI "Digital Twin" chat widget using Large Language Models (LLMs).

## 2. High-Level Walkthrough

Our Next.js project is structured in a very specific way. If you look at your project folder (`/Users/arnauddelachaise/Documents/projects/site`), the most important directories are:

*   **`app/`**: This is the heart of the Next.js App Router.
    *   **`app/page.tsx`**: This file represents the very first page the user sees (the homepage or `/`).
    *   **`app/layout.tsx`**: This wraps every page in your application (it typically contains the basic `<html>` and `<body>` tags and global navigation/footers).
    *   **`app/api/`**: Any file inside `api/` is treated as a backend endpoint rather than a frontend page. We built a route for our chat widget here.
*   **`components/`**: This folder holds our reusable React components that we inject into our pages, keeping the main page file clean. We have:
    *   `ChatWidget.tsx`: The chat interface floating on the bottom right.
    *   `SfMusic.tsx`: The button controlling the Web Audio synthesizer.
*   **`public/`**: Stores static files like images, fonts, and the `favicon.ico`.

### How it all connects
When a user visits the website, Next.js loads the `app/page.tsx` file. Inside this file, we import the `SfMusic` and `ChatWidget` components and place them on the screen. If the user interacts with the chat, the `ChatWidget` sends a request to `app/api/chat/route.ts`, which then talks to an AI model and sends the reply back to the widget.

## 3. Detailed Code Review

Let's dive into some actual code to see how these concepts are applied.

### A. The Main Page (`app/page.tsx`)

This file is responsible for rendering the main layout of the portfolio, including the Hero section, About Me, Career Journey, and Just For Fun sections.

```tsx
'use client';

import styles from './page.module.css';
import { useEffect, useState } from 'react';
import SfMusic from '../components/SfMusic';
import ChatWidget from '../components/ChatWidget';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // useEffect runs after the component renders for the first time
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.subtitle}>Data & AI Strategy Leader</div>
        <h1 className={`${styles.title} glitch`} data-text="Arnaud de La Chaise">
          Arnaud de La Chaise
        </h1>
        {/* ... */}
      </section>
      
      {/* Bringing in our custom components */}
      <SfMusic />
      <ChatWidget />
    </main>
  );
}
```

**What to notice:**
*   **`'use client';`**: This tells Next.js that this component involves interactivity (like state and browser hooks) and needs to run in the user's browser, not just on the server.
*   **`useState` and `useEffect`**: These are React "Hooks". `useState` creates a variable (`mounted`) that React will track. `useEffect` runs code after the component first appears. We use this to prevent hydration errors (a common Next.js issue when server and client HTML don't match initially).
*   **Component Imports**: We import `<SfMusic />` and `<ChatWidget />` like custom HTML tags and easily place them at the bottom of our `<main>` container.

### B. The AI Chat Widget (`components/ChatWidget.tsx`)

This component manages the user interface for talking to the "Digital Twin".

```tsx
import { useState, useRef, useEffect } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I am Arnaud's Digital Twin..." }
  ]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the page from refreshing when the form is submitted
    if (!input.trim()) return;

    const userMsg = input.trim();
    // Add the user's message to the chat
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');

    // Fetch the AI's response from our backend API
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, history: messages })
    });

    const data = await res.json();
    // Add the AI's response to the chat
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
  };

  return (
    <>
      <button onClick={toggleChat}>
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div>
          {/* Chat Messages Loop */}
          {messages.map((msg, i) => (
            <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.content}
            </div>
          ))}
          {/* Input Form */}
          <form onSubmit={sendMessage}>
             <input value={input} onChange={(e) => setInput(e.target.value)} />
             <button type="submit">Send</button>
          </form>
        </div>
      )}
    </>
  );
}
```

**What to notice:**
*   **Handling State**: `isOpen` controls whether the chat box is visible. `input` controls what the user types into the text box. `messages` stores the history of the conversation.
*   **The Backend Request (`fetch`)**: The `sendMessage` function takes over when the user submits a message. It sends a `POST` request to `/api/chat`, passing the user's message and history in a JSON bundle.
*   **Conditionals in React**: `{isOpen && ( <div>...</div> )}` is a popular React pattern. It literally means "if `isOpen` is true, render the elements inside the parenthesis."

### C. The Backend API Route (`app/api/chat/route.ts`)

Next.js lets us build our own serverside endpoints easily. This file connects our frontend chat widget to the OpenRouter AI securely.

```typescript
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Read the data sent from ChatWidget.tsx
    const { message, history } = await req.json();

    // 2. Define the personality (System Prompt)
    const systemPrompt = `You are the digital twin of Arnaud de La Chaise...`;

    // 3. Format the messages for the AI model
    const openRouterMessages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ];

    // 4. Send the request to OpenRouter using our secret API key
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free", 
        messages: openRouterMessages,
      })
    });

    const data = await response.json();
    
    // 5. Send the text reply back to the frontend component
    return NextResponse.json({ reply: data.choices[0].message.content });

  } catch (error) {
    return NextResponse.json({ reply: "My circuits seem to be overloaded." }, { status: 500 });
  }
}
```

**What to notice:**
*   **Secrets and Security**: Notice `process.env.OPENROUTER_API_KEY`. This API key is a secret password that allows us to bill our AI requests. Because this code runs on the *server*, the API key is completely hidden from the user's web browser. If we put this call directly inside `ChatWidget.tsx`, malicious users could steal our key!
*   **Async/Await**: Because communicating with an external AI server takes an unpredictable amount of time, we use asynchronous programming (`async function` and `await fetch`). This tells our server, "Wait here until the AI responds before moving to the next line of code."

## 4. Self-Review: 5 Suggestions for Improvement

While the application is functional and aesthetically pleasing, code is never truly "finished." Below are five practical suggestions for improving this codebase:

1.  **Extract Hardcoded Content into a Content Management System (CMS) or JSON file:**
    Presently, all the textual data for the "About Me" and "Career Journey" sections is hardcoded directly inside `app/page.tsx`. Moving this data to a separate `data.json` file or a headless CMS (like Sanity or Contentful) would make the code much cleaner and easier to update in the future without touching the actual page component.
    
2.  **Move Inline Styles to CSS Modules or Tailwind:**
    In components like `ChatWidget.tsx` and `SfMusic.tsx`, we relied heavily on inline styles (e.g., `style={{ position: 'fixed', bottom: '2rem' }}`). While fast for prototyping, it can make components extremely bloated over time. Creating specific CSS module files (e.g., `ChatWidget.module.css` and `SfMusic.module.css`) would separate logic from styling and improve readability significantly.
    
3.  **Enhance Error Handling and Edge Cases in ChatWidget:**
    Currently, when a user sends a message, there is basic error catching, but the user experience could be improved. For example, disabling the text input box and send button while `loading` is true, and properly warning the user if their message failed to send (perhaps offering a "retry" button instead of pushing an error text pretending to be a regular message).
    
4.  **Implement Server-Side Rendering (SSR) or Static Site Generation (SSG) correctly on `Home`:**
    We wrap the entire `app/page.tsx` as a Client Component (`'use client';`) and wait for the `mounted` state before showing anything. This avoids hydration issues but compromises SEO and initial load times, as the browser must download JavaScript before rendering the text. It would be better to extract *only* the interactive parts (like a small wrapper around `SfMusic` and `ChatWidget`) into Client Components, leaving the main content (Hero, Timeline, About) as Server Components that load instantly and are easily crawled by Google.
    
5.  **Refactor the Web Audio Synthesizer:**
    In `SfMusic.tsx`, the Web Audio initialization logic is quite dense inside the `togglePlay` function. We could improve readability and maintainability by moving the audio graph assembly (nodes, oscillators, gains, delays) into a separate "helper" function, or even a custom hook like `useSciFiAudio()`, separating the complex audio logic from the UI rendering logic.

---
*Happy coding! Feel free to refer back to this whenever you need to understand the architecture or brush up on the specific React concepts we utilized in this project.*
