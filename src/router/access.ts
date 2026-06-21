import { flattenAuthRoutePaths } from "@/lib/auth-permissions"
import type { AuthPermissions } from "@/types/admin"

import {
  APP_ROUTE_BY_ID,
  APP_ROUTE_BY_PATH,
  APP_ROUTE_GROUPS,
  APP_ROUTES,
  DEFAULT_APP_ROUTE,
  LEGACY_ROUTE_REDIRECTS,
  type AppRouteId,
} from "./routes"

const LOCAL_ROUTE_ALIASES: Record<string, string> = {
  "/system/dict/type": "/system/dict",
  "/system/dict/data": "/system/dict",
}

const AUTHENTICATED_LOCAL_ROUTES = new Set<AppRouteId>(["account"])

export function getAuthorizedRouteIds(access: AuthPermissions | undefined) {
  if (!access) {
    return [] as AppRouteId[]
  }

  const allowedPaths = flattenAuthRoutePaths(access.routes)
  return APP_ROUTES.filter((route) => allowedPaths.has(route.path)).map(
    (route) => route.id
  )
}

export function getAuthorizedRouteGroups(access: AuthPermissions | undefined) {
  const routeIds = new Set(getAuthorizedRouteIds(access))

  return APP_ROUTE_GROUPS.map((group) => ({
    ...group,
    routes: group.routes.filter((routeId) => routeIds.has(routeId)),
  })).filter((group) => group.routes.length > 0)
}

export function getFirstAuthorizedPath(access: AuthPermissions | undefined) {
  const routeIds = getAuthorizedRouteIds(access)
  const defaultRoute = APP_ROUTE_BY_ID[DEFAULT_APP_ROUTE]

  if (routeIds.includes(DEFAULT_APP_ROUTE)) {
    return defaultRoute.path
  }

  return routeIds.length > 0 ? APP_ROUTE_BY_ID[routeIds[0]].path : null
}

export function getRouteAccessTarget(pathname: string) {
  return (
    LOCAL_ROUTE_ALIASES[pathname] ??
    LEGACY_ROUTE_REDIRECTS[pathname] ??
    pathname
  )
}

export function isAuthorizedPath(
  access: AuthPermissions | undefined,
  pathname: string
) {
  if (pathname === "/") {
    return true
  }

  const target = getRouteAccessTarget(pathname)
  const route = APP_ROUTE_BY_PATH[target]
  if (!route) {
    return false
  }

  if (AUTHENTICATED_LOCAL_ROUTES.has(route.id)) {
    return true
  }

  return getAuthorizedRouteIds(access).includes(route.id)
}
