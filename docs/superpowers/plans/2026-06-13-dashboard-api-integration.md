# Dashboard API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the Vite React dashboard scaffold to the Rust backend management APIs.

**Architecture:** Add a shared fetch client, dashboard-local typed API modules, react-router dashboard routes, and reusable shadcn/TanStack Table components. Keep changes scoped to dashboard integration and preserve the user's scaffold.

**Tech Stack:** Vite, React 19, TypeScript, react-router, shadcn/ui radix-nova, TanStack Query, TanStack Table, date-fns, lucide-react.

---

## File Structure

- `src/lib/request.ts`: typed fetch wrapper with `/api` base URL, cookie credentials, JSON/FormData support, and server error parsing.
- `src/page/dashboard/types.ts`: backend response types and dashboard route ids.
- `src/page/dashboard/api.ts`: typed HTTP functions for auth, health, admin resources, and dictionaries.
- `src/page/dashboard/constants.ts`: route metadata, labels, enum labels, and table configuration helpers.
- `src/page/dashboard/hooks.ts`: dashboard queries and react-router route hook.
- `src/page/dashboard/components/resource-table.tsx`: reusable client-side TanStack Table for read-only resources.
- `src/page/dashboard/components/dashboard-overview.tsx`: summary cards and health/readiness display.
- `src/page/dashboard/components/dashboard-section.tsx`: section-specific query rendering and table composition.
- `src/page/dashboard/index.tsx`: dashboard shell wiring using existing scaffold components.
- `src/components/app-sidebar.tsx`: adapt scaffold sidebar to dashboard routes and current user.
- `src/components/site-header.tsx`: accept active route title.
- `src/components/nav-user.tsx`: display current backend user and logout action.
- `src/App.tsx`: render the dashboard page.

## Task 1: Request And API Contracts

**Files:**
- Create: `src/lib/request.ts`
- Create: `src/page/dashboard/types.ts`
- Create: `src/page/dashboard/api.ts`
- Create: `src/page/dashboard/constants.ts`

- [ ] **Step 1: Implement `src/lib/request.ts`**

Create a small wrapper:

```ts
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = "HttpError"
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"

function buildUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  return `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
}

async function parseError(response: Response) {
  const fallback = response.statusText || "Request failed"
  try {
    const body = (await response.json()) as { error?: string; message?: string }
    return new HttpError(response.status, body.error ?? "http_error", body.message ?? fallback)
  } catch {
    return new HttpError(response.status, "http_error", fallback)
  }
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(buildUrl(path), {
    credentials: "include",
    ...init,
    headers:
      init.body instanceof FormData
        ? init.headers
        : {
            "Content-Type": "application/json",
            ...init.headers,
          },
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}
```

- [ ] **Step 2: Define dashboard backend types**

Define exact response shapes from `one-browser-server`: `CurrentUser`, `HealthResponse`, `ReadyResponse`, `FileHealthResponse`, `UserResource`, `RoleResource`, `MenuResource`, `DeptResource`, `PostResource`, `DictTypeResource`, `DictDataResource`, and `DashboardRouteId`.

- [ ] **Step 3: Implement API functions**

Implement `getCurrentUser`, `logout`, `getHealth`, `getReadiness`, `getFileHealth`, `listUsers`, `listRoles`, `listMenus`, `listDepts`, `listPosts`, `listDictTypes`, and `listDictData`.

- [ ] **Step 4: Add constants**

Add route metadata for `overview`, `users`, `roles`, `menus`, `depts`, `posts`, `dict-types`, `dict-data`, and `health`. Add enum label maps for status, sex, data scope, menu type, visible, yes/no.

## Task 2: Dashboard Query Hooks And Tables

**Files:**
- Create: `src/page/dashboard/hooks.ts`
- Create: `src/page/dashboard/components/resource-table.tsx`
- Create: `src/page/dashboard/components/dashboard-overview.tsx`
- Create: `src/page/dashboard/components/dashboard-section.tsx`

- [ ] **Step 1: Implement route/query hooks**

Create `useDashboardRoute`, `useDashboardData`, and `useLogoutMutation`. Route state should come from `react-router` location and navigate to paths such as `/dashboard/users`; `/dashboard` defaults to `overview`.

- [ ] **Step 2: Implement reusable table**

Build a generic client-side TanStack table with:

- global text filter
- sorting
- pagination
- column visibility
- loading skeleton rows
- Empty component for no data
- Alert component for errors

- [ ] **Step 3: Implement overview**

Show summary cards for counts and health state. Use existing API arrays and health queries. Avoid fake money/customer metrics.

- [ ] **Step 4: Implement section renderer**

Map each route id to its query, columns, title, and description. Dates should be shown with `formatDistanceToNow` and ISO title attributes.

## Task 3: Wire Scaffold To Real Dashboard

**Files:**
- Modify: `src/page/dashboard/index.tsx`
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/components/site-header.tsx`
- Modify: `src/components/nav-user.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace sample data usage**

Remove dependency on `data.json` in `src/page/dashboard/index.tsx`. Use `useDashboardRoute`, `useDashboardData`, `DashboardOverview`, and `DashboardSection`.

- [ ] **Step 2: Adapt sidebar**

Make `AppSidebar` accept `activeRoute`, `onRouteChange`, `currentUser`, and `onLogout`. Render dashboard route labels instead of scaffold placeholders.

- [ ] **Step 3: Adapt header**

Make `SiteHeader` accept a `title` prop and show the active route title.

- [ ] **Step 4: Adapt nav user**

Make `NavUser` accept optional backend user and logout callback. Keep AvatarFallback.

- [ ] **Step 5: Render dashboard from App**

Replace the starter placeholder with `<DashboardPage />`.

## Task 4: Verification

**Files:**
- No production files unless verification exposes issues.

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`

Expected: no TypeScript errors from the dashboard integration.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`

Expected: no lint errors from modified files.

- [ ] **Step 3: Run build**

Run: `pnpm build`

Expected: production bundle succeeds.

- [ ] **Step 4: Report residual issues**

If unrelated scaffold issues remain, document exact file paths and errors instead of hiding them.

## Self-Review

The plan covers the accepted MVP: dashboard folder, route switching, backend API connection, auth/me/logout, admin read-only resources, dictionary resources, health cards, and verification. It avoids CRUD forms because `react-hook-form` is not installed and CRUD was intentionally deferred. No placeholders remain.
