import type {
  AuthPermissions,
  AuthRoute,
  AuthTeamPermissionEntry,
} from "@/types/admin"

const ALL_PERMISSION = "*"

export function hasPermission(
  access: AuthPermissions | undefined,
  permission?: string,
  teamId?: number | string | null
) {
  if (!permission) {
    return true
  }
  if (!access) {
    return false
  }

  if (teamId && typeof access.team_permissions !== "undefined") {
    return (
      hasPermissionCode(globalPermissions(access), permission) ||
      hasTeamPermissionCode(access, teamId, permission, "permissions")
    )
  }

  return hasPermissionCode(allPermissions(access), permission)
}

export function hasButtonPermission(
  access: AuthPermissions | undefined,
  permission?: string,
  teamId?: number | string | null
) {
  if (!permission) {
    return true
  }
  if (!access) {
    return false
  }

  if (teamId && typeof access.team_permissions !== "undefined") {
    return (
      hasPermissionCode(globalButtons(access), permission) ||
      hasTeamPermissionCode(access, teamId, permission, "buttons")
    )
  }

  return hasPermissionCode(allButtons(access), permission)
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

  if (typeof access.team_permissions === "undefined") {
    return hasPermissionCode(allPermissions(access), permission)
  }

  return (
    hasPermissionCode(globalPermissions(access), permission) ||
    hasTeamPermissionCode(access, teamId, permission, "permissions")
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

export function hasAnyTeamButtonPermission(
  access: AuthPermissions | undefined,
  teamId: number | string | null | undefined,
  permissions: Array<string | undefined>
) {
  return permissions.some((permission) =>
    hasButtonPermission(access, permission, teamId)
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

function hasPermissionCode(codes: string[] | undefined, permission: string) {
  return Boolean(codes?.includes(ALL_PERMISSION) || codes?.includes(permission))
}

function allPermissions(access: AuthPermissions) {
  return mergePermissionCodes(access.permissions, access.global_permissions)
}

function globalPermissions(access: AuthPermissions) {
  return mergePermissionCodes(access.global_permissions, access.permissions)
}

function allButtons(access: AuthPermissions) {
  return mergePermissionCodes(
    access.buttons,
    access.global_buttons,
    access.permissions,
    access.global_permissions
  )
}

function globalButtons(access: AuthPermissions) {
  return mergePermissionCodes(
    access.global_buttons,
    access.buttons,
    access.global_permissions,
    access.permissions
  )
}

function mergePermissionCodes(...sources: Array<string[] | undefined>) {
  const permissions = sources
    .flatMap((source) => source ?? [])
    .filter(
      (permission): permission is string => typeof permission === "string"
    )

  if (permissions.includes(ALL_PERMISSION)) {
    return [ALL_PERMISSION]
  }

  return Array.from(new Set(permissions))
}

function hasTeamPermissionCode(
  access: AuthPermissions,
  teamId: number | string | null | undefined,
  permission: string,
  kind: "permissions" | "buttons"
) {
  const codes = getTeamPermissionList(access, teamId, kind)
  return hasPermissionCode(codes, permission)
}

function getTeamPermissionList(
  access: AuthPermissions,
  teamId: number | string | null | undefined,
  kind: "permissions" | "buttons"
) {
  const teamPermissions = access.team_permissions
  if (typeof teamPermissions === "undefined") {
    return undefined
  }
  if (
    Array.isArray(teamPermissions) &&
    teamPermissions.some((permission) => permission === ALL_PERMISSION)
  ) {
    return [ALL_PERMISSION]
  }
  if (teamId === null || typeof teamId === "undefined") {
    return []
  }
  const normalizedTeamId = String(teamId)

  if (Array.isArray(teamPermissions)) {
    return getTeamPermissionListFromEntries(
      teamPermissions,
      normalizedTeamId,
      kind
    )
  }
  if (isRecord(teamPermissions)) {
    return (
      normalizeTeamPermissionValue(teamPermissions[normalizedTeamId], kind) ??
      []
    )
  }

  return []
}

function getTeamPermissionListFromEntries(
  teamPermissions: Array<string | AuthTeamPermissionEntry>,
  teamId: string,
  kind: "permissions" | "buttons"
) {
  for (const entry of teamPermissions) {
    if (typeof entry === "string") {
      continue
    }
    if (String(entry.team_id) === teamId) {
      return normalizeTeamPermissionValue(entry, kind) ?? []
    }
  }

  return []
}

function normalizeTeamPermissionValue(
  value: unknown,
  kind: "permissions" | "buttons"
) {
  const permissions = normalizePermissionList(value)

  if (permissions) {
    return permissions
  }
  if (isRecord(value)) {
    const scoped =
      kind === "buttons"
        ? (normalizePermissionList(value.buttons) ??
          normalizePermissionList(value.permissions))
        : normalizePermissionList(value.permissions)
    return scoped
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
