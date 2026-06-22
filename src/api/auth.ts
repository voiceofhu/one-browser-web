import { http } from "@/lib/request"

import type {
  AuthPermissions,
  CurrentUserEnvelope,
  LoginResponse,
  SexFlag,
} from "@/types/admin"

export type UpdateCurrentUserProfilePayload = {
  nick_name: string
  email: string
  phone_number: string
  sex: SexFlag
  avatar: string
}

export type ChangeCurrentUserPasswordPayload = {
  old_password: string
  new_password: string
}

export async function getCurrentUser() {
  const response = await http.get<CurrentUserEnvelope>("/auth/me")
  return response.user
}

export async function updateCurrentUserProfile(
  payload: UpdateCurrentUserProfilePayload
) {
  const response = await http.put<CurrentUserEnvelope>("/auth/me", payload)
  return response.user
}

export async function uploadCurrentUserAvatar(file: File) {
  const formData = new FormData()
  formData.set("file", file)

  const response = await http.post<
    CurrentUserEnvelope & {
      avatar: string
    }
  >("/auth/avatar", formData)
  return response.user
}

export function changeCurrentUserPassword(
  payload: ChangeCurrentUserPasswordPayload
) {
  return http.put<void>("/auth/password", payload)
}

export function getAuthPermissions() {
  return http.get<AuthPermissions>("/auth/permissions")
}

export function login(payload: { username: string; password: string }) {
  return http.post<LoginResponse>("/auth/login", payload)
}

export function logout() {
  return http.post<void>("/auth/logout")
}
