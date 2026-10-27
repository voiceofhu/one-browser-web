import type { ProfileMode, RuntimeStatus } from './lifecycle';
import type {
  InlineProxyConfig,
  ProxyCheckResult,
  ProxyCheckStatus,
  ProxyType,
} from './proxy';

export type { PublicRuntimeStatus, RuntimeStatus } from './lifecycle';

export interface RuntimeWebSocketEndpoints {
  puppeteer: string | null;
  selenium: string | null;
}

export interface RuntimeProfile {
  profileId: string;
  profileNo: string | null;
  status: RuntimeStatus;
  pid: number | null;
  startedAt: string | null;
  debugPort: number | null;
  userDataDir: string;
  proxyId: string | null;
  proxyStatus: ProxyCheckResult;
  ws: RuntimeWebSocketEndpoints;
  webdriver: string | null;
  errorMessage: string | null;
  environmentWarnings: string[];
  leaseGeneration: number | null;
  leaseExpiresAt: string | null;
}

export type OpenProfileProgressStep =
  | 'checking_proxy'
  | 'proxy_checked'
  | 'preparing_launch'
  | 'launched'
  | 'failed';

export interface OpenProfileProgressPayload {
  profileId: string;
  step: OpenProfileProgressStep;
}

export interface OpenProfileRequest {
  profileId: string;
  startUrl?: string | null;
  tabs?: string[];
  mode?: ProfileMode;
  headless?: boolean;
  lease?: RemoteLease | null;
  expectedExitIp?: string | null;
}

export interface RemoteLease {
  generation: number;
  expiresAt: string;
}

export interface UpdateRemoteLeaseRequest {
  profileId: string;
  generation: number;
  leaseExpiresAt: string | null;
}

export interface CloseProfileRequest {
  profileId: string;
}

export interface CloseProfileResult {
  profileId: string;
  closed: boolean;
  leaseGeneration?: number | null;
}

export interface CloseAllProfilesResult {
  closed: string[];
}

export interface CheckProxyRequest {
  proxyId?: string;
  profileId?: string;
  proxyConfig?: InlineProxyConfig | null;
  ipChecker?: string | null;
}

export interface RefreshIpRequest {
  profileId: string;
  profileNo?: string | null;
  proxyId?: string | null;
  proxyConfig?: InlineProxyConfig | null;
  refreshUrl?: string | null;
  checkExitIp?: boolean;
  forceReconnect?: boolean;
}

export interface RefreshIpResult {
  profileId: string;
  proxyId: string | null;
  refreshed: boolean;
  runtimeApplied: boolean;
  requiresRestart: boolean;
  proxyStatus: ProxyCheckResult;
  message: string;
}

export interface UpdateProfileProxyRequest {
  profileId: string;
  profileNo?: string | null;
  proxyId?: string | null;
  proxyConfig?: InlineProxyConfig | null;
  failClosed?: boolean;
  applyToRunning?: boolean;
  forceReconnect?: boolean;
  checkExitIp?: boolean;
}

export interface UpdateProfileProxyResult {
  profileId: string;
  proxyId: string | null;
  runtimeApplied: boolean;
  requiresRestart: boolean;
  proxyStatus: ProxyCheckResult;
}

export interface ProfileProxyStatusRequest {
  profileId: string;
}

export interface ProfileProxyStatus {
  profileId: string;
  proxyId: string | null;
  proxyType: ProxyType;
  runtimeApplied: boolean;
  failClosed: boolean;
  exitIp: string | null;
  countryCode: string | null;
  country: string | null;
  region: string | null;
  asn: string | null;
  status: ProxyCheckStatus;
  checkedAt: string | null;
  message: string;
}
