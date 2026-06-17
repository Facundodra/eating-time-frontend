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
- New documents and features must respect the folder structure (e.g. admin, client, register, restaurant, etc.)
- All new functions and procedures must be in English and consistent with already-implemented ones. 

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
- Authentication is session/cookie based (JSESSIONID), not JWT.
- Axios authenticated requests must use withCredentials: true.
- Do not implement token persistence unless explicitly requested.

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
- Always ask for explicit confirmation before running `git commit` or `git push`.

---

## Context Usage

Before implementing significant features:
- Read documentation inside /docs.

Important:
- Documentation represents the current understanding of the project, but implementation details may evolve during development.
- If documentation conflicts with explicit user instructions, prioritize the user instructions.
