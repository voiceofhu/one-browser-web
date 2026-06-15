import { buildQueryPath, http } from "@/lib/request"

import type { ListParams, PageResponse, RoleResource } from "@/types/admin"

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

export function deleteRole(roleId: number) {
  return http.del<void>(`${ROLE_PATH}/${roleId}`)
}
