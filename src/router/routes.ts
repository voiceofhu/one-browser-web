export type AppRouteId =
  | "overview"
  | "users"
  | "roles"
  | "menus"
  | "depts"
  | "posts"
  | "dict-types"
  | "dict-data"
  | "health"

export interface AppRouteMeta {
  id: AppRouteId
  label: string
  title: string
  description: string
  path: string
}

export const DEFAULT_APP_ROUTE: AppRouteId = "overview"

export const APP_ROUTES: AppRouteMeta[] = [
  {
    id: "overview",
    label: "首页",
    title: "首页",
    description: "查看系统资源、运行状态和快捷入口。",
    path: "/index",
  },
  {
    id: "users",
    label: "用户管理",
    title: "用户管理",
    description: "管理后台账号、资料和启用状态。",
    path: "/system/user",
  },
  {
    id: "roles",
    label: "角色管理",
    title: "角色管理",
    description: "管理角色标识、数据权限和启用状态。",
    path: "/system/role",
  },
  {
    id: "menus",
    label: "菜单管理",
    title: "菜单管理",
    description: "管理菜单路由、权限标识和可见状态。",
    path: "/system/menu",
  },
  {
    id: "depts",
    label: "部门管理",
    title: "部门管理",
    description: "管理当前数据范围内的组织部门。",
    path: "/system/dept",
  },
  {
    id: "posts",
    label: "岗位管理",
    title: "岗位管理",
    description: "管理组织岗位编码、排序和状态。",
    path: "/system/post",
  },
  {
    id: "dict-types",
    label: "字典类型",
    title: "字典类型",
    description: "管理系统字典类型定义。",
    path: "/system/dict/type",
  },
  {
    id: "dict-data",
    label: "字典数据",
    title: "字典数据",
    description: "管理各字典类型下的键值数据。",
    path: "/system/dict/data",
  },
  {
    id: "health",
    label: "服务监控",
    title: "服务监控",
    description: "查看应用、数据库和缓存的运行状态。",
    path: "/monitor/health",
  },
]

export const APP_ROUTE_GROUPS = [
  {
    label: "首页",
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
  routes: AppRouteId[]
}[]

export const APP_ROUTE_BY_ID = APP_ROUTES.reduce(
  (routes, route) => {
    routes[route.id] = route
    return routes
  },
  {} as Record<AppRouteId, AppRouteMeta>
)

export const APP_ROUTE_BY_PATH = APP_ROUTES.reduce(
  (routes, route) => {
    routes[route.path] = route
    return routes
  },
  {} as Record<string, AppRouteMeta>
)

export const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
  "/dashboard": "/index",
  "/dashboard/users": "/system/user",
  "/dashboard/system/users": "/system/user",
  "/dashboard/roles": "/system/role",
  "/dashboard/system/roles": "/system/role",
  "/dashboard/menus": "/system/menu",
  "/dashboard/system/menus": "/system/menu",
  "/dashboard/depts": "/system/dept",
  "/dashboard/system/depts": "/system/dept",
  "/dashboard/posts": "/system/post",
  "/dashboard/system/posts": "/system/post",
  "/dashboard/dict-types": "/system/dict/type",
  "/dashboard/system/dict-types": "/system/dict/type",
  "/dashboard/dict-data": "/system/dict/data",
  "/dashboard/system/dict-data": "/system/dict/data",
  "/dashboard/health": "/monitor/health",
  "/dashboard/monitor/health": "/monitor/health",
}

export const STATUS_LABELS = {
  "0": "启用",
  "1": "停用",
} as const

export const SEX_LABELS = {
  "0": "男",
  "1": "女",
  "2": "未知",
} as const

export const DATA_SCOPE_LABELS = {
  "1": "全部数据",
  "2": "本部门数据",
  "3": "本部门及以下",
  "4": "自定义数据",
  "5": "仅本人数据",
} as const

export const MENU_TYPE_LABELS = {
  M: "目录",
  C: "菜单",
  F: "按钮",
} as const

export const VISIBLE_LABELS = {
  "0": "显示",
  "1": "隐藏",
} as const

export const YES_NO_LABELS = {
  Y: "是",
  N: "否",
} as const

export function getLabel<T extends string>(
  labels: Partial<Record<T, string>>,
  value: T
) {
  return labels[value] ?? value
}
