import { buildQueryPath, http } from "@/lib/request"

import type { PageResponse, ResourceMutationResult } from "@/types/admin"
import type {
  BrowserEnvironmentActionPayload,
  BrowserEnvironmentPayload,
  BrowserEnvironmentResource,
  BrowserIdListPayload,
  BrowserListParams,
  BrowserMemberPayload,
  BrowserMemberResource,
  BrowserProxyCheckPayload,
  BrowserProxyCheckResult,
  BrowserProxyPayload,
  BrowserProxyResource,
  BrowserStatusFlag,
  BrowserStatusPayload,
  BrowserTeamPayload,
  BrowserTeamResource,
} from "@/types/browser"

const BROWSER_ENVIRONMENT_PATH = "/browser/environments"
const BROWSER_PROXY_PATH = "/browser/proxies"
const BROWSER_MEMBER_PATH = "/browser/members"
const BROWSER_TEAM_PATH = "/browser/teams"

export function listBrowserEnvironments(params?: BrowserListParams) {
  return http.get<PageResponse<BrowserEnvironmentResource>>(
    buildQueryPath(BROWSER_ENVIRONMENT_PATH, params)
  )
}

export function createBrowserEnvironment(payload: BrowserEnvironmentPayload) {
  return http.post<ResourceMutationResult>(BROWSER_ENVIRONMENT_PATH, payload)
}

export function getBrowserEnvironment(environmentId: number) {
  return http.get<BrowserEnvironmentResource>(
    `${BROWSER_ENVIRONMENT_PATH}/${environmentId}`
  )
}

export function updateBrowserEnvironment(
  environmentId: number,
  payload: BrowserEnvironmentPayload
) {
  return http.put<BrowserEnvironmentResource>(
    `${BROWSER_ENVIRONMENT_PATH}/${environmentId}`,
    payload
  )
}

export function deleteBrowserEnvironment(environmentId: number) {
  return http.del<void>(`${BROWSER_ENVIRONMENT_PATH}/${environmentId}`)
}

export function setBrowserEnvironmentStatus(
  environmentId: number,
  status: BrowserStatusFlag
) {
  const payload: BrowserStatusPayload = { status }
  return http.put<BrowserEnvironmentResource>(
    `${BROWSER_ENVIRONMENT_PATH}/${environmentId}/status`,
    payload
  )
}

export function openBrowserEnvironment(
  environmentId: number,
  payload?: BrowserEnvironmentActionPayload
) {
  return http.post<BrowserEnvironmentResource>(
    `${BROWSER_ENVIRONMENT_PATH}/${environmentId}/open`,
    payload
  )
}

export function closeBrowserEnvironment(
  environmentId: number,
  payload?: BrowserEnvironmentActionPayload
) {
  return http.post<BrowserEnvironmentResource>(
    `${BROWSER_ENVIRONMENT_PATH}/${environmentId}/close`,
    payload
  )
}

export function listBrowserProxies(params?: BrowserListParams) {
  return http.get<PageResponse<BrowserProxyResource>>(
    buildQueryPath(BROWSER_PROXY_PATH, params)
  )
}

export function createBrowserProxy(payload: BrowserProxyPayload) {
  return http.post<ResourceMutationResult>(BROWSER_PROXY_PATH, payload)
}

export function getBrowserProxy(proxyId: number) {
  return http.get<BrowserProxyResource>(`${BROWSER_PROXY_PATH}/${proxyId}`)
}

export function updateBrowserProxy(
  proxyId: number,
  payload: BrowserProxyPayload
) {
  return http.put<BrowserProxyResource>(
    `${BROWSER_PROXY_PATH}/${proxyId}`,
    payload
  )
}

export function deleteBrowserProxy(proxyId: number) {
  return http.del<void>(`${BROWSER_PROXY_PATH}/${proxyId}`)
}

export function setBrowserProxyStatus(
  proxyId: number,
  status: BrowserStatusFlag
) {
  const payload: BrowserStatusPayload = { status }
  return http.put<BrowserProxyResource>(
    `${BROWSER_PROXY_PATH}/${proxyId}/status`,
    payload
  )
}

export function checkBrowserProxy(
  proxyId: number,
  payload?: BrowserProxyCheckPayload
) {
  return http.post<BrowserProxyCheckResult>(
    `${BROWSER_PROXY_PATH}/${proxyId}/check`,
    payload
  )
}

export function listBrowserMembers(params?: BrowserListParams) {
  return http.get<PageResponse<BrowserMemberResource>>(
    buildQueryPath(BROWSER_MEMBER_PATH, params)
  )
}

export function createBrowserMember(payload: BrowserMemberPayload) {
  return http.post<ResourceMutationResult>(BROWSER_MEMBER_PATH, payload)
}

export function getBrowserMember(memberId: number) {
  return http.get<BrowserMemberResource>(`${BROWSER_MEMBER_PATH}/${memberId}`)
}

export function updateBrowserMember(
  memberId: number,
  payload: BrowserMemberPayload
) {
  return http.put<BrowserMemberResource>(
    `${BROWSER_MEMBER_PATH}/${memberId}`,
    payload
  )
}

export function deleteBrowserMember(memberId: number) {
  return http.del<void>(`${BROWSER_MEMBER_PATH}/${memberId}`)
}

export function setBrowserMemberStatus(
  memberId: number,
  status: BrowserStatusFlag
) {
  const payload: BrowserStatusPayload = { status }
  return http.put<BrowserMemberResource>(
    `${BROWSER_MEMBER_PATH}/${memberId}/status`,
    payload
  )
}

export function getBrowserMemberRoleIds(memberId: number, teamId?: number) {
  return http.get<BrowserIdListPayload>(
    buildQueryPath(`${BROWSER_MEMBER_PATH}/${memberId}/roles`, {
      team_id: teamId,
    })
  )
}

export function setBrowserMemberRoleIds(
  memberId: number,
  roleIds: number[],
  teamId?: number
) {
  const payload: BrowserIdListPayload = { ids: roleIds, team_id: teamId }
  return http.put<BrowserIdListPayload>(
    `${BROWSER_MEMBER_PATH}/${memberId}/roles`,
    payload
  )
}

export function listBrowserTeams(params?: BrowserListParams) {
  return http.get<PageResponse<BrowserTeamResource>>(
    buildQueryPath(BROWSER_TEAM_PATH, params)
  )
}

export function createBrowserTeam(payload: BrowserTeamPayload) {
  return http.post<ResourceMutationResult>(BROWSER_TEAM_PATH, payload)
}

export function getBrowserTeam(teamId: number) {
  return http.get<BrowserTeamResource>(`${BROWSER_TEAM_PATH}/${teamId}`)
}

export function updateBrowserTeam(teamId: number, payload: BrowserTeamPayload) {
  return http.put<BrowserTeamResource>(
    `${BROWSER_TEAM_PATH}/${teamId}`,
    payload
  )
}

export function deleteBrowserTeam(teamId: number) {
  return http.del<void>(`${BROWSER_TEAM_PATH}/${teamId}`)
}

export function setBrowserTeamStatus(
  teamId: number,
  status: BrowserStatusFlag
) {
  const payload: BrowserStatusPayload = { status }
  return http.put<BrowserTeamResource>(
    `${BROWSER_TEAM_PATH}/${teamId}/status`,
    payload
  )
}
