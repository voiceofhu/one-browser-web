import { buildQueryPath, http } from "@/lib/request"

import type {
  ListParams,
  PageResponse,
  ResourceMutationResult,
  RoleResource,
  StatusFlag,
} from "@/types/admin"

type RolePayload = Record<string, unknown>

type RoleListParams = ListParams & {
  assignable_only?: boolean
}

export type RolePermissions = {
  menu_ids: number[]
  app_permission_ids: number[]
}

const ROLE_PATH = "/system/roles"

export function listRoles(params?: RoleListParams) {
  return http.get<PageResponse<RoleResource>>(buildQueryPath(ROLE_PATH, params))
}

export function getRole(roleId: number) {
  return http.get<RoleResource>(`${ROLE_PATH}/${roleId}`)
}

export function createRole(payload: RolePayload) {
  return http.post<ResourceMutationResult>(ROLE_PATH, payload)
}

export function updateRole(roleId: number, payload: RolePayload) {
  return http.put<RoleResource>(`${ROLE_PATH}/${roleId}`, payload)
}

export function setRoleStatus(role: RoleResource, status: StatusFlag) {
  return updateRole(role.role_id, {
    role_name: role.role_name,
    role_key: role.role_key,
    data_scope: role.data_scope,
    status,
    remark: role.remark,
  })
}

export function deleteRole(roleId: number) {
  return http.del<void>(`${ROLE_PATH}/${roleId}`)
}

export function getRoleMenuIds(roleId: number) {
  return http.get<{ ids: number[] }>(`${ROLE_PATH}/${roleId}/menus`)
}

export function setRoleMenuIds(roleId: number, menuIds: number[]) {
  return http.put<void>(`${ROLE_PATH}/${roleId}/menus`, { ids: menuIds })
}

export function getRolePermissions(roleId: number) {
  return http.get<RolePermissions>(`${ROLE_PATH}/${roleId}/permissions`)
}

export function setRolePermissions(
  roleId: number,
  permissions: RolePermissions
) {
  return http.put<void>(`${ROLE_PATH}/${roleId}/permissions`, permissions)
}
