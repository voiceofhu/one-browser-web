import type {
  AppReleaseIdentity,
  AppStatus,
  ChromiumDownloadTarget,
} from '@/features/browser/contracts';
import { readInjectedAppStatus } from '@/features/browser/status/api';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { http } from '@/lib/http';

export const DESKTOP_APP_DOWNLOAD_URL = 'https://browser.aicbe.com/download';

const sha256Pattern = /^[0-9a-f]{64}$/;

interface AppDownloadReleaseResource {
  version: string;
  selected: {
    executable_sha256?: string | null;
  } | null;
}

interface InstalledAppIdentity {
  version: string;
  platform: string;
  arch: string;
  executableSha256: string | null;
}

interface LatestAppRelease {
  version: string;
  executableSha256: string | null;
}

export interface DesktopAppUpdate {
  currentVersion: string;
  latestVersion: string;
}

export async function findDesktopAppUpdate() {
  if (!isTauriRuntime()) {
    return null;
  }

  const installed = await getInstalledAppIdentity();
  const latest = await getLatestAppRelease(installed);
  return evaluateDesktopAppUpdate(installed, latest);
}

export function evaluateDesktopAppUpdate(
  installed: InstalledAppIdentity,
  latest: LatestAppRelease,
): DesktopAppUpdate | null {
  const versionComparison = compareAppVersions(
    latest.version,
    installed.version,
  );

  if (versionComparison > 0) {
    return {
      currentVersion: installed.version,
      latestVersion: latest.version,
    };
  }

  return null;
}

async function getInstalledAppIdentity(): Promise<InstalledAppIdentity> {
  try {
    const identity = await desktopInvoke<AppReleaseIdentity>(
      'get_app_release_identity',
    );
    return {
      version: identity.version.trim(),
      platform: identity.platform.trim(),
      arch: identity.arch.trim(),
      executableSha256: normalizeSha256(identity.executableSha256),
    };
  } catch (error) {
    console.debug(
      'Native app SHA-256 is unavailable; falling back to version detection.',
      error,
    );
  }

  const [status, target] = await Promise.all([
    getNativeAppStatus(),
    desktopInvoke<ChromiumDownloadTarget>('get_chromium_download_target'),
  ]);

  return {
    version: status.appVersion.trim(),
    platform: target.platform.trim(),
    arch: target.arch.trim(),
    executableSha256: null,
  };
}

async function getNativeAppStatus() {
  const injectedStatus = readInjectedAppStatus();
  if (injectedStatus) {
    return injectedStatus;
  }

  return desktopInvoke<AppStatus>('get_app_status');
}

async function getLatestAppRelease(
  installed: InstalledAppIdentity,
): Promise<LatestAppRelease> {
  const response = await http.get<AppDownloadReleaseResource>(
    '/app-downloads/latest',
    {
      platform: installed.platform,
      arch: installed.arch,
    },
  );
  const version = response.data.version?.trim();

  if (!version || !response.data.selected) {
    throw new Error('Latest app release is unavailable for this device.');
  }

  return {
    version,
    executableSha256: normalizeSha256(response.data.selected.executable_sha256),
  };
}

function compareAppVersions(left: string, right: string) {
  const leftVersion = parseVersion(left);
  const rightVersion = parseVersion(right);

  if (leftVersion && rightVersion) {
    const segmentCount = Math.max(
      leftVersion.segments.length,
      rightVersion.segments.length,
    );

    for (let index = 0; index < segmentCount; index += 1) {
      const difference =
        (leftVersion.segments[index] ?? 0) -
        (rightVersion.segments[index] ?? 0);
      if (difference !== 0) {
        return Math.sign(difference);
      }
    }

    if (leftVersion.prerelease === rightVersion.prerelease) {
      return 0;
    }
    if (!leftVersion.prerelease) {
      return 1;
    }
    if (!rightVersion.prerelease) {
      return -1;
    }
    return leftVersion.prerelease.localeCompare(rightVersion.prerelease);
  }

  return normalizeVersion(left).localeCompare(normalizeVersion(right), 'en', {
    numeric: true,
    sensitivity: 'base',
  });
}

function parseVersion(value: string) {
  const normalized = normalizeVersion(value);
  const [core, prerelease = ''] = normalized.split('-', 2);
  const parts = core.split('.');

  if (!parts.length || parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }

  return {
    segments: parts.map(Number),
    prerelease,
  };
}

function normalizeVersion(value: string) {
  return value.trim().replace(/^v/i, '');
}

function normalizeSha256(value: string | null | undefined) {
  const normalized =
    value
      ?.trim()
      .toLowerCase()
      .replace(/^sha256:/, '') ?? '';
  return sha256Pattern.test(normalized) ? normalized : null;
}
