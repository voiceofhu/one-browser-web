import { http } from "@/lib/request"

import type { HealthResponse } from "@/types/admin"

export const HEALTH_STREAM_PATH = "/system/monitor/health/stream"

export function getHealth() {
  return http.get<HealthResponse>("/system/monitor/health")
}
