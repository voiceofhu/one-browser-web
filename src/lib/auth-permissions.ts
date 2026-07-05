import type {
  AuthPermissions,
  AuthRoute,
  AuthTeamPermissionEntry,
} from "@/types/admin"

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

  return hasGlobalPermission(access, permission)
}

export function hasTeamPermission(
  access: AuthPermissions | undefined,
  teamId: number | string | null | undefined,
  permission?: string
) {
  if (!permission) {
    return true
  }
  if (!access) {
    return false
  }

  const teamPermissions = getTeamPermissionList(access, teamId)

  if (!teamPermissions) {
    return hasPermission(access, permission)
  }

  return (
    hasGlobalPermissionForTeamCheck(access, permission) ||
    teamPermissions.includes(ALL_PERMISSION) ||
    teamPermissions.includes(permission)
  )
}

export function hasAnyPermission(
  access: AuthPermissions | undefined,
  permissions: Array<string | undefined>
) {
  return permissions.some((permission) => hasPermission(access, permission))
}

export function hasAnyTeamPermission(
  access: AuthPermissions | undefined,
  teamId: number | string | null | undefined,
  permissions: Array<string | undefined>
) {
  return permissions.some((permission) =>
    hasTeamPermission(access, teamId, permission)
  )
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

function hasGlobalPermission(access: AuthPermissions, permission: string) {
  return (
    access.permissions.includes(ALL_PERMISSION) ||
    access.permissions.includes(permission)
  )
}

function hasGlobalPermissionForTeamCheck(
  access: AuthPermissions,
  permission: string
) {
  const permissions =
    access.global_permissions ??
    (typeof access.team_permissions === "undefined" ? access.permissions : [])

  return (
    permissions.includes(ALL_PERMISSION) || permissions.includes(permission)
  )
}

function getTeamPermissionList(
  access: AuthPermissions,
  teamId: number | string | null | undefined
) {
  const teamPermissions = access.team_permissions

  if (typeof teamPermissions === "undefined") {
    return null
  }
  if (teamId === null || typeof teamId === "undefined") {
    return []
  }

  const normalizedTeamId = String(teamId)

  if (Array.isArray(teamPermissions)) {
    return getTeamPermissionListFromEntries(teamPermissions, normalizedTeamId)
  }
  if (isRecord(teamPermissions)) {
    return normalizeTeamPermissionValue(teamPermissions[normalizedTeamId]) ?? []
  }

  return []
}

function getTeamPermissionListFromEntries(
  teamPermissions: AuthTeamPermissionEntry[],
  teamId: string
) {
  for (const entry of teamPermissions) {
    if (String(entry.team_id) === teamId) {
      return normalizeTeamPermissionValue(entry.permissions) ?? []
    }
  }

  return []
}

function normalizeTeamPermissionValue(value: unknown) {
  const permissions = normalizePermissionList(value)

  if (permissions) {
    return permissions
  }
  if (isRecord(value)) {
    return normalizePermissionList(value.permissions)
  }

  return null
}

function normalizePermissionList(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  return value.filter((permission): permission is string => {
    return typeof permission === "string"
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}
