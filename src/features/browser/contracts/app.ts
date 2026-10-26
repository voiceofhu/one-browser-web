export interface CapabilityFlags {
  tauriCommands: boolean;
  localApi: boolean;
  chromiumLaunch: boolean;
  dynamicProxy: boolean;
  proxyCheck: boolean;
  networkAvailable: boolean;
}

export interface AppSettings {
  chromiumPath: string | null;
  profileRoot: string;
  defaultStartUrl: string;
  egressSelectionMode: 'auto' | 'manual';
  preferredEgressId: string | null;
  /** Absent on desktop clients built before the pre-proxy existed. */
  preProxy?: PreProxySettings;
  apiEnabled: boolean;
  apiHost: '127.0.0.1';
  apiPort: number;
}

export type PreProxyMode = 'off' | 'system' | 'manual';
export type PreProxyType = 'socks5' | 'http';

/** The password stays in the OS credential store; only `hasPassword` is exposed. */
export interface PreProxySettings {
  mode: PreProxyMode;
  type: PreProxyType;
  host: string | null;
  port: number | null;
  username: string | null;
  hasPassword: boolean;
}

/**
 * Full replacement. `password`: omitted keeps the stored secret, `null` or
 * `''` clears it, any other string replaces it.
 */
export interface PreProxyPatch {
  mode: PreProxyMode;
  type: PreProxyType;
  host: string | null;
  port: number | null;
  username: string | null;
  password?: string | null;
}

export interface DetectedSystemProxy {
  type: PreProxyType;
  host: string;
  port: number;
}

export interface SystemProxyStatus {
  proxy: DetectedSystemProxy | null;
  source: string;
  message: string;
}

export interface PreProxyTestResult {
  success: boolean;
  route: 'off' | 'system' | 'manual' | 'direct';
  via: string | null;
  latencyMs: number | null;
  message: string;
}

export interface LocalApiStatus {
  enabled: boolean;
  running: boolean;
  host: '127.0.0.1';
  port: number;
  message: string;
}

export interface ChromiumPathStatus {
  path: string | null;
  exists: boolean;
  executable: boolean;
  message: string;
}

export interface OpenExternalUrlRequest {
  url: string;
}

export interface OpenPathRequest {
  path: string;
}

export interface WriteClipboardTextRequest {
  text: string;
}

export type ChromiumDownloadPhase =
  'checking' | 'downloading' | 'extracting' | 'ready' | 'error';

export interface ChromiumDownloadProgress {
  phase: ChromiumDownloadPhase;
  platform: string;
  arch: string;
  url: string;
  downloadedBytes: number;
  totalBytes: number | null;
  percent: number | null;
  message: string;
}

export interface ChromiumDownloadRequest {
  platform: string;
  arch: string;
  url: string;
  version: string;
  fileSize: number;
  sha256: string;
  versionScoped?: boolean;
}

export interface ChromiumDownloadTarget {
  platform: string;
  arch: string;
}

export interface ChromiumDownloadStartResult {
  started: boolean;
  message: string;
}

export interface ChromiumDownloadResult {
  platform: string;
  arch: string;
  url: string;
  version: string;
  localVersion: string | null;
  path: string;
  downloaded: boolean;
}

export interface AppStatus {
  appVersion: string;
  rustVersion: string;
  apiStatus: LocalApiStatus;
  appDataDir: string;
  settings: AppSettings;
  chromiumPath: ChromiumPathStatus;
  capabilities: CapabilityFlags;
  runningCount: number;
  profileCount: number;
  proxyCount: number;
}

export interface AppReleaseIdentity {
  version: string;
  platform: string;
  arch: string;
  executableSha256: string;
}

export type UpdateSettingsRequest = Partial<Omit<AppSettings, 'preProxy'>> & {
  preProxy?: PreProxyPatch;
};

export interface ValidateChromiumPathRequest {
  chromiumPath?: string | null;
}
