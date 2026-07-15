import { buildQueryPath, http } from "@/lib/request"

import type {
  ListParams,
  PageResponse,
  ResourceMutationResult,
  UserRoleBindings,
  UserResource,
} from "@/types/admin"

type UserPayload = Record<string, unknown>
const USER_PATH = "/system/users"

export function listUsers(params?: ListParams) {
  return http.get<PageResponse<UserResource>>(buildQueryPath(USER_PATH, params))
}

export function getUser(userId: number) {
  return http.get<UserResource>(`${USER_PATH}/${userId}`)
}

export function createUser(payload: UserPayload) {
  return http.post<ResourceMutationResult>(USER_PATH, payload)
}

export function updateUser(userId: number, payload: UserPayload) {
  return http.put<UserResource>(`${USER_PATH}/${userId}`, payload)
}

export function deleteUser(userId: number) {
  return http.del<void>(`${USER_PATH}/${userId}`)
}

export function getUserRoleBindings(userId: number) {
  return http.get<UserRoleBindings>(`${USER_PATH}/${userId}/roles`)
}

export function setUserRoleBindings(userId: number, roleId: number) {
  return http.put<void>(`${USER_PATH}/${userId}/roles`, {
    role_id: roleId,
  })
}

export function setUserStatus(userId: number, status: "0" | "1") {
  return http.put<UserResource>(`${USER_PATH}/${userId}/status`, { status })
}

export function resetUserPassword(userId: number, password: string) {
  return http.post<void>(`${USER_PATH}/${userId}/password-reset`, { password })
}
