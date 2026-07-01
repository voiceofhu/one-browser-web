import type { AuthPermissions, AuthRoute } from "@/types/admin"
import { stripLocaleFromPathname } from "@/local"

import {
  APP_ROUTE_BY_ID,
  APP_ROUTE_BY_PATH,
  APP_ROUTE_GROUPS,
  DEFAULT_APP_ROUTE,
  LEGACY_ROUTE_REDIRECTS,
  type AppRouteId,
} from "./routes"

export type AuthorizedRouteIconValueMap = Map<AppRouteId, string | null>

const LOCAL_ROUTE_ALIASES: Record<string, string> = {
  "/system/dict/type": "/system/dict",
  "/system/dict/data": "/system/dict",
}

const AUTHENTICATED_LOCAL_ROUTES = new Set<AppRouteId>(["account"])

export function getAuthorizedRouteIds(access: AuthPermissions | undefined) {
  return orderRouteIds(
    getAuthorizedRouteEntries(access).map((entry) => entry.routeId)
  )
}

export function getAuthorizedRouteGroups(access: AuthPermissions | undefined) {
  const authorizedRouteIds = new Set(getAuthorizedRouteIds(access))

  return APP_ROUTE_GROUPS.map((group) => ({
    ...group,
    routes: group.routes.filter((routeId) => authorizedRouteIds.has(routeId)),
  })).filter((group) => group.routes.length > 0)
}

export function getAuthorizedRouteIconValues(
  access: AuthPermissions | undefined
): AuthorizedRouteIconValueMap {
  const iconValues: AuthorizedRouteIconValueMap = new Map()

  getAuthorizedRouteEntries(access).forEach(({ routeId, authRoute }) => {
    iconValues.set(
      routeId,
      isDirectoryAuthRoute(authRoute) ? null : authRoute.meta.icon
    )
  })

  return iconValues
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
  const routePathname = stripLocaleFromPathname(pathname)

  return (
    LOCAL_ROUTE_ALIASES[routePathname] ??
    LEGACY_ROUTE_REDIRECTS[routePathname] ??
    routePathname
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

function getAuthorizedRouteEntries(access: AuthPermissions | undefined) {
  if (!access) {
    return [] as { routeId: AppRouteId; authRoute: AuthRoute }[]
  }

  const entries: { routeId: AppRouteId; authRoute: AuthRoute }[] = []
  const seenRouteIds = new Set<AppRouteId>()

  for (const authRoute of flattenAuthRoutesInOrder(access.routes)) {
    const route = APP_ROUTE_BY_PATH[getRouteAccessTarget(authRoute.path)]
    if (!route || seenRouteIds.has(route.id)) {
      continue
    }

    seenRouteIds.add(route.id)
    entries.push({ routeId: route.id, authRoute })
  }

  return entries
}

function orderRouteIds(routeIds: AppRouteId[]) {
  const routeIdSet = new Set(routeIds)
  const orderedRouteIds: AppRouteId[] = APP_ROUTE_GROUPS.flatMap((group) =>
    group.routes.filter((routeId) => routeIdSet.has(routeId))
  )
  const orderedRouteIdSet = new Set(orderedRouteIds)

  return [
    ...orderedRouteIds,
    ...routeIds.filter((routeId) => !orderedRouteIdSet.has(routeId)),
  ]
}

function flattenAuthRoutesInOrder(routes: AuthRoute[] | undefined) {
  const flattenedRoutes: AuthRoute[] = []

  function visit(route: AuthRoute) {
    flattenedRoutes.push(route)

    route.children?.forEach(visit)
  }

  routes?.forEach(visit)
  return flattenedRoutes
}

function isDirectoryAuthRoute(route: AuthRoute) {
  return route.menu_type === "M"
}
