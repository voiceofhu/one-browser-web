import { buildApiUrl, buildQueryPath, HttpError, http } from "@/lib/request"

import type { PageResponse, ResourceMutationResult } from "@/types/admin"
import type {
  BrowserEnvironmentActionPayload,
  BrowserEnvironmentPayload,
  BrowserEnvironmentResource,
  AppDownloadReleaseResource,
  AppDownloadResource,
  BrowserAssetCompletePayload,
  BrowserAssetCompleteResult,
  BrowserAssetListParams,
  BrowserAssetMultipartCreatePayload,
  BrowserAssetPartUploadResult,
  BrowserAssetResource,
  BrowserAssetUploadResource,
  BrowserDownloadResource,
  BrowserDownloadTarget,
  BrowserListParams,
  BrowserMemberResource,
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
const BROWSER_ASSET_PATH = "/browser/assets"
const BROWSER_DOWNLOAD_PATH = "/browser-downloads/current"
const APP_DOWNLOAD_PATH = "/app-downloads/latest"

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

export function listBrowserMembers(params?: BrowserListParams) {
  return http.get<PageResponse<BrowserMemberResource>>(
    buildQueryPath(BROWSER_MEMBER_PATH, params)
  )
}

export function setBrowserMemberStatus(
  memberId: number,
  teamId: number,
  status: BrowserStatusFlag
) {
  return http.put<BrowserMemberResource>(
    `${BROWSER_MEMBER_PATH}/${memberId}/status`,
    { team_id: teamId, status }
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

export function setBrowserTeamStatus(
  teamId: number,
  status: BrowserStatusFlag
) {
  return http.put<BrowserTeamResource>(
    `${BROWSER_TEAM_PATH}/${teamId}/status`,
    {
      status,
    }
  )
}

export function leaveBrowserTeam(teamId: number) {
  return http.del<void>(`${BROWSER_TEAM_PATH}/${teamId}/membership`)
}

export function listBrowserAssets(params?: BrowserAssetListParams) {
  return http.get<PageResponse<BrowserAssetResource>>(
    buildQueryPath(BROWSER_ASSET_PATH, params)
  )
}

export function getCurrentBrowserDownload(target: BrowserDownloadTarget) {
  return http.get<BrowserDownloadResource>(
    buildQueryPath(BROWSER_DOWNLOAD_PATH, target)
  )
}

export async function getLatestAppDownload(target: BrowserDownloadTarget) {
  const release = await http.get<AppDownloadReleaseResource>(
    buildQueryPath(APP_DOWNLOAD_PATH, target)
  )
  const selected = release.selected
  if (!selected) {
    throw new HttpError(
      404,
      "APP_DOWNLOAD_NOT_CONFIGURED",
      "app download is not configured"
    )
  }

  return {
    platform: selected.platform,
    arch: selected.arch,
    url: resolveAppDownloadUrl(selected.download_url),
    version: release.version,
    file_name: selected.name,
    file_size: selected.size,
    updated_at: selected.updated_at ?? release.published_at,
  } satisfies AppDownloadResource
}

function resolveAppDownloadUrl(url: string) {
  if (/^https?:\/\//.test(url)) {
    return url
  }

  return buildApiUrl(url.replace(/^\/api(?=\/)/, ""))
}

export function uploadBrowserAssetDirect(formData: FormData) {
  return http.post<BrowserAssetResource>(
    `${BROWSER_ASSET_PATH}/uploads/direct`,
    formData
  )
}

export function createBrowserAssetUpload(
  payload: BrowserAssetMultipartCreatePayload
) {
  return http.post<BrowserAssetUploadResource>(
    `${BROWSER_ASSET_PATH}/uploads`,
    payload
  )
}

export function uploadBrowserAssetPart(
  uploadId: number,
  partNumber: number,
  chunk: Blob
) {
  return http.post<BrowserAssetPartUploadResult>(
    `${BROWSER_ASSET_PATH}/uploads/${uploadId}/parts?part_number=${partNumber}`,
    chunk
  )
}

export function completeBrowserAssetUpload(
  uploadId: number,
  payload: BrowserAssetCompletePayload
) {
  return http.post<BrowserAssetCompleteResult>(
    `${BROWSER_ASSET_PATH}/uploads/${uploadId}/complete`,
    payload
  )
}

export function abortBrowserAssetUpload(uploadId: number) {
  return http.post<BrowserAssetUploadResource>(
    `${BROWSER_ASSET_PATH}/uploads/${uploadId}/abort`
  )
}

export function setCurrentBrowserAsset(assetId: number) {
  return http.put<BrowserAssetResource>(
    `${BROWSER_ASSET_PATH}/${assetId}/current`
  )
}

export function deleteBrowserAsset(assetId: number) {
  return http.del<void>(`${BROWSER_ASSET_PATH}/${assetId}`)
}
