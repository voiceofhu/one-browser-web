import type {
  AppStatus,
  ChromiumDownloadRequest,
  ChromiumDownloadResult,
  ChromiumDownloadStartResult,
  ChromiumDownloadTarget,
} from '@/features/browser/contracts';
import {
  DesktopApiError,
  desktopInvoke,
  isTauriRuntime,
} from '@/lib/desktop';
import { http } from '@/lib/http';
import { getBackendOrigin } from '@/lib/http/url';

export interface ChromiumDownloadManifest {
  platform: string;
  arch: string;
  url: string;
  version: string;
  fileName: string;
  fileSize: number;
  sha256: string;
  updatedAt: string | null;
}

export interface ChromiumVersionResource {
  version: string;
  isCurrent: boolean;
}

interface ChromiumVersionResponse {
  version?: string;
  is_current?: boolean;
  isCurrent?: boolean;
}

interface ChromiumDownloadManifestResponse {
  platform?: string;
  arch?: string;
  url?: string;
  version?: string;
  file_name?: string;
  fileName?: string;
  file_size?: number;
  fileSize?: number;
  sha256?: string;
  updated_at?: string | null;
  updatedAt?: string | null;
}

export const appStatusEvent = 'one-browser-app-status';
const appStatusWaitTimeoutMs = 5000;
const manifestRequestRetryDelaysMs = [500, 1500];

declare global {
  interface Window {
    __ONE_BROWSER_APP_STATUS__?: unknown;
  }
}

export async function getAppStatus() {
  if (isTauriRuntime()) {
    return getInjectedAppStatus();
  }

  return desktopInvoke<AppStatus>('get_app_status');
}

export function readInjectedAppStatus() {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.__ONE_BROWSER_APP_STATUS__;
  return isAppStatus(value) ? value : null;
}

export function appStatusFromEvent(event: Event) {
  const detail = (event as CustomEvent<unknown>).detail;
  return isAppStatus(detail) ? detail : null;
}

async function getInjectedAppStatus() {
  const cachedStatus = readInjectedAppStatus();
  if (cachedStatus) {
    return cachedStatus;
  }

  console.info('[desktop-debug] waiting app status event', {
    event: appStatusEvent,
    origin: typeof window === 'undefined' ? 'server' : window.location.origin,
  });

  return new Promise<AppStatus>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new DesktopApiError('Tauri 运行环境不可用', { code: 50101 }));
      return;
    }

    const timeout = window.setTimeout(() => {
      window.removeEventListener(appStatusEvent, handleAppStatus);
      reject(new DesktopApiError('等待 Tauri 运行时', { code: 50102 }));
    }, appStatusWaitTimeoutMs);

    function handleAppStatus(event: Event) {
      const status = appStatusFromEvent(event);
      if (!status) {
        return;
      }

      window.clearTimeout(timeout);
      window.removeEventListener(appStatusEvent, handleAppStatus);
      console.info('[desktop-debug] app status event received');
      resolve(status);
    }

    window.addEventListener(appStatusEvent, handleAppStatus);
  });
}

export function startChromiumDownload(
  manifest: ChromiumDownloadManifest,
  versionScoped = false,
) {
  const downloadUrl = resolveChromiumDownloadUrl(manifest.url);
  console.info('[chromium-download] start background download invoke', {
    platform: manifest.platform,
    arch: manifest.arch,
    url: summarizeDownloadUrl(downloadUrl),
    version: manifest.version,
    fileSize: manifest.fileSize,
  });

  return desktopInvoke<ChromiumDownloadStartResult>('download_chromium', {
    request: {
      platform: manifest.platform,
      arch: manifest.arch,
      url: downloadUrl,
      version: manifest.version,
      fileSize: manifest.fileSize,
      sha256: manifest.sha256,
      versionScoped,
    } satisfies ChromiumDownloadRequest,
  });
}

export function installChromiumVersion(
  manifest: ChromiumDownloadManifest,
  versionScoped: boolean,
) {
  return desktopInvoke<ChromiumDownloadResult>('install_chromium', {
    request: {
      platform: manifest.platform,
      arch: manifest.arch,
      url: resolveChromiumDownloadUrl(manifest.url),
      version: manifest.version,
      fileSize: manifest.fileSize,
      sha256: manifest.sha256,
      versionScoped,
    } satisfies ChromiumDownloadRequest,
  });
}

function resolveChromiumDownloadUrl(value: string) {
  if (typeof window === 'undefined') {
    return value;
  }

  return new URL(value, getBackendOrigin()).toString();
}

export async function getChromiumDownloadManifest(version?: string | null) {
  const target = await getChromiumDownloadTarget();
  console.info('[chromium-download] request manifest', {
    target,
    origin: typeof window === 'undefined' ? 'server' : window.location.origin,
  });

  let manifest: ChromiumDownloadManifest;
  let attempt = 0;

  for (;;) {
    try {
      manifest = await requestChromiumDownloadManifest(target, version);
      break;
    } catch (error) {
      const retryDelay = manifestRequestRetryDelaysMs[attempt];
      if (!(error instanceof TypeError) || retryDelay === undefined) {
        throw error;
      }

      attempt += 1;
      console.warn('[chromium-download] manifest request retry', {
        attempt,
        delayMs: retryDelay,
        message: error.message,
      });
      await wait(retryDelay);
    }
  }

  console.info('[chromium-download] manifest loaded', {
    platform: manifest.platform,
    arch: manifest.arch,
    url: summarizeDownloadUrl(manifest.url),
    version: manifest.version,
    fileName: manifest.fileName,
    fileSize: manifest.fileSize,
    updatedAt: manifest.updatedAt,
  });

  return manifest;
}

async function requestChromiumDownloadManifest(
  target: {
    platform: string;
    arch: string;
  },
  version?: string | null,
) {
  const params: Record<string, string> = { ...target };
  if (version?.trim()) {
    params.version = version.trim();
  }
  const response = await http.get<ChromiumDownloadManifestResponse>(
    '/browser/download',
    params,
  );

  return normalizeChromiumDownloadManifest(response.data);
}

export async function listChromiumVersions(target?: ChromiumDownloadTarget) {
  const resolvedTarget = target ?? (await getChromiumDownloadTarget());
  const response = await http.get<ChromiumVersionResponse[]>(
    '/browser/download/versions',
    {
      platform: resolvedTarget.platform,
      arch: resolvedTarget.arch,
    },
  );

  return response.data
    .map((item) => ({
      version: normalizeString(item.version),
      isCurrent: item.isCurrent ?? item.is_current ?? false,
    }))
    .filter((item) => item.version);
}

export async function getChromiumDownloadTarget() {
  if (isTauriRuntime()) {
    return desktopInvoke<ChromiumDownloadTarget>(
      'get_chromium_download_target',
    );
  }

  return getCurrentChromiumTarget();
}

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export function getCurrentChromiumTarget() {
  const platform = navigator.platform.toLowerCase();

  if (platform.includes('mac')) {
    return { platform: 'macos', arch: 'arm64' };
  }

  return { platform: 'windows', arch: 'x64' };
}

function normalizeChromiumDownloadManifest(
  response: ChromiumDownloadManifestResponse,
): ChromiumDownloadManifest {
  return {
    platform: normalizeString(response.platform),
    arch: normalizeString(response.arch),
    url: normalizeString(response.url),
    version: normalizeString(response.version),
    fileName: response.fileName ?? response.file_name ?? '',
    fileSize: normalizeFileSize(response.fileSize ?? response.file_size),
    sha256: normalizeString(response.sha256).toLowerCase(),
    updatedAt: response.updatedAt ?? response.updated_at ?? null,
  };
}

function normalizeFileSize(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isAppStatus(value: unknown): value is AppStatus {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<AppStatus>;
  return (
    typeof record.appVersion === 'string' &&
    typeof record.rustVersion === 'string' &&
    typeof record.appDataDir === 'string' &&
    typeof record.runningCount === 'number' &&
    typeof record.profileCount === 'number' &&
    typeof record.proxyCount === 'number' &&
    Boolean(record.apiStatus) &&
    Boolean(record.settings) &&
    Boolean(record.chromiumPath) &&
    Boolean(record.capabilities)
  );
}

function summarizeDownloadUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}${url.search ? '?[query]' : ''}`;
  } catch {
    return value;
  }
}
