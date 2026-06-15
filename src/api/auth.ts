import { http } from "@/lib/request"

import type { CurrentUserEnvelope, LoginResponse } from "@/types/admin"

export async function getCurrentUser() {
  const response = await http.get<CurrentUserEnvelope>("/auth/me")
  return response.user
}

export function login(payload: { username: string; password: string }) {
  return http.post<LoginResponse>("/auth/login", payload)
}

export function logout() {
  return http.post<void>("/auth/logout")
}
