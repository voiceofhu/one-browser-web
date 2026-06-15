import { http } from "@/lib/request"

import type { HealthResponse } from "@/types/admin"

export function getHealth() {
  return http.get<HealthResponse>("/monitor/health")
}
