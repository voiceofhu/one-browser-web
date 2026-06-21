import { buildQueryPath, http } from "@/lib/request"

import type {
  ListParams,
  PageResponse,
  RoleResource,
  StatusFlag,
} from "@/types/admin"

type RolePayload = Record<string, unknown>

const ROLE_PATH = "/system/role"

export function listRoles(params?: ListParams) {
  return http.get<PageResponse<RoleResource>>(buildQueryPath(ROLE_PATH, params))
}

export function createRole(payload: RolePayload) {
  return http.post<RoleResource>(ROLE_PATH, payload)
}

export function updateRole(roleId: number, payload: RolePayload) {
  return http.put<RoleResource>(`${ROLE_PATH}/${roleId}`, payload)
}

export function setRoleStatus(role: RoleResource, status: StatusFlag) {
  return updateRole(role.role_id, {
    role_name: role.role_name,
    role_key: role.role_key,
    role_sort: role.role_sort,
    data_scope: role.data_scope,
    status,
    remark: role.remark,
  })
}

export function deleteRole(roleId: number) {
  return http.del<void>(`${ROLE_PATH}/${roleId}`)
}

export function getRoleMenuIds(roleId: number) {
  return http.get<{ ids: number[] }>(`${ROLE_PATH}/${roleId}/menu`)
}

export function setRoleMenuIds(roleId: number, menuIds: number[]) {
  return http.put<void>(`${ROLE_PATH}/${roleId}/menu`, { ids: menuIds })
}
