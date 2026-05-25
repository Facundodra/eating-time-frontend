# Eating Time Frontend Agent Rules

## Project Overview
Eating Time is a food delivery platform developed as a university project.

The system includes:
- Web application (Next.js)
- Mobile application (React Native)
- Backend API (Spring Boot)

This repository contains ONLY the frontend web application.

User roles:
- Administrator
- Local (restaurant)
- Client

The frontend consumes a REST API exposed by the backend.

---

## Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Axios
- React Hook Form
- MUI X Charts

---

## General Behavior Rules

Before making changes:
- Briefly explain what you will modify and why.
- Keep explanations concise.
- Ask for confirmation before large architectural changes.

When modifying code:
- Keep changes minimal and focused.
- Modify only files directly related to the requested task.
- Do not refactor unrelated code.
- Do not rename/move large parts of the project unless explicitly requested.

If a task requires modifying many files:
- Stop and ask for confirmation first.

---

## Architecture Rules

- Use functional React components only.
- Use TypeScript everywhere.
- Keep pages thin.
- Business logic belongs in hooks/services.
- Reusable UI belongs in src/components.
- API communication belongs in src/services.
- Shared types/interfaces belong in src/types.
- Forms should use React Hook Form.
- Use Axios for API requests.

---

## UI Rules

- Use Tailwind CSS for styling.
- Use shadcn/ui components when appropriate.
- Avoid inline styles.
- Maintain visual consistency.
- Prefer clean and modern UI.
- Responsive behavior is required.
- Support dark mode and light mode.

---

## Safety Rules

- Do not modify package structure unless necessary.
- Do not install new dependencies without explaining why.
- Do not generate placeholder architecture unrelated to the request.
- Do not create unnecessary abstractions.
- Prefer readability over cleverness.

---

## Context Usage

Before implementing significant features:
- Read documentation inside /docs.

Important:
- Documentation represents the current understanding of the project, but implementation details may evolve during development.
- If documentation conflicts with explicit user instructions, prioritize the user instructions.

---

## Cursor Cloud specific instructions

### Services

This repository is a **frontend-only** Next.js application. The only service to run is the Next.js dev server:

```bash
npm run dev   # starts on http://localhost:3000
```

No backend, database, or Docker services are required — all data is currently mocked in `src/lib/data.ts`.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` |
| Lint | `npm run lint` (runs ESLint) |
| Build | `npm run build` |
| TypeScript check | `npx tsc --noEmit` |

### Notes

- The app uses **Next.js 16** with Turbopack in dev mode; hot-reload is fast and reliable.
- The landing page redirects to `/restaurant` by default.
- Several pages are placeholders ("not yet implemented"): `/restaurant/dishes`, `/restaurant/statistics`, `/restaurant/workbench`, `/admin/users`.
- Despite AGENTS.md listing axios, shadcn/ui, react-hook-form, and MUI X Charts in the stack, these are **not yet installed** in `package.json`. They are planned for future use.
- No environment variables are required at this time (no `.env` file needed).