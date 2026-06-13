# RuoYi-Style Routing And Dashboard Design

## Goal

Align One Browser with a RuoYi-style admin information architecture while keeping the current shadcn/ui visual system. The change covers both frontend page routes and backend API URLs, and refreshes the dashboard from a simple resource-count page into a practical admin workbench.

## Scope

In scope:

- Frontend dashboard route structure and sidebar grouping.
- Backend API route aliases that make the primary URLs look like a RuoYi-style admin service.
- Frontend API calls updated to use the new primary backend URLs.
- Dashboard overview redesign using existing backend data.
- Resource table shell refinements that preserve the current TanStack Table and CRUD behavior.
- OpenAPI path list and verification documentation updates.

Out of scope:

- Rewriting repository or handler business logic.
- Replacing TanStack Table or shadcn/ui primitives.
- Adding a login page, permission-driven menu generation, server-side pagination, or new backend data endpoints.
- Removing old API URLs immediately.

## Frontend Route Design

The frontend uses `/dashboard` as the admin root. New primary page routes:

| Page | Route |
| --- | --- |
| Workbench | `/dashboard` |
| User Management | `/dashboard/system/users` |
| Role Management | `/dashboard/system/roles` |
| Menu Management | `/dashboard/system/menus` |
| Department Management | `/dashboard/system/depts` |
| Post Management | `/dashboard/system/posts` |
| Dict Type Management | `/dashboard/system/dict-types` |
| Dict Data Management | `/dashboard/system/dict-data` |
| Health Monitor | `/dashboard/monitor/health` |

Legacy frontend routes such as `/dashboard/users` and `/dashboard/health` should continue to resolve to the same route IDs so old links do not break during the transition.

## Sidebar Design

The sidebar should read like a RuoYi-style admin system, but use existing shadcn Sidebar primitives.

Groups:

- Workbench: Overview.
- System Management: Users, Roles, Menus, Departments, Posts, Dict Types, Dict Data.
- System Monitor: Health.

The sidebar should stay compact, dense, and utilitarian. It should avoid marketing-like hero treatments, decorative gradients, and oversized cards.

## Backend API Route Design

New primary backend API URLs:

| Capability | New Primary URL |
| --- | --- |
| Users | `/api/system/users` |
| Roles | `/api/system/roles` |
| Menus | `/api/system/menus` |
| Departments | `/api/system/depts` |
| Posts | `/api/system/posts` |
| Dict Types | `/api/system/dict-types` |
| Dict Data | `/api/system/dict-data` |
| Health | `/api/monitor/healthz` |
| Readiness | `/api/monitor/readyz` |
| File Health | `/api/monitor/files/health` |

Compatibility URLs remain available:

- Existing `/api/admin/*` management URLs continue to work.
- Existing `/api/system/dict-*` URLs continue to work.
- Existing `/api/healthz`, `/api/readyz`, and `/api/files/health` continue to work.

The frontend should call the new primary URLs after this change. Backend handlers should be reused, not duplicated, so behavior stays identical across primary and compatibility paths.

## Dashboard Workbench Design

The dashboard overview should become an operational workbench. It should use existing queries only:

- Current user from `/api/auth/me`.
- Health and readiness.
- File health.
- Resource lists for users, roles, menus, departments, posts, dict types, and dict data.

Layout:

- Top status strip: current user, environment, service status, dependency status.
- Core resource summary: users, roles, menus, departments, posts, dict totals.
- System monitor panel: Postgres, SeaORM, Redis, upload directory.
- Quick actions: links to user, role, menu, and health pages.
- Recent activity-style panel derived from available resource timestamps, such as recently created users, roles, menus, or posts.

The page should feel like a shadcn admin dashboard: restrained colors, semantic tokens, compact cards, readable tables/lists, and no custom palette.

## Resource Table Refinements

Keep the current CRUD capability and TanStack Table state model. Refine the shell:

- Keep search, refresh, create, column visibility, sorting, pagination, loading, empty, and error states.
- Make the table header and footer feel more like a management console toolbar.
- Reduce visual heaviness by avoiding nested card-like sections.
- Keep row actions in a dropdown.
- Preserve existing dialogs and validation behavior.

## Data Flow

Frontend route changes map to the same `DashboardRouteId` values used today. The route metadata owns the canonical frontend path. The route parser accepts both canonical and legacy paths.

Frontend API calls use new backend primary paths. React Query keys can remain stable because the resource identity is unchanged.

Backend route changes reuse existing Axum handlers by mounting them at new path prefixes. Auth, audit, and permission middleware should apply to both new and compatibility management paths.

## Error Handling

Existing error behavior remains:

- Backend returns `{ "error": "...", "message": "..." }`.
- Frontend displays errors through existing Alert, Empty, and toast surfaces.
- Unauthenticated resource queries still show login-required messaging.
- Readiness degradation is visible but not treated as a frontend crash.

## Documentation Updates

Update backend API documentation and verification notes:

- `src/modules/docs.rs` should list the new primary paths.
- `docs/verification.md` should use new primary curl examples.
- Old compatibility paths can be mentioned as transitional behavior.

## Verification

Frontend:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

Backend:

- `cargo fmt --check`
- `cargo test`

Manual smoke checks:

- `/dashboard` renders the workbench.
- `/dashboard/system/users` and legacy `/dashboard/users` both show user management.
- `/dashboard/monitor/health` and legacy `/dashboard/health` both show health status.
- Frontend resource queries call `/api/system/*` or `/api/monitor/*` primary URLs.
- Backend new primary URLs and old compatibility URLs both respond for at least users, roles, readiness, and file health.
