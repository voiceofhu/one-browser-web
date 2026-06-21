import type { AuthPermissions, AuthRoute } from "@/types/admin"

const ALL_PERMISSION = "*"

export function hasPermission(
  access: AuthPermissions | undefined,
  permission?: string
) {
  if (!permission) {
    return true
  }
  if (!access) {
    return false
  }

  return (
    access.permissions.includes(ALL_PERMISSION) ||
    access.permissions.includes(permission)
  )
}

export function hasAnyPermission(
  access: AuthPermissions | undefined,
  permissions: Array<string | undefined>
) {
  return permissions.some((permission) => hasPermission(access, permission))
}

export function flattenAuthRoutePaths(routes: AuthRoute[] | undefined) {
  const paths = new Set<string>()

  function visit(route: AuthRoute) {
    if (route.path) {
      paths.add(route.path)
    }
    route.children?.forEach(visit)
  }

  routes?.forEach(visit)
  return paths
}
