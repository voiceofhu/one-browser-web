import { http } from "@/lib/request"

import type { CurrentUser, HealthResponse } from "@/types/admin"

export interface IndexOverviewResponse {
  current_user: CurrentUser
  health: OverviewSection<HealthResponse>
  resources: IndexOverviewResources
  recent: IndexOverviewRecentResource[]
}

export interface OverviewSection<T> {
  data: T | null
  error: string | null
}

export interface IndexOverviewResources {
  users: IndexOverviewCount
  roles: IndexOverviewCount
  menus: IndexOverviewCount
  dict_types: IndexOverviewCount
  dict_data: IndexOverviewCount
  notices: IndexOverviewCount
}

export interface IndexOverviewCount {
  total: number
  error: string | null
}

export interface IndexOverviewRecentResource {
  kind: string
  name: string
  created_at: string
}

export function getIndexOverview() {
  return http.get<IndexOverviewResponse>("/index/overview")
}
