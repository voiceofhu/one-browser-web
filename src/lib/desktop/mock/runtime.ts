import type {
  CloseAllProfilesResult,
  CloseProfileResult,
  ProfileProxyStatus,
  RefreshIpResult,
  RuntimeProfile,
  UpdateProfileProxyResult,
} from '@/features/browser/contracts';
import {
  mockNow,
  mockProfiles,
  mockProxyCheck,
  mockRuntime,
} from '@/lib/desktop/mock/state';
import { nullableString, stringValue } from '@/lib/desktop/mock/values';

export function mockUpdateProfileProxy(
  request?: Record<string, unknown>,
): UpdateProfileProxyResult {
  return {
    profileId: stringValue(request?.profileId) ?? '',
    proxyId: nullableString(request?.proxyId),
    runtimeApplied: false,
    requiresRestart: true,
    proxyStatus: mockProxyCheck,
  };
}

export function mockRefreshIp(
  request?: Record<string, unknown>,
): RefreshIpResult {
  return {
    profileId: stringValue(request?.profileId) ?? '',
    proxyId: nullableString(request?.proxyId),
    refreshed: false,
    runtimeApplied: false,
    requiresRestart: true,
    proxyStatus: mockProxyCheck,
    message: '已跳过模拟刷新',
  };
}

export function mockProfileProxyStatus(
  request?: Record<string, unknown>,
): ProfileProxyStatus {
  return {
    profileId: stringValue(request?.profileId) ?? '',
    proxyId: null,
    proxyType: 'no_proxy',
    runtimeApplied: false,
    failClosed: false,
    exitIp: null,
    countryCode: null,
    country: null,
    region: null,
    asn: null,
    status: 'unchecked',
    checkedAt: null,
    message: '模拟代理状态',
  };
}

export function mockOpenProfile(
  request?: Record<string, unknown>,
): RuntimeProfile {
  const profileId = stringValue(request?.profileId) ?? '';
  const runtime: RuntimeProfile = {
    profileId,
    profileNo: mockProfiles.get(profileId)?.profileNo ?? null,
    status: 'active',
    pid: null,
    startedAt: mockNow,
    debugPort: null,
    userDataDir: `/tmp/one-browser/profiles/${profileId}`,
    proxyId: mockProfiles.get(profileId)?.proxyId ?? null,
    proxyStatus: mockProxyCheck,
    environmentWarnings: [],
    ws: { puppeteer: null, selenium: null },
    webdriver: null,
    errorMessage: null,
    leaseGeneration: mockLease(request).generation,
    leaseExpiresAt: mockLease(request).expiresAt,
  };
  mockRuntime.set(profileId, runtime);
  return runtime;
}

export function mockUpdateRemoteLease(
  request?: Record<string, unknown>,
): RuntimeProfile | null {
  const profileId = stringValue(request?.profileId) ?? '';
  const runtime = mockRuntime.get(profileId);
  if (!runtime || runtime.leaseGeneration !== request?.generation) return null;
  const updated: RuntimeProfile = {
    ...runtime,
    leaseExpiresAt: stringValue(request?.leaseExpiresAt) ?? null,
  };
  mockRuntime.set(profileId, updated);
  return updated;
}

function mockLease(request?: Record<string, unknown>) {
  const lease = request?.lease as
    { generation?: unknown; expiresAt?: unknown } | null | undefined;
  return {
    generation: typeof lease?.generation === 'number' ? lease.generation : null,
    expiresAt: stringValue(lease?.expiresAt) ?? null,
  };
}

export function mockCloseProfile(
  request?: Record<string, unknown>,
): CloseProfileResult {
  const profileId = stringValue(request?.profileId) ?? '';
  const leaseGeneration = mockRuntime.get(profileId)?.leaseGeneration ?? null;
  mockRuntime.delete(profileId);
  return { profileId, closed: true, leaseGeneration };
}

export function mockCloseAllProfiles(): CloseAllProfilesResult {
  const closed = [...mockRuntime.keys()];
  mockRuntime.clear();
  return { closed };
}
