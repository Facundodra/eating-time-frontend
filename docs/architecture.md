# Frontend Architecture

## General Structure

The frontend follows a layered and modular structure using Next.js App Router.

Main organization:

src/
├── app/
├── components/
├── services/
├── hooks/
├── types/
├── lib/
├── utils/
└── constants/

---

# Responsibilities

## app/
Contains:
- routes
- layouts
- pages
- route-level UI

Pages should remain thin and delegate logic to hooks/services.

---

## components/
Reusable UI components.

Examples:
- cards
- tables
- forms
- dialogs
- navigation
- charts

Components should:
- be reusable
- remain focused
- avoid business logic

---

## services/
API communication layer.

Responsibilities:
- Axios requests
- endpoint handling
- DTO mapping
- request/response management

Business rules should not live here.

---

## hooks/
Reusable frontend logic.

Examples:
- authentication state
- filters
- pagination
- form handling
- API orchestration

---

## types/
Shared TypeScript interfaces and types.

Examples:
- DTOs
- API responses
- domain models

---

# API Communication

Frontend communicates with backend through REST APIs using Axios.

Authentication is expected to use JWT-based authentication.

---

# Forms

Forms should use:
- React Hook Form

Validation should remain simple and readable.

---

# UI System

The UI system is based on:
- Tailwind CSS
- shadcn/ui

Charts and statistics:
- MUI X Charts

---

# Dark Mode

The application supports:
- dark mode
- light mode

All components should remain visually consistent in both modes.

---

# Responsive Design

The application must work correctly on:
- desktop
- tablet
- mobile browsers

Frontend should follow responsive-first principles.