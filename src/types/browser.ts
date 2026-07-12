export type BrowserStatusFlag = "0" | "1"

export type BrowserProxyType =
  | "no_proxy"
  | "http"
  | "https"
  | "socks5"
  | "fixed_servers"
  | "pac_script"
  | (string & {})

export type BrowserProxyCheckStatus =
  | "unchecked"
  | "checking"
  | "ok"
  | "blocked"
  | "error"
  | (string & {})

export interface BrowserListParams {
  page?: number
  page_size?: number
  keyword?: string
  status?: string
}

export interface BrowserAssetListParams extends BrowserListParams {
  platform?: string
  arch?: string
  current?: boolean
}

export interface BrowserDownloadTarget {
  platform: string
  arch: string
  version?: string
}

export interface BrowserStatusPayload {
  status: BrowserStatusFlag
}

export interface BrowserIdListPayload {
  ids: number[]
  team_id?: number
}

export interface BrowserEnvironmentPayload {
  team_id?: number
  owner_member_id?: number | null
  proxy_id?: number | null
  environment_key?: string
  environment_no?: string | null
  name?: string
  group_key?: string | null
  chromium_version?: string | null
  mode?: string
  status?: BrowserStatusFlag
  remark?: string
  tags?: string[]
  [key: string]: unknown
}

export interface BrowserEnvironmentActionPayload {
  [key: string]: unknown
}

export interface BrowserEnvironmentActionResult {
  environment_id: number
  status?: BrowserStatusFlag
  runtime_status: string
  last_open_at?: string | null
  message?: string
}

export interface BrowserProxyPayload {
  team_id?: number
  owner_member_id?: number | null
  proxy_key?: string
  name?: string
  type?: BrowserProxyType
  host?: string | null
  port?: number | null
  username?: string | null
  password?: string | null
  server?: string | null
  pac_url?: string | null
  refresh_url?: string | null
  ip_checker?: string | null
  bypass_rules?: string[]
  status?: BrowserStatusFlag
  remark?: string
  [key: string]: unknown
}

export interface BrowserProxyCheckPayload {
  checker_url?: string
  timeout_ms?: number
  [key: string]: unknown
}

export interface BrowserProxyCheckResult {
  proxy_id: number
  last_check_status: BrowserProxyCheckStatus
  last_check_exit_ip: string | null
  last_check_country_code?: string | null
  last_check_country: string | null
  last_check_region: string | null
  last_check_asn?: string | null
  last_check_latency_ms: number | null
  last_check_checked_at: string | null
  last_check_message?: string
}

export interface BrowserMemberPayload {
  team_id?: number
  user_id?: number
  user_name?: string
  nick_name?: string
  display_name?: string
  email?: string
  phone_number?: string
  status?: BrowserStatusFlag
  role_ids?: number[]
  remark?: string | null
  [key: string]: unknown
}

export interface BrowserTeamPayload {
  team_key?: string
  team_name?: string
  owner_member_id?: number | null
  status?: BrowserStatusFlag
  remark?: string
  [key: string]: unknown
}

export interface BrowserEnvironmentResource {
  environment_id: number
  environment_key: string
  environment_no: string | null
  name: string
  group_key: string | null
  chromium_version: string | null
  mode: string
  status: BrowserStatusFlag
  runtime_status: string
  proxy_id: number | null
  proxy_name: string | null
  proxy_type: string | null
  owner_member_id: number | null
  owner_name: string | null
  team_id: number
  team_name: string
  last_open_at: string | null
  created_at: string
  updated_at: string | null
  remark: string
  tags: string[]
  fingerprint_config?: Record<string, unknown> | null
  advanced?: Record<string, unknown> | null
}

export interface BrowserVersionResource {
  version: string
  is_current: boolean
}

export interface BrowserProxyResource {
  proxy_id: number
  proxy_key: string
  name: string
  type: BrowserProxyType
  host: string | null
  port: number | null
  server: string | null
  pac_url: string | null
  last_check_status: BrowserProxyCheckStatus
  last_check_exit_ip: string | null
  last_check_country_code?: string | null
  last_check_country: string | null
  last_check_region: string | null
  last_check_asn?: string | null
  last_check_latency_ms: number | null
  last_check_checked_at: string | null
  last_check_message?: string
  status: BrowserStatusFlag
  owner_member_id: number | null
  owner_name: string | null
  team_id: number
  team_name: string
  linked_environment_count: number
  linked_environment_names: string[]
  created_at: string
  updated_at: string | null
  remark: string
}

export interface BrowserMemberResource {
  member_id: number
  user_id: number
  user_name: string
  nick_name: string
  avatar: string
  display_name: string
  email: string
  phone_number: string
  status: BrowserStatusFlag
  last_active_at: string | null
  team_id: number
  team_name: string
  role_names: string[]
  environment_count: number
  created_at: string
  updated_at: string | null
  remark: string | null
}

export interface BrowserTeamResource {
  team_id: number
  team_key: string
  team_name: string
  owner_member_id: number | null
  owner_name?: string | null
  status: BrowserStatusFlag
  member_count?: number
  environment_count?: number
  proxy_count?: number
  can_leave: boolean
  created_at: string
  updated_at: string | null
  remark: string
}

export interface BrowserAssetResource {
  asset_id: number
  platform: string
  arch: string
  channel: string
  version: string
  file_name: string
  mime_type: string
  file_size: number
  bucket_id: string
  object_key: string
  download_url: string
  upload_mode: "direct" | "multipart" | (string & {})
  is_current: boolean
  created_by: string
  created_at: string
  updated_by: string
  updated_at: string | null
  remark: string
}

export interface BrowserDownloadResource {
  platform: string
  arch: string
  url: string
  version: string
  file_name: string
  file_size: number
  updated_at: string | null
}

export interface AppDownloadAssetResource {
  asset_id: number
  name: string
  platform: string
  arch: string
  format: string
  size: number
  download_url: string
  content_type: string | null
  updated_at: string | null
  digest: string | null
}

export interface AppDownloadReleaseResource {
  repository: string
  tag_name: string
  version: string
  name: string | null
  html_url: string
  published_at: string | null
  selected: AppDownloadAssetResource | null
  assets: AppDownloadAssetResource[]
}

export interface AppDownloadResource {
  platform: string
  arch: string
  url: string
  version: string
  file_name: string
  file_size: number
  updated_at: string | null
}

export interface BrowserAssetUploadResource {
  upload_id: number
  onefile_upload_id: string
  platform: string
  arch: string
  channel: string
  version: string
  file_name: string
  mime_type: string
  file_size: number
  bucket_id: string
  bucket_name: string | null
  object_key: string
  part_size: number
  total_parts: number
  make_current: boolean
  status: "uploading" | "completed" | "aborted" | (string & {})
  created_by: string
  created_at: string
  updated_by: string
  updated_at: string | null
  remark: string
}

export interface BrowserAssetMultipartCreatePayload {
  platform: string
  arch: string
  channel?: string
  version: string
  file_name: string
  file_size: number
  mime_type: string
  object_key?: string
  part_size?: number
  make_current?: boolean
  remark?: string
}

export interface BrowserAssetPartUploadResult {
  upload_id: number
  part_number: number
  etag: string | null
  onefile: unknown
}

export interface BrowserAssetCompletePayload {
  parts: Array<{
    part_number: number
    etag: string
  }>
}

export interface BrowserAssetCompleteResult {
  asset: BrowserAssetResource
  onefile: unknown
}
