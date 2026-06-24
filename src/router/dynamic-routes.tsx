/* eslint-disable react-refresh/only-export-components */
import { lazy, type ReactNode } from "react"

import { getAuthorizedRouteIds } from "@/router/access"
import type { AuthPermissions } from "@/types/admin"

import { APP_ROUTE_BY_ID, type AppRouteId } from "./routes"

const AccountProfilePage = lazy(() => import("@/views/account/profile"))
const IndexPage = lazy(() => import("@/views/index"))
const HealthPage = lazy(() => import("@/views/monitor/health"))
const JobsPage = lazy(() => import("@/views/monitor/job"))
const OnlineUsersPage = lazy(() => import("@/views/monitor/online"))
const BrowserTeamPage = lazy(() => import("@/views/browser/team"))
const BrowserEnvironmentPage = lazy(() => import("@/views/browser/environment"))
const BrowserProxyPage = lazy(() => import("@/views/browser/proxy"))
const BrowserMemberPage = lazy(() => import("@/views/browser/member"))
const UserPage = lazy(() => import("@/views/system/user"))
const RolePage = lazy(() => import("@/views/system/role"))
const MenuPage = lazy(() => import("@/views/system/menu"))
const DeptPage = lazy(() => import("@/views/system/dept"))
const PostPage = lazy(() => import("@/views/system/post"))
const DictTypePage = lazy(() => import("@/views/system/dict/type"))
const NoticePage = lazy(() => import("@/views/system/notice"))
const OperationLogPage = lazy(() => import("@/views/system/log/operation"))
const LoginLogPage = lazy(() => import("@/views/system/log/login"))

export type DynamicRouteElement = {
  id: AppRouteId
  path: string
  element: ReactNode
}

export type DynamicRouteRedirect = {
  key: string
  path: string
  to: string
}

const APP_ROUTE_ELEMENTS: Record<AppRouteId, ReactNode> = {
  overview: <IndexPage />,
  account: <AccountProfilePage />,
  users: <UserPage />,
  roles: <RolePage />,
  menus: <MenuPage />,
  depts: <DeptPage />,
  posts: <PostPage />,
  dict: <DictTypePage />,
  notices: <NoticePage />,
  "browser-teams": <BrowserTeamPage />,
  "browser-environments": <BrowserEnvironmentPage />,
  "browser-proxies": <BrowserProxyPage />,
  "browser-members": <BrowserMemberPage />,
  "operation-logs": <OperationLogPage />,
  "login-logs": <LoginLogPage />,
  health: <HealthPage />,
  "online-users": <OnlineUsersPage />,
  jobs: <JobsPage />,
}

const LOCAL_AUTHENTICATED_ROUTE_IDS = [
  "account",
] as const satisfies AppRouteId[]

const ROUTE_REDIRECTS: Partial<Record<AppRouteId, DynamicRouteRedirect[]>> = {
  dict: [
    {
      key: "system-dict-type",
      path: "system/dict/type",
      to: "/system/dict",
    },
    {
      key: "system-dict-data",
      path: "system/dict/data",
      to: "/system/dict",
    },
  ],
}

export function getAuthorizedDynamicRouteElements(
  access: AuthPermissions | undefined
) {
  return routeElementsForIds(getAuthorizedRouteIds(access))
}

export function getLocalAuthenticatedRouteElements() {
  return routeElementsForIds(LOCAL_AUTHENTICATED_ROUTE_IDS)
}

export function getAuthorizedDynamicRouteRedirects(
  access: AuthPermissions | undefined
) {
  return getAuthorizedRouteIds(access).flatMap(
    (routeId) => ROUTE_REDIRECTS[routeId] ?? []
  )
}

function routeElementsForIds(routeIds: readonly AppRouteId[]) {
  return routeIds.map((routeId) => ({
    id: routeId,
    path: toNestedRoutePath(APP_ROUTE_BY_ID[routeId].path),
    element: APP_ROUTE_ELEMENTS[routeId],
  }))
}

function toNestedRoutePath(path: string) {
  return path.replace(/^\/+/, "")
}
