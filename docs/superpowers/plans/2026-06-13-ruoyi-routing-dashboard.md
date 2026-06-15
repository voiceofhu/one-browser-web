# RuoYi Routing Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align frontend and backend URLs with a RuoYi-style admin structure and refresh the dashboard into a compact shadcn/ui workbench.

**Architecture:** Reuse existing handlers, queries, CRUD dialogs, and TanStack Table state. Add new canonical frontend paths and backend API aliases while keeping legacy paths working. Redesign the dashboard overview with existing query data only, so no new backend data contract is required.

**Tech Stack:** Vite, React 19, TypeScript, React Router, TanStack Query, TanStack Table, shadcn/ui, Tailwind CSS v4, Axum, Tokio, SeaORM, Rust 2024.

---

## File Map

Frontend repository: `/Volumes/sn@root/Documents/workspaces/voh/chromium/one-browser-web`

- Modify: `src/page/dashboard/constants.ts` for canonical frontend route paths and grouped nav metadata.
- Modify: `src/page/dashboard/hooks.ts` for legacy path aliases and route parsing.
- Modify: `src/components/app-sidebar.tsx` to render grouped RuoYi-style sidebar sections.
- Modify: `src/components/nav-main.tsx` only if grouped sidebar rendering needs a more general item shape.
- Modify: `src/page/dashboard/api.ts` to call new backend primary API URLs.
- Modify: `src/page/dashboard/components/dashboard-overview.tsx` to replace the current count-card page with a workbench.
- Modify: `src/page/dashboard/components/resource-table.tsx` for table shell density and formatting cleanup.
- Modify: `src/page/dashboard/components/resource-manager.tsx` only if table toolbar copy or spacing needs to match the new table shell.
- Create: `src/page/dashboard/workbench/dashboard-overview.tsx` for the workbench page content.
- Create: `src/page/dashboard/monitor/health-section.tsx` for monitor page content.
- Create: `src/page/dashboard/resources/manager.tsx` for resource CRUD orchestration.
- Create: `src/page/dashboard/resources/editor-dialog.tsx` for resource editor dialogs.
- Create: `src/page/dashboard/resources/table/index.tsx` for the table shell.
- Create: `src/page/dashboard/resources/table/column-header.tsx` for sortable column header UI.
- Create: `src/page/dashboard/resources/table/skeleton.tsx` for table loading UI.
- Create: `src/page/dashboard/resources/table/utils.ts` for table metadata and error helpers.
- Create: `src/page/dashboard/resources/toast.ts` for consistent resource operation toast feedback.
- Move: `src/page/dashboard/resource-columns.tsx` to `src/page/dashboard/resources/columns.tsx`.
- Move: `src/page/dashboard/resource-configs.ts` to `src/page/dashboard/resources/configs.ts`.
- Move: `src/page/dashboard/resource-form.ts` to `src/page/dashboard/resources/form.ts`.

Backend repository: `/Volumes/sn@root/Documents/workspaces/voh/chromium/one-browser-server`

- Modify: `src/modules/admin/mod.rs` to mount management handlers at both `/admin/*` compatibility paths and `/system/*` primary paths.
- Modify: `src/modules/health.rs` to expose `/monitor/healthz` and `/monitor/readyz` in addition to existing health paths.
- Modify: `src/modules/file/mod.rs` to expose `/monitor/files/health` in addition to `/files/health`; keep upload route unchanged unless explicitly required later.
- Modify: `src/middleware/audit.rs` so write audit covers new `/api/system/*` management write paths and continues covering old `/api/admin/*`.
- Modify: `src/modules/docs.rs` to list new primary API paths in OpenAPI.
- Modify: `docs/verification.md` to use new primary curl examples and mention compatibility paths.

---

### Task 1: Frontend Route Constants And Path Aliases

**Files:**
- Modify: `src/page/dashboard/constants.ts`
- Modify: `src/page/dashboard/hooks.ts`

- [ ] **Step 1: Update canonical frontend paths**

In `src/page/dashboard/constants.ts`, set route paths to:

```ts
export const DASHBOARD_ROUTES: DashboardRouteMeta[] = [
  {
    id: "overview",
    label: "工作台",
    title: "工作台",
    description: "查看后台资源、运行状态和快捷入口。",
    path: "/dashboard",
  },
  {
    id: "users",
    label: "用户管理",
    title: "用户管理",
    description: "管理后台账号、资料和启用状态。",
    path: "/dashboard/system/users",
  },
  {
    id: "roles",
    label: "角色管理",
    title: "角色管理",
    description: "管理角色标识、数据权限和启用状态。",
    path: "/dashboard/system/roles",
  },
  {
    id: "menus",
    label: "菜单管理",
    title: "菜单管理",
    description: "管理菜单路由、权限标识和可见状态。",
    path: "/dashboard/system/menus",
  },
  {
    id: "depts",
    label: "部门管理",
    title: "部门管理",
    description: "管理当前数据范围内的组织部门。",
    path: "/dashboard/system/depts",
  },
  {
    id: "posts",
    label: "岗位管理",
    title: "岗位管理",
    description: "管理组织岗位编码、排序和状态。",
    path: "/dashboard/system/posts",
  },
  {
    id: "dict-types",
    label: "字典类型",
    title: "字典类型",
    description: "管理系统字典类型定义。",
    path: "/dashboard/system/dict-types",
  },
  {
    id: "dict-data",
    label: "字典数据",
    title: "字典数据",
    description: "管理各字典类型下的键值数据。",
    path: "/dashboard/system/dict-data",
  },
  {
    id: "health",
    label: "健康检查",
    title: "健康检查",
    description: "查看服务、依赖和上传存储状态。",
    path: "/dashboard/monitor/health",
  },
]
```

- [ ] **Step 2: Add grouped route metadata**

Still in `src/page/dashboard/constants.ts`, add:

```ts
export const DASHBOARD_ROUTE_GROUPS = [
  {
    label: "工作台",
    routes: ["overview"],
  },
  {
    label: "系统管理",
    routes: [
      "users",
      "roles",
      "menus",
      "depts",
      "posts",
      "dict-types",
      "dict-data",
    ],
  },
  {
    label: "系统监控",
    routes: ["health"],
  },
] satisfies {
  label: string
  routes: DashboardRouteId[]
}[]
```

- [ ] **Step 3: Add legacy path aliases**

In `src/page/dashboard/constants.ts`, add after `DASHBOARD_ROUTE_BY_PATH`:

```ts
export const DASHBOARD_LEGACY_ROUTE_BY_PATH = {
  "/dashboard/users": "users",
  "/dashboard/roles": "roles",
  "/dashboard/menus": "menus",
  "/dashboard/depts": "depts",
  "/dashboard/posts": "posts",
  "/dashboard/dict-types": "dict-types",
  "/dashboard/dict-data": "dict-data",
  "/dashboard/health": "health",
} satisfies Record<string, DashboardRouteId>
```

- [ ] **Step 4: Teach route parsing to accept canonical and legacy paths**

In `src/page/dashboard/hooks.ts`, import the legacy map:

```ts
import {
  DASHBOARD_LEGACY_ROUTE_BY_PATH,
  DASHBOARD_ROUTE_BY_ID,
  DASHBOARD_ROUTE_BY_PATH,
  DEFAULT_DASHBOARD_ROUTE,
  isDashboardRouteId,
} from "./constants"
```

Then update `readRouteFromPathname`:

```ts
function readRouteFromPathname(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/"
  const directRoute =
    DASHBOARD_ROUTE_BY_PATH[normalizedPath] ??
    DASHBOARD_LEGACY_ROUTE_BY_PATH[normalizedPath]
  if (directRoute) {
    return directRoute
  }

  const section = normalizedPath.replace(/^\/dashboard\/?/, "")
  if (!section || section === normalizedPath) {
    return DEFAULT_DASHBOARD_ROUTE
  }

  const lastSegment = section.split("/").filter(Boolean).at(-1)
  return lastSegment && isDashboardRouteId(lastSegment)
    ? lastSegment
    : DEFAULT_DASHBOARD_ROUTE
}
```

- [ ] **Step 5: Verify frontend route constants compile**

Run:

```bash
pnpm typecheck
```

Expected: TypeScript completes without route typing errors.

---

### Task 2: Grouped Sidebar

**Files:**
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/components/nav-main.tsx`

- [ ] **Step 1: Update nav item type**

In `src/components/nav-main.tsx`, introduce exported types:

```ts
export type NavMainItem = {
  title: string
  url: string
  icon?: React.ReactNode
}

export type NavMainGroup = {
  label: string
  items: NavMainItem[]
}
```

- [ ] **Step 2: Render grouped nav**

Replace `NavMain` props and body in `src/components/nav-main.tsx` with grouped rendering:

```tsx
export function NavMain({
  groups,
  activeUrl,
  onSelect,
}: {
  groups: NavMainGroup[]
  activeUrl?: string
  onSelect?: (url: string) => void
}) {
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={item.url === activeUrl}
                  >
                    <NavLink to={item.url} onClick={() => onSelect?.(item.url)}>
                      {item.icon}
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
```

- [ ] **Step 3: Build nav groups from route constants**

In `src/components/app-sidebar.tsx`, import `DASHBOARD_ROUTE_GROUPS`:

```ts
import {
  DASHBOARD_ROUTE_BY_ID,
  DASHBOARD_ROUTE_GROUPS,
  DASHBOARD_ROUTES,
} from "@/page/dashboard/constants"
```

Replace `navMain` with:

```ts
const navGroups = DASHBOARD_ROUTE_GROUPS.map((group) => ({
  label: group.label,
  items: group.routes.map((routeId) => {
    const route = DASHBOARD_ROUTE_BY_ID[routeId]
    return {
      title: route.label,
      url: route.path,
      icon: routeIcons[route.id],
    }
  }),
}))
```

- [ ] **Step 4: Update sidebar render call**

In `src/components/app-sidebar.tsx`, replace:

```tsx
<NavMain
  items={navMain}
  activeUrl={DASHBOARD_ROUTE_BY_ID[activeRoute].path}
  onSelect={(url) => {
    const route = DASHBOARD_ROUTES.find((route) => route.path === url)
    if (route) {
      onRouteChange(route.id)
    }
  }}
/>
```

with:

```tsx
<NavMain
  groups={navGroups}
  activeUrl={DASHBOARD_ROUTE_BY_ID[activeRoute].path}
  onSelect={(url) => {
    const route = DASHBOARD_ROUTES.find((route) => route.path === url)
    if (route) {
      onRouteChange(route.id)
    }
  }}
/>
```

- [ ] **Step 5: Update secondary links**

In `src/components/app-sidebar.tsx`, set secondary URLs to canonical paths:

```ts
const secondaryItems = [
  {
    title: "刷新",
    url: "/dashboard",
    icon: <RefreshCwIcon />,
  },
  {
    title: "帮助",
    url: "/dashboard/monitor/health",
    icon: <CircleHelpIcon />,
  },
]
```

- [ ] **Step 6: Verify sidebar compiles**

Run:

```bash
pnpm typecheck
```

Expected: no prop mismatch between `AppSidebar` and `NavMain`.

---

### Task 3: Frontend API Primary URLs

**Files:**
- Modify: `src/page/dashboard/api.ts`

- [ ] **Step 1: Change management API calls to new primary paths**

In `src/page/dashboard/api.ts`, update:

```ts
export function getHealth() {
  return http.get<HealthResponse>("/monitor/healthz")
}

export function getReadiness() {
  return http.get<ReadyResponse>("/monitor/readyz")
}

export function getFileHealth() {
  return http.get<FileHealthResponse>("/monitor/files/health")
}

export function listUsers() {
  return http.get<UserResource[]>("/system/users")
}

export function createUser(payload: ResourceMutationPayload) {
  return http.post<UserResource>("/system/users", payload)
}

export function updateUser(userId: number, payload: ResourceMutationPayload) {
  return http.put<UserResource>(`/system/users/${userId}`, payload)
}

export function deleteUser(userId: number) {
  return http.del<void>(`/system/users/${userId}`)
}
```

Apply the same `/system/<resource>` pattern for roles, menus, depts, posts, dict-types, and dict-data.

- [ ] **Step 2: Verify API file compiles**

Run:

```bash
pnpm typecheck
```

Expected: no TypeScript errors from changed string paths.

---

### Task 4: Backend Route Aliases

**Files:**
- Modify: `/Volumes/sn@root/Documents/workspaces/voh/chromium/one-browser-server/src/modules/admin/mod.rs`
- Modify: `/Volumes/sn@root/Documents/workspaces/voh/chromium/one-browser-server/src/modules/health.rs`
- Modify: `/Volumes/sn@root/Documents/workspaces/voh/chromium/one-browser-server/src/modules/file/mod.rs`
- Modify: `/Volumes/sn@root/Documents/workspaces/voh/chromium/one-browser-server/src/middleware/audit.rs`

- [ ] **Step 1: Add system management aliases**

In backend `src/modules/admin/mod.rs`, keep all existing `/admin/*` routes and add the matching `/system/*` routes to the same handlers:

```rust
.route(
    "/system/users",
    get(users::list_users).post(users::create_user),
)
.route(
    "/system/users/{id}",
    get(users::get_user)
        .put(users::update_user)
        .delete(users::delete_user),
)
.route(
    "/system/users/{id}/roles",
    get(users::user_roles).put(users::set_user_roles),
)
.route(
    "/system/users/{id}/posts",
    get(users::user_posts).put(users::set_user_posts),
)
.route(
    "/system/roles",
    get(roles::list_roles).post(roles::create_role),
)
.route(
    "/system/roles/{id}",
    get(roles::get_role)
        .put(roles::update_role)
        .delete(roles::delete_role),
)
.route(
    "/system/roles/{id}/menus",
    get(roles::role_menus).put(roles::set_role_menus),
)
.route(
    "/system/roles/{id}/depts",
    get(roles::role_depts).put(roles::set_role_depts),
)
.route(
    "/system/menus",
    get(resources::list_menus).post(resources::create_menu),
)
.route(
    "/system/menus/{id}",
    get(resources::get_menu)
        .put(resources::update_menu)
        .delete(resources::delete_menu),
)
.route(
    "/system/depts",
    get(resources::list_depts).post(resources::create_dept),
)
.route(
    "/system/depts/{id}",
    get(resources::get_dept)
        .put(resources::update_dept)
        .delete(resources::delete_dept),
)
.route(
    "/system/posts",
    get(resources::list_posts).post(resources::create_post),
)
.route(
    "/system/posts/{id}",
    get(resources::get_post)
        .put(resources::update_post)
        .delete(resources::delete_post),
)
```

- [ ] **Step 2: Add monitor health aliases**

In backend `src/modules/health.rs`, add monitor routes:

```rust
Router::new()
    .route("/healthz", get(healthz))
    .route("/health", get(healthz))
    .route("/readyz", get(readyz))
    .route("/monitor/healthz", get(healthz))
    .route("/monitor/readyz", get(readyz))
```

- [ ] **Step 3: Add monitor file health alias**

In backend `src/modules/file/mod.rs`, add:

```rust
Router::new()
    .route("/files", post(upload_file))
    .route("/files/health", get(file_health))
    .route("/monitor/files/health", get(file_health))
```

- [ ] **Step 4: Keep audit coverage for new paths**

In backend `src/middleware/audit.rs`, update `should_audit` to:

```rust
fn should_audit(method: &Method, path: &str) -> bool {
    !matches!(method, &Method::GET | &Method::HEAD | &Method::OPTIONS)
        && (path.starts_with("/api/admin")
            || path.starts_with("/api/system")
            || path.starts_with("/api/notices")
            || path.starts_with("/api/scheduler"))
}
```

This currently already includes `/api/system`; keep or confirm it remains present.

- [ ] **Step 5: Add backend route smoke tests where existing unit tests allow**

If no router integration test harness exists, run compile/tests instead of adding broad new harness. Run:

```bash
cargo fmt --check
cargo test
```

Expected: all existing tests pass and route aliases compile.

---

### Task 5: OpenAPI And Verification Docs

**Files:**
- Modify: `/Volumes/sn@root/Documents/workspaces/voh/chromium/one-browser-server/src/modules/docs.rs`
- Modify: `/Volumes/sn@root/Documents/workspaces/voh/chromium/one-browser-server/docs/verification.md`

- [ ] **Step 1: Replace primary OpenAPI paths**

In backend `src/modules/docs.rs`, update the path list so primary management paths use:

```text
/api/system/users
/api/system/users/{id}
/api/system/users/{id}/roles
/api/system/users/{id}/posts
/api/system/roles
/api/system/roles/{id}
/api/system/roles/{id}/menus
/api/system/roles/{id}/depts
/api/system/menus
/api/system/menus/{id}
/api/system/depts
/api/system/depts/{id}
/api/system/posts
/api/system/posts/{id}
/api/monitor/healthz
/api/monitor/readyz
/api/monitor/files/health
```

Keep dict paths under `/api/system/dict-types` and `/api/system/dict-data`.

- [ ] **Step 2: Update docs tests if they assert exact paths**

In the `openapi_contains_core_paths` test in `src/modules/docs.rs`, assert new paths:

```rust
assert!(document["paths"]["/api/system/users"].is_object());
assert!(document["paths"]["/api/system/roles"].is_object());
assert!(document["paths"]["/api/system/menus"].is_object());
assert!(document["paths"]["/api/system/depts"].is_object());
assert!(document["paths"]["/api/monitor/files/health"].is_object());
```

- [ ] **Step 3: Update verification curl examples**

In backend `docs/verification.md`, replace examples:

```text
/api/healthz -> /api/monitor/healthz
/api/readyz -> /api/monitor/readyz
/api/admin/users -> /api/system/users
/api/admin/roles -> /api/system/roles
/api/admin/menus -> /api/system/menus
/api/admin/depts -> /api/system/depts
/api/admin/posts -> /api/system/posts
/api/files/health -> /api/monitor/files/health
```

Add one sentence:

```md
Legacy compatibility routes such as `/api/admin/users`, `/api/healthz`, `/api/readyz`, and `/api/files/health` remain available during the route transition.
```

- [ ] **Step 4: Verify backend docs tests**

Run:

```bash
cargo fmt --check
cargo test
```

Expected: docs module tests pass.

---

### Task 6: Dashboard Workbench Redesign

**Files:**
- Create: `src/page/dashboard/workbench/dashboard-overview.tsx`
- Modify: `src/page/dashboard/components/dashboard-section.tsx`

- [ ] **Step 1: Replace simple count cards with workbench sections**

Implement these sections in `DashboardOverview`:

```tsx
return (
  <div className="flex flex-col gap-4 px-4 lg:px-6">
    {data.currentUser.error ? (
      <Alert variant="destructive">
        <AlertTitle>需要登录</AlertTitle>
        <AlertDescription>
          {getErrorMessage(data.currentUser.error)}
        </AlertDescription>
      </Alert>
    ) : null}

    <StatusStrip data={data} />

    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {resourceCards.slice(0, 4).map((card) => (
        <ResourceSummaryCard key={card.title} card={card} />
      ))}
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
      <ResourceOverview cards={resourceCards} />
      <QuickActions />
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <HealthCard query={data.health} />
      <ReadinessCard query={data.readiness} />
      <FileHealthCard query={data.fileHealth} />
    </div>
  </div>
)
```

- [ ] **Step 2: Add compact status strip**

Add a `StatusStrip` helper:

```tsx
function StatusStrip({ data }: { data: DashboardDataQueries }) {
  const user = data.currentUser.data
  const environment = data.health.data?.environment ?? "unknown"
  const serviceStatus = data.health.data?.status ?? "unknown"
  const readyStatus = data.readiness.data?.status ?? "unknown"

  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusItem label="当前用户" value={user?.nick_name ?? user?.user_name ?? "未登录"} />
        <StatusItem label="运行环境" value={environment} />
        <StatusItem label="服务状态" value={serviceStatus} />
        <StatusItem label="依赖状态" value={readyStatus} />
      </CardContent>
    </Card>
  )
}
```

Use a `StatusItem` helper with small label/value text and semantic muted color.

- [ ] **Step 3: Add resource overview list**

Add `ResourceOverview` that shows all resource cards in a compact list using `Card`, `CardHeader`, `CardContent`, and `Badge`. It should include users, roles, menus, depts, posts, dict types, and dict data.

- [ ] **Step 4: Add quick actions using NavLink**

Import `NavLink` and route constants:

```tsx
import { NavLink } from "react-router"
import { DASHBOARD_ROUTE_BY_ID } from "../constants"
```

Add `QuickActions` with shadcn `Button` links:

```tsx
const quickActions = [
  { label: "用户管理", routeId: "users" },
  { label: "角色管理", routeId: "roles" },
  { label: "菜单管理", routeId: "menus" },
  { label: "健康检查", routeId: "health" },
] as const
```

Render each with:

```tsx
<Button asChild variant="outline" size="sm">
  <NavLink to={DASHBOARD_ROUTE_BY_ID[action.routeId].path}>
    {action.label}
  </NavLink>
</Button>
```

- [ ] **Step 5: Keep health cards compact**

Keep `HealthCard`, `ReadinessCard`, and `FileHealthCard`, but remove duplicated outer `px-4 lg:px-6` because the parent now owns page padding.

- [ ] **Step 6: Verify dashboard compiles**

Run:

```bash
pnpm typecheck
```

Expected: dashboard overview has no missing helper or route-id type errors.

---

### Task 7: Resource Table Shell Refinement

**Files:**
- Create: `src/page/dashboard/resources/table/index.tsx`
- Create: `src/page/dashboard/resources/table/column-header.tsx`
- Create: `src/page/dashboard/resources/table/skeleton.tsx`
- Create: `src/page/dashboard/resources/table/utils.ts`
- Modify: `src/page/dashboard/resources/manager.tsx`

- [ ] **Step 1: Fix table indentation and footer text**

In `resource-table.tsx`, ensure `<TableHeader>` and `<TableBody>` are indented inside `<Table>`, and replace:

```tsx
第 {table.getState().pagination.pageIndex + 1} /{" "}
{Math.max(table.getPageCount(), 1)}
{" "}页
```

with:

```tsx
第 {table.getState().pagination.pageIndex + 1} /{" "}
{Math.max(table.getPageCount(), 1)} 页
```

- [ ] **Step 2: Make table card denser**

Change the table card/header/footer classes:

```tsx
<Card className="overflow-hidden shadow-none">
  <CardHeader className="gap-3 border-b py-4">
  ...
  <CardFooter className="flex flex-col gap-3 border-t py-3 sm:flex-row sm:justify-between">
```

- [ ] **Step 3: Adjust ResourceManager spacing**

In `resource-manager.tsx`, keep page padding but avoid wrapping in extra card-like UI:

```tsx
return (
  <div className="px-4 lg:px-6">
    <ResourceTable
      title={config.noun}
      description={`维护${config.noun}数据，支持查询、新增、编辑和删除。`}
      ...
    />
    ...
  </div>
)
```

- [ ] **Step 4: Verify frontend formatting and types**

Run:

```bash
pnpm typecheck
pnpm lint
```

Expected: no lint or TypeScript errors from table shell edits.

---

### Task 8: Resource Module Structure And Toast Feedback

**Files:**
- Move: `src/page/dashboard/components/resource-manager.tsx` to `src/page/dashboard/resources/manager.tsx`
- Move: `src/page/dashboard/components/resource-editor-dialog.tsx` to `src/page/dashboard/resources/editor-dialog.tsx`
- Move: `src/page/dashboard/resource-columns.tsx` to `src/page/dashboard/resources/columns.tsx`
- Move: `src/page/dashboard/resource-configs.ts` to `src/page/dashboard/resources/configs.ts`
- Move: `src/page/dashboard/resource-form.ts` to `src/page/dashboard/resources/form.ts`
- Create: `src/page/dashboard/resources/toast.ts`
- Modify: `src/page/dashboard/components/dashboard-section.tsx`

- [ ] **Step 1: Create resource module folders and move files**

Use regular file moves for the existing resource implementation, then update imports so `components/` only keeps page orchestration.

- [ ] **Step 2: Centralize toast feedback**

Create `src/page/dashboard/resources/toast.ts`:

```ts
import { toast } from "sonner"

export function showResourceCreateSuccess(noun: string) {
  toast.success(`${noun}创建成功`, {
    description: "数据已写入后台，列表已刷新。",
  })
}

export function showResourceUpdateSuccess(noun: string) {
  toast.success(`${noun}保存成功`, {
    description: "变更已同步到后台，列表已刷新。",
  })
}

export function showResourceDeleteSuccess(noun: string) {
  toast.success(`${noun}删除成功`, {
    description: "记录已从当前列表移除。",
  })
}

export function showResourceError(error: unknown) {
  toast.error(getErrorMessage(error), {
    description: "请检查输入内容或稍后重试。",
  })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "操作失败"
}
```

- [ ] **Step 3: Use toast helpers from resource manager**

In `src/page/dashboard/resources/manager.tsx`, replace direct `toast.success` and `toast.error` calls with imports from `./toast`.

- [ ] **Step 4: Verify moved module imports**

Run:

```bash
pnpm typecheck
```

Expected: no missing module errors after moving resource files.

---

### Task 9: Full Verification

**Files:**
- No code edits unless verification exposes a specific failure.

- [ ] **Step 1: Run frontend checks**

Run in `/Volumes/sn@root/Documents/workspaces/voh/chromium/one-browser-web`:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands pass.

- [ ] **Step 2: Run backend checks**

Run in `/Volumes/sn@root/Documents/workspaces/voh/chromium/one-browser-server`:

```bash
cargo fmt --check
cargo test
```

Expected: all commands pass.

- [ ] **Step 3: Manual route smoke list**

When the dev servers are available, verify these URLs:

```text
Frontend:
/dashboard
/dashboard/system/users
/dashboard/users
/dashboard/monitor/health
/dashboard/health

Backend:
/api/system/users
/api/admin/users
/api/monitor/readyz
/api/readyz
/api/monitor/files/health
/api/files/health
```

Expected: canonical and legacy URLs resolve to the same behavior.
