import type {
  DeleteProfilesResult,
  ProfileConfig,
  ProfileListItem,
} from '@/features/browser/contracts';
import {
  formatInlineProxyUrl,
  formatStoredProxyUrl,
} from '@/lib/desktop/mock/proxies';
import {
  mockNow,
  mockProfiles,
  mockProxies,
  mockRuntime,
} from '@/lib/desktop/mock/state';
import {
  booleanValue,
  inlineProxyValue,
  mustGet,
  nullableBoolean,
  nullableString,
  numberOrNull,
  profileModeValue,
  recordValue,
  stringArray,
  stringValue,
  toStringList,
} from '@/lib/desktop/mock/values';

export function mockCreateProfile(
  request?: Record<string, unknown>,
): ProfileConfig {
  const profileId =
    stringValue(request?.profileId) ?? `profile-${mockProfiles.size + 1}`;
  const fingerprintPatch = recordValue(request?.fingerprintConfig);
  const advancedPatch = recordValue(request?.advanced);
  const profile: ProfileConfig = {
    profileId,
    profileNo: nullableString(request?.profileNo),
    name: stringValue(request?.name) ?? profileId,
    identityName: nullableString(request?.identityName),
    remark: stringValue(request?.remark) ?? '',
    groupId: nullableString(request?.groupId),
    tags: stringArray(request?.tags),
    tabs: stringArray(request?.tabs),
    mode: profileModeValue(request?.mode),
    proxyId: nullableString(request?.proxyId),
    proxyConfig: inlineProxyValue(request?.proxyConfig),
    fingerprintConfig: {
      system: nullableString(fingerprintPatch.system),
      userAgent: nullableString(fingerprintPatch.userAgent),
      webrtcMode: nullableString(fingerprintPatch.webrtcMode),
      webrtcIp: nullableString(fingerprintPatch.webrtcIp),
      routeUdpViaProxy: nullableBoolean(fingerprintPatch.routeUdpViaProxy),
      locale: nullableString(fingerprintPatch.locale),
      timeZone: nullableString(fingerprintPatch.timeZone),
      acceptLanguages: stringArray(fingerprintPatch.acceptLanguages),
      platform: nullableString(fingerprintPatch.platform),
      platformVersion: nullableString(fingerprintPatch.platformVersion),
      architecture: nullableString(fingerprintPatch.architecture),
      uaFullVersion: nullableString(fingerprintPatch.uaFullVersion),
      deviceScale: numberOrNull(fingerprintPatch.deviceScale),
      geolocationMode: nullableString(fingerprintPatch.geolocationMode),
      latitude: numberOrNull(fingerprintPatch.latitude),
      longitude: numberOrNull(fingerprintPatch.longitude),
      accuracy: numberOrNull(fingerprintPatch.accuracy),
      webglMode: nullableString(fingerprintPatch.webglMode),
      webglVendor: nullableString(fingerprintPatch.webglVendor),
      webglRenderer: nullableString(fingerprintPatch.webglRenderer),
      webgpuMode: nullableString(fingerprintPatch.webgpuMode),
      canvasNoise: nullableString(fingerprintPatch.canvasNoise),
      audioContextNoise: nullableString(fingerprintPatch.audioContextNoise),
      screenMode: nullableString(fingerprintPatch.screenMode),
      screenResolution: nullableString(fingerprintPatch.screenResolution),
      fontsMode: nullableString(fingerprintPatch.fontsMode),
      fonts: nullableString(fingerprintPatch.fonts),
      cpuCores: numberOrNull(fingerprintPatch.cpuCores),
      ramGb: numberOrNull(fingerprintPatch.ramGb),
      mediaDevicesMode: nullableString(fingerprintPatch.mediaDevicesMode),
      mediaAudioInputs: numberOrNull(fingerprintPatch.mediaAudioInputs),
      mediaAudioOutputs: numberOrNull(fingerprintPatch.mediaAudioOutputs),
      mediaVideoInputs: numberOrNull(fingerprintPatch.mediaVideoInputs),
      deviceName: nullableString(fingerprintPatch.deviceName),
      macAddress: nullableString(fingerprintPatch.macAddress),
      doNotTrack: nullableBoolean(fingerprintPatch.doNotTrack),
    },
    advanced: {
      chromiumPath: nullableString(advancedPatch.chromiumPath),
      userDataDir: nullableString(advancedPatch.userDataDir),
      launchArgs: stringArray(advancedPatch.launchArgs),
      headless: booleanValue(advancedPatch.headless),
      lastOpenedTabs: booleanValue(advancedPatch.lastOpenedTabs),
      passwordFilling: booleanValue(advancedPatch.passwordFilling),
      passwordSaving: booleanValue(advancedPatch.passwordSaving),
      deleteCacheOnClose: booleanValue(advancedPatch.deleteCacheOnClose),
      failClosed: booleanValue(advancedPatch.failClosed),
      exitOnLastTab: booleanValue(advancedPatch.exitOnLastTab, true),
      privacyBoundaryPolicyPath: nullableString(
        advancedPatch.privacyBoundaryPolicyPath,
      ),
      privacyBoundaryAutoNetworkLocation: booleanValue(
        advancedPatch.privacyBoundaryAutoNetworkLocation,
        true,
      ),
      privacyBoundaryIpAddress: nullableString(
        advancedPatch.privacyBoundaryIpAddress,
      ),
      privacyBoundaryCountryCode: nullableString(
        advancedPatch.privacyBoundaryCountryCode,
      ),
    },
    createdAt: mockNow,
    updatedAt: mockNow,
    lastOpenAt: null,
  };
  mockProfiles.set(profileId, profile);
  return profile;
}

export function mockUpdateProfile(
  request?: Record<string, unknown>,
): ProfileConfig {
  const profile = mustGet(mockProfiles, request?.profileId, 'profile');
  const updated = {
    ...profile,
    ...request,
    proxyConfig:
      request && 'proxyConfig' in request
        ? inlineProxyValue(request.proxyConfig)
        : profile.proxyConfig,
    fingerprintConfig: {
      ...profile.fingerprintConfig,
      ...recordValue(request?.fingerprintConfig),
    },
    advanced: {
      ...profile.advanced,
      ...recordValue(request?.advanced),
    },
    updatedAt: mockNow,
  } as ProfileConfig;
  mockProfiles.set(updated.profileId, updated);
  return updated;
}

export function mockDeleteProfiles(
  request?: Record<string, unknown>,
): DeleteProfilesResult {
  const deleted = toStringList(request?.profileIds);
  deleted.forEach((profileId) => {
    mockProfiles.delete(profileId);
    mockRuntime.delete(profileId);
  });
  return { deleted };
}

export function toProfileListItem(profile: ProfileConfig): ProfileListItem {
  const runtime = mockRuntime.get(profile.profileId);
  const proxyLastCheck = profile.proxyId
    ? mockProxies.get(profile.proxyId)?.lastCheck
    : null;
  const proxyLocation = runtime?.proxyStatus ?? proxyLastCheck;
  const status = runtime?.status ?? 'inactive';
  return {
    profileId: profile.profileId,
    profileNo: profile.profileNo,
    name: profile.name,
    groupId: profile.groupId,
    tags: profile.tags,
    status,
    publicStatus: status === 'active' ? 'Active' : 'Inactive',
    proxyId: profile.proxyId,
    proxySummary: profile.proxyId ?? profile.proxyConfig?.type ?? '无代理',
    proxyUrl: mockProfileProxyUrl(profile),
    proxyExitIp: proxyLocation?.exitIp ?? null,
    proxyCountryCode: proxyLocation?.countryCode ?? null,
    proxyCountry: proxyLocation?.country ?? null,
    proxyRegion: proxyLocation?.region ?? null,
    pid: runtime?.pid ?? null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    lastOpenAt: profile.lastOpenAt,
  };
}

function mockProfileProxyUrl(profile: ProfileConfig) {
  if (profile.proxyId) {
    const proxy = mockProxies.get(profile.proxyId);
    return proxy ? formatStoredProxyUrl(proxy) : profile.proxyId;
  }
  return profile.proxyConfig
    ? formatInlineProxyUrl(profile.proxyConfig)
    : '无代理';
}
