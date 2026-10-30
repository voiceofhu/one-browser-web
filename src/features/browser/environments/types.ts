import type { FingerprintConfig, ProfileAdvancedConfig } from '../contracts';

export type RemoteStatusFlag = '0' | '1';
export type RemoteRuntimeStatus =
  'inactive' | 'starting' | 'active' | 'stopping' | 'error' | (string & {});

export interface RemoteListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: string;
  team_id?: number;
}

export interface RemotePageResponse<T> {
  list: T[];
  total: number;
}

export interface RemoteCreatedResource {
  id: number;
}

export interface RemoteEnvironmentListItem {
  environment_id: number;
  environment_key: string;
  environment_no: string | null;
  name: string;
  group_key: string | null;
  chromium_version: string | null;
  mode: string;
  status: RemoteStatusFlag;
  runtime_status: RemoteRuntimeStatus;
  runtime_user_count: number;
  runtime_user_names: string[];
  proxy_id: number | null;
  proxy_name: string | null;
  proxy_type: string | null;
  proxy_last_check_exit_ip?: string | null;
  proxy_last_check_country_code?: string | null;
  proxy_last_check_country?: string | null;
  proxy_last_check_region?: string | null;
  owner_member_id: number | null;
  owner_name: string | null;
  team_id: number;
  team_name: string;
  last_open_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export type RemoteEnvironmentFingerprintConfig = Partial<FingerprintConfig>;

export interface RemoteEnvironmentResource extends RemoteEnvironmentListItem {
  remark: string;
  fingerprint_config?: RemoteEnvironmentFingerprintConfig | null;
  advanced?: Partial<ProfileAdvancedConfig> | null;
}

export interface RemoteEnvironmentLaunchProxyConfig {
  type: 'http' | 'https' | 'socks5' | 'fixed_servers' | 'pac_script';
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  server: string | null;
  pac_url: string | null;
  bypass_list: string[];
}

export interface RemoteEnvironmentLaunch {
  generation: number;
  lease_expires_at: string;
  expected_exit_ip: string | null;
  ip_checker: string | null;
  proxy_config: RemoteEnvironmentLaunchProxyConfig | null;
}

export interface OpenedRemoteEnvironmentResource extends RemoteEnvironmentResource {
  launch: RemoteEnvironmentLaunch;
}

export interface RenewRemoteEnvironmentRequest {
  generation: number;
}

export interface RenewRemoteEnvironmentResource {
  generation: number;
  lease_expires_at: string;
}

export interface RemoteEnvironmentPayload {
  team_id: number;
  environment_key: string;
  environment_no?: string | null;
  name: string;
  group_key?: string | null;
  chromium_version?: string | null;
  mode?: string;
  status?: RemoteStatusFlag;
  proxy_id?: number | null;
  owner_member_id?: number | null;
  remark?: string;
  fingerprint_config?: RemoteEnvironmentFingerprintConfig;
  advanced?: Partial<ProfileAdvancedConfig>;
}
