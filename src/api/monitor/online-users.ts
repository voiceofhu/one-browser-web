import { buildQueryPath, http } from "@/lib/request"

import type {
  OnlineUserListParams,
  OnlineUserResource,
  PageResponse,
} from "@/types/admin"

const ONLINE_USERS_PATH = "/system/monitor/online-users"

export function listOnlineUsers(params?: OnlineUserListParams) {
  return http.get<PageResponse<OnlineUserResource>>(
    buildQueryPath(ONLINE_USERS_PATH, params)
  )
}

export function forceLogoutOnlineUser(tokenId: string) {
  return http.del<void>(`${ONLINE_USERS_PATH}/${encodeURIComponent(tokenId)}`)
}
