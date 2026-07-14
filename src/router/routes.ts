import type { I18nKey } from "@/local"

export type AppRouteId =
  | "overview"
  | "users"
  | "roles"
  | "menus"
  | "dict"
  | "notices"
  | "operation-logs"
  | "login-logs"
  | "health"
  | "online-users"
  | "jobs"
  | "account"

export interface AppRouteMeta {
  id: AppRouteId
  labelKey: I18nKey
  label: string
  title: string
  description: string
  path: string
}

export const DEFAULT_APP_ROUTE: AppRouteId = "overview"

export const APP_ROUTES: AppRouteMeta[] = [
  {
    id: "overview",
    labelKey: "route.overview",
    label: "首页",
    title: "首页",
    description: "查看系统资源、运行状态和快捷入口。",
    path: "/index",
  },
  {
    id: "users",
    labelKey: "route.users",
    label: "用户管理",
    title: "用户管理",
    description: "管理后台账号、资料和启用状态。",
    path: "/system/user",
  },
  {
    id: "roles",
    labelKey: "route.roles",
    label: "角色管理",
    title: "角色管理",
    description: "管理角色标识、数据权限和启用状态。",
    path: "/system/role",
  },
  {
    id: "menus",
    labelKey: "route.menus",
    label: "权限管理",
    title: "权限管理",
    description: "管理目录、菜单路由和按钮权限标识。",
    path: "/system/menu",
  },
  {
    id: "dict",
    labelKey: "route.dict",
    label: "字典管理",
    title: "字典管理",
    description: "管理系统字典类型，并查看各类型下的字典数据。",
    path: "/system/dict",
  },
  {
    id: "notices",
    labelKey: "route.notices",
    label: "通知管理",
    title: "通知管理",
    description: "管理后台通知公告、发布状态和展示内容。",
    path: "/system/notice",
  },
  {
    id: "operation-logs",
    labelKey: "route.operationLogs",
    label: "操作日志",
    title: "操作日志",
    description: "查看后台写入、修改、删除等操作记录。",
    path: "/system/log/operation",
  },
  {
    id: "login-logs",
    labelKey: "route.loginLogs",
    label: "登录日志",
    title: "登录日志",
    description: "查看后台账号登录成功和失败记录。",
    path: "/system/log/login",
  },
  {
    id: "health",
    labelKey: "route.health",
    label: "服务监控",
    title: "服务监控",
    description: "查看应用、数据库和缓存的运行状态。",
    path: "/monitor/health",
  },
  {
    id: "online-users",
    labelKey: "route.onlineUsers",
    label: "在线用户",
    title: "在线用户",
    description: "查看当前登录会话，并可按需强制用户下线。",
    path: "/monitor/online",
  },
  {
    id: "jobs",
    labelKey: "route.jobs",
    label: "定时任务",
    title: "定时任务",
    description: "管理后台白名单调度任务、状态和手动执行。",
    path: "/monitor/job",
  },
  {
    id: "account",
    labelKey: "route.account",
    label: "个人账号",
    title: "个人账号",
    description: "管理当前登录账号的基础资料。",
    path: "/account/profile",
  },
]

export const APP_ROUTE_GROUPS = [
  {
    id: "overview",
    labelKey: "routeGroup.overview",
    label: "首页",
    routes: ["overview"],
  },
  {
    id: "system",
    labelKey: "routeGroup.system",
    label: "系统管理",
    routes: ["users", "roles", "menus", "dict", "notices"],
  },
  {
    id: "logs",
    labelKey: "routeGroup.logs",
    label: "系统日志",
    routes: ["operation-logs", "login-logs"],
  },
  {
    id: "monitor",
    labelKey: "routeGroup.monitor",
    label: "系统监控",
    routes: ["health", "online-users", "jobs"],
  },
] satisfies {
  id: string
  labelKey: I18nKey
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
  "/dashboard/dict-types": "/system/dict",
  "/dashboard/system/dict-types": "/system/dict",
  "/dashboard/dict-data": "/system/dict",
  "/dashboard/system/dict-data": "/system/dict",
  "/dashboard/system/dict": "/system/dict",
  "/dashboard/notices": "/system/notice",
  "/dashboard/system/notices": "/system/notice",
  "/dashboard/system/notice": "/system/notice",
  "/dashboard/operation-logs": "/system/log/operation",
  "/dashboard/system/operation-logs": "/system/log/operation",
  "/dashboard/system/log/operation": "/system/log/operation",
  "/dashboard/login-logs": "/system/log/login",
  "/dashboard/system/login-logs": "/system/log/login",
  "/dashboard/system/log/login": "/system/log/login",
  "/dashboard/health": "/monitor/health",
  "/dashboard/monitor/health": "/monitor/health",
  "/profile": "/account/profile",
  "/account": "/account/profile",
}

export const STATUS_LABELS = {
  "0": "启用",
  "1": "停用",
} as const

export const SEX_LABELS = {
  "0": "男",
  "1": "女",
  "2": "不愿透露",
} as const

export const DATA_SCOPE_LABELS = {
  "1": "全部数据",
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

export const NOTICE_TYPE_LABELS = {
  "1": "通知",
  "2": "公告",
} as const

export function getLabel<T extends string>(
  labels: Partial<Record<T, string>>,
  value: T
) {
  return labels[value] ?? value
}
