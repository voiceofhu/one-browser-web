import { http } from "@/lib/request"

import type { AppPermissionResource } from "@/types/admin"

export function listAppPermissions() {
  return http.get<AppPermissionResource[]>("/system/app-permissions")
}
