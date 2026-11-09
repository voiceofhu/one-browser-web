import type { PageRequest } from './common';
import type {
  ProfileMode,
  PublicRuntimeStatus,
  RuntimeStatus,
} from './lifecycle';
import type { InlineProxyConfig } from './proxy';

export type { ProfileMode } from './lifecycle';

export type CacheType =
  | 'local_storage'
  | 'indexeddb'
  | 'extension_cache'
  | 'cookie'
  | 'history'
  | 'image_file'
  | 'all';

export interface FingerprintConfig {
  system: string | null;
  userAgent: string | null;
  webrtcMode: string | null;
  webrtcIp: string | null;
  routeUdpViaProxy: boolean | null;
  locale: string | null;
  timeZone: string | null;
  acceptLanguages: string[];
  platform: string | null;
  platformVersion: string | null;
  architecture: string | null;
  uaFullVersion: string | null;
  deviceScale: number | null;
  geolocationMode: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  webglMode: string | null;
  webglVendor: string | null;
  webglRenderer: string | null;
  webgpuMode: string | null;
  canvasNoise: string | null;
  audioContextNoise: string | null;
  screenMode: string | null;
  screenResolution: string | null;
  fontsMode: string | null;
  fonts: string | null;
  cpuCores: number | null;
  ramGb: number | null;
  mediaDevicesMode: string | null;
  mediaAudioInputs: number | null;
  mediaAudioOutputs: number | null;
  mediaVideoInputs: number | null;
  deviceName: string | null;
  macAddress: string | null;
  doNotTrack: boolean | null;
}

export interface ProfileAdvancedConfig {
  chromiumPath: string | null;
  userDataDir: string | null;
  launchArgs: string[];
  headless: boolean;
  lastOpenedTabs: boolean;
  passwordFilling: boolean;
  passwordSaving: boolean;
  deleteCacheOnClose: boolean;
  failClosed: boolean;
  exitOnLastTab: boolean;
  privacyBoundaryPolicyPath: string | null;
  privacyBoundaryAutoNetworkLocation: boolean;
  privacyBoundaryIpAddress: string | null;
  privacyBoundaryCountryCode: string | null;
}

export interface ProfileConfig {
  profileId: string;
  profileNo: string | null;
  name: string;
  identityName: string | null;
  remark: string;
  groupId: string | null;
  tags: string[];
  tabs: string[];
  mode: ProfileMode;
  proxyId: string | null;
  proxyConfig: InlineProxyConfig | null;
  fingerprintConfig: FingerprintConfig;
  advanced: ProfileAdvancedConfig;
  createdAt: string;
  updatedAt: string;
  lastOpenAt: string | null;
}

export interface ProfileListItem {
  profileId: string;
  profileNo: string | null;
  name: string;
  groupId: string | null;
  tags: string[];
  status: RuntimeStatus;
  publicStatus: PublicRuntimeStatus;
  proxyId: string | null;
  proxySummary: string;
  proxyUrl: string;
  proxyExitIp: string | null;
  proxyCountryCode: string | null;
  proxyCountry: string | null;
  proxyRegion: string | null;
  pid: number | null;
  createdAt: string;
  updatedAt: string;
  lastOpenAt: string | null;
}

export interface ProfileListRequest extends PageRequest {
  keyword?: string;
  profileIds?: string[];
  profileNo?: string;
  groupId?: string | null;
  tags?: string[];
  mode?: ProfileMode | ProfileMode[];
  status?: RuntimeStatus | RuntimeStatus[];
  proxyId?: string | null;
}

export interface CreateProfileRequest {
  profileId: string;
  profileNo?: string | null;
  name?: string;
  identityName?: string | null;
  remark?: string;
  groupId?: string | null;
  tags?: string[];
  tabs?: string[];
  mode?: ProfileMode;
  proxyId?: string | null;
  proxyConfig?: InlineProxyConfig | null;
  fingerprintConfig?: Partial<FingerprintConfig>;
  advanced?: Partial<ProfileAdvancedConfig>;
}

export interface UpdateProfileRequest {
  profileId: string;
  profileNo?: string | null;
  name?: string;
  identityName?: string | null;
  remark?: string;
  groupId?: string | null;
  tags?: string[];
  tabs?: string[];
  mode?: ProfileMode;
  proxyId?: string | null;
  proxyConfig?: InlineProxyConfig | null;
  fingerprintConfig?: Partial<FingerprintConfig>;
  advanced?: Partial<ProfileAdvancedConfig>;
}

export interface GetProfileRequest {
  profileId: string;
}

export interface DeleteProfilesRequest {
  profileIds: string[];
  purgeData: boolean;
}

export interface DeleteProfilesResult {
  deleted: string[];
}

export interface DeleteProfileCacheRequest {
  profileIds: string[];
  cacheTypes?: CacheType[];
}

export interface DeleteProfileCacheResult {
  profileIds: string[];
  removedPaths: string[];
}
