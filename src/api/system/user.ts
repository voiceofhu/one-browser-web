import { buildQueryPath, http } from "@/lib/request"

import type {
  ListParams,
  PageResponse,
  ResourceMutationResult,
  UserResource,
} from "@/types/admin"

type UserPayload = Record<string, unknown>
type IdsPayload = {
  ids: number[]
}

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

export function getUserRoleIds(userId: number) {
  return http.get<IdsPayload>(`${USER_PATH}/${userId}/roles`)
}

export function setUserRoleIds(userId: number, roleIds: number[]) {
  return http.put<void>(`${USER_PATH}/${userId}/roles`, { ids: roleIds })
}

export function getUserPostIds(userId: number) {
  return http.get<IdsPayload>(`${USER_PATH}/${userId}/posts`)
}

export function setUserPostIds(userId: number, postIds: number[]) {
  return http.put<void>(`${USER_PATH}/${userId}/posts`, { ids: postIds })
}

export function setUserStatus(userId: number, status: "0" | "1") {
  return http.put<UserResource>(`${USER_PATH}/${userId}/status`, { status })
}

export function resetUserPassword(userId: number, password: string) {
  return http.post<void>(`${USER_PATH}/${userId}/password-reset`, { password })
}
