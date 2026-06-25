import type { RoleResource } from "@/types/admin"

const SUPER_ADMIN_ROLE_KEY = "super_admin"

export function isSuperAdminRole(role: Pick<RoleResource, "role_key">) {
  return isSuperAdminRoleKey(role.role_key)
}

export function isSuperAdminRoleKey(roleKey: unknown) {
  return (
    typeof roleKey === "string" && roleKey.trim() === SUPER_ADMIN_ROLE_KEY
  )
}
