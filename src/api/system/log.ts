import { buildQueryPath, http } from "@/lib/request"

import type {
  ListParams,
  LoginLogResource,
  LoginLogSummaryResource,
  OperationLogResource,
  OperationLogSummaryResource,
  PageResponse,
} from "@/types/admin"

const OPERATION_LOG_PATH = "/system/operation-logs"
const LOGIN_LOG_PATH = "/system/login-logs"
const IP_LOCATION_PATH = "/system/ip-location"

export type IpLocationResource = {
  ip: string
  location: string
  provider: string
}

export function listOperationLogs(params?: ListParams) {
  return http.get<PageResponse<OperationLogSummaryResource>>(
    buildQueryPath(OPERATION_LOG_PATH, params)
  )
}

export function getOperationLog(operId: number) {
  return http.get<OperationLogResource>(`${OPERATION_LOG_PATH}/${operId}`)
}

export function listLoginLogs(params?: ListParams) {
  return http.get<PageResponse<LoginLogSummaryResource>>(
    buildQueryPath(LOGIN_LOG_PATH, params)
  )
}

export function getLoginLog(infoId: number) {
  return http.get<LoginLogResource>(`${LOGIN_LOG_PATH}/${infoId}`)
}

export function getIpLocation(ip: string) {
  return http.get<IpLocationResource>(buildQueryPath(IP_LOCATION_PATH, { ip }))
}
