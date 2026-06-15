import { buildQueryPath, http } from "@/lib/request"

import type { ListParams, PageResponse, UserResource } from "@/types/admin"

type UserPayload = Record<string, unknown>
type IdsPayload = {
  ids: number[]
}

const USER_PATH = "/system/user"

export function listUsers(params?: ListParams) {
  return http.get<PageResponse<UserResource>>(buildQueryPath(USER_PATH, params))
}

export function createUser(payload: UserPayload) {
  return http.post<UserResource>(USER_PATH, payload)
}

export function updateUser(userId: number, payload: UserPayload) {
  return http.put<UserResource>(`${USER_PATH}/${userId}`, payload)
}

export function deleteUser(userId: number) {
  return http.del<void>(`${USER_PATH}/${userId}`)
}

export function getUserRoleIds(userId: number) {
  return http.get<IdsPayload>(`${USER_PATH}/${userId}/role`)
}

export function setUserRoleIds(userId: number, roleIds: number[]) {
  return http.put<void>(`${USER_PATH}/${userId}/role`, { ids: roleIds })
}

export function getUserPostIds(userId: number) {
  return http.get<IdsPayload>(`${USER_PATH}/${userId}/post`)
}

export function setUserPostIds(userId: number, postIds: number[]) {
  return http.put<void>(`${USER_PATH}/${userId}/post`, { ids: postIds })
}

export function setUserStatus(userId: number, status: "0" | "1") {
  return http.put<UserResource>(`${USER_PATH}/${userId}/status`, { status })
}

export function resetUserPassword(userId: number, password: string) {
  return http.put<void>(`${USER_PATH}/${userId}/reset-password`, { password })
}
