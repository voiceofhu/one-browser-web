# Dashboard API Integration Design

## Goal

Build the first usable management dashboard in `one-browser-web` by connecting the existing Vite React scaffold to `one-browser-server` APIs under `/api`.

## Scope

This first pass covers:

- Dashboard shell at `src/page/dashboard`.
- Login state discovery through `/api/auth/me` and logout through `/api/auth/logout`.
- Read-only admin overview for users, roles, menus, departments, posts, dictionary types, and dictionary data.
- Health/readiness cards from `/api/healthz`, `/api/readyz`, and `/api/files/health`.
- Route-based dashboard navigation with `react-router`.

This pass intentionally does not build create/edit/delete forms. The server write APIs are available, but full CRUD should be added in a later pass with `react-hook-form` and zod validation.

## Existing Context

The web app is Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui `radix-nova`. The user has already added a dashboard scaffold with sidebar, cards, chart, and a sample table. The scaffold is treated as existing work and must not be reverted.

The server exposes business APIs under `/api`. It uses an HttpOnly cookie named `one_browser_session`, so client requests must include `credentials: "include"`. List endpoints currently return arrays, not paginated envelopes.

## Architecture

Add a small fetch wrapper in `src/lib/request.ts` and feature-local dashboard modules under `src/page/dashboard`. Dashboard state is mostly server state and uses TanStack Query. The dashboard uses real routes such as `/dashboard/users` and `/dashboard/roles` through `react-router`.

The dashboard will keep user-facing UI inside shadcn components: Sidebar, Card, Table, Badge, Alert, Empty, Skeleton, Avatar, DropdownMenu, Breadcrumb, Separator, and Button.

## Data Flow

`DashboardPage` mounts inside the existing global providers. It calls dashboard queries for current user, health, readiness, admin resources, and dictionary resources. The query layer calls typed API functions, and the API functions call the shared request wrapper.

Unauthenticated `/api/auth/me` returns `401`, which should show a clear login-required state instead of crashing the whole dashboard. Other API errors should render an Alert with the server message.

## UI Shape

The left sidebar should show:

- `/dashboard` Overview
- Users
- Roles
- Menus
- Departments
- Posts
- Dictionary Types
- Dictionary Data
- System Health

The main panel should show a header, summary cards, and a section-specific table. Tables are client-side because server lists are array responses with no pagination contract. TanStack Table should own sorting, filtering, column visibility, and pagination in each reusable table component.

## Testing And Verification

No test runner is currently configured in `one-browser-web`. Verification for this pass is:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

If typecheck fails due to pre-existing scaffold issues, fix issues introduced by this pass and report any remaining unrelated scaffold issues.
