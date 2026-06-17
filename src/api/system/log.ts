import { buildQueryPath, http } from "@/lib/request"

import type {
  ListParams,
  LoginLogResource,
  OperationLogResource,
  PageResponse,
} from "@/types/admin"

const LOG_PATH = "/system/log"

export function listOperationLogs(params?: ListParams) {
  return http.get<PageResponse<OperationLogResource>>(
    buildQueryPath(`${LOG_PATH}/operation`, params)
  )
}

export function listLoginLogs(params?: ListParams) {
  return http.get<PageResponse<LoginLogResource>>(
    buildQueryPath(`${LOG_PATH}/login`, params)
  )
}
