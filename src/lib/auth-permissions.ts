import type { AuthPermissions } from "@/types/admin"

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

  return [access.permissions, access.buttons].some((codes) =>
    hasPermissionCode(codes, permission)
  )
}

function hasPermissionCode(codes: string[] | undefined, permission: string) {
  return Boolean(codes?.includes(ALL_PERMISSION) || codes?.includes(permission))
}
