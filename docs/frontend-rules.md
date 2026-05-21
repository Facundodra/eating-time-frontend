# Frontend Rules

## TypeScript

- Use TypeScript everywhere.
- Avoid using any.
- Prefer explicit interfaces/types.

---

## Components

- Use functional components only.
- Keep components small and reusable.
- Avoid giant components.

---

## Styling

- Use Tailwind CSS.
- Use shadcn/ui when appropriate.
- Avoid inline styles.
- Maintain spacing consistency.

---

## API Requests

- Use Axios.
- Keep requests inside services/.
- Avoid API calls directly inside UI components when possible.

---

## Forms

- Use React Hook Form.
- Keep validations simple and readable.

---

## Naming Conventions

Components:
- PascalCase

Hooks:
- camelCase starting with use

Files:
- kebab-case or component-based naming consistency

Types:
- descriptive and explicit

---

## State Management

Prefer:
- local state
- reusable hooks

Avoid unnecessary global state.

---

## Code Quality

Prefer:
- readability
- consistency
- maintainability

Avoid:
- premature abstractions
- unnecessary complexity
- overengineering

---

## Refactors

Do not perform large refactors automatically.

Always ask first before:
- moving folders
- changing architecture
- renaming many files
- introducing major patterns