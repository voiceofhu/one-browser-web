import type {
  CreateProfileRequest,
  FingerprintConfig,
  ProfileAdvancedConfig,
  ProfileConfig,
  UpdateProfileRequest,
} from '@/features/browser/contracts';

import { normalizeProfileGroup } from '../profiles/group-utils';
import { type ProfileEditorForm, emptyForm } from './types';

export function profileToForm(profile: ProfileConfig): ProfileEditorForm {
  const hasProxy = Boolean(profile.proxyId);

  return {
    ...emptyForm,
    profileId: profile.profileId,
    profileNo: profile.profileNo ?? '',
    name: profile.name,
    remark: profile.remark,
    groupId: normalizeProfileGroup(profile.groupId),
    tags: profile.tags.join(', '),
    tabs: profile.tabs.join('\n'),
    mode: profile.mode,
    proxyMode: hasProxy ? 'static' : 'none',
    proxyId: profile.proxyId ?? 'none',
    inlineProxyEnabled: false,
    proxyType: profile.proxyConfig?.type ?? 'http',
    proxyHost: profile.proxyConfig?.host ?? '',
    proxyPort: profile.proxyConfig?.port
      ? String(profile.proxyConfig.port)
      : '',
    proxyUsername: profile.proxyConfig?.username ?? '',
    proxyPassword: profile.proxyConfig?.password ?? '',
    proxyServer: profile.proxyConfig?.server ?? '',
    proxyPacUrl: profile.proxyConfig?.pacUrl ?? '',
    proxyBypassList: profile.proxyConfig?.bypassList.join('\n') ?? '',
    system: profile.fingerprintConfig.system ?? '',
    userAgent: profile.fingerprintConfig.userAgent ?? '',
    webrtcMode: profile.fingerprintConfig.webrtcMode ?? 'auto',
    webrtcIp: profile.fingerprintConfig.webrtcIp ?? '',
    routeUdpViaProxy: profile.fingerprintConfig.routeUdpViaProxy ?? true,
    locale: profile.fingerprintConfig.locale ?? '',
    timeZone: profile.fingerprintConfig.timeZone ?? '',
    acceptLanguages: profile.fingerprintConfig.acceptLanguages.join(', '),
    platform: profile.fingerprintConfig.platform ?? '',
    platformVersion: profile.fingerprintConfig.platformVersion ?? '',
    architecture: profile.fingerprintConfig.architecture ?? '',
    uaFullVersion: profile.fingerprintConfig.uaFullVersion ?? '',
    deviceScale: profile.fingerprintConfig.deviceScale
      ? String(profile.fingerprintConfig.deviceScale)
      : '',
    geolocationMode: profile.fingerprintConfig.geolocationMode ?? 'auto',
    latitude:
      profile.fingerprintConfig.latitude != null
        ? String(profile.fingerprintConfig.latitude)
        : '',
    longitude:
      profile.fingerprintConfig.longitude != null
        ? String(profile.fingerprintConfig.longitude)
        : '',
    accuracy:
      profile.fingerprintConfig.accuracy != null
        ? String(profile.fingerprintConfig.accuracy)
        : '',
    webglMode: profile.fingerprintConfig.webglMode ?? 'real',
    webglVendor: profile.fingerprintConfig.webglVendor ?? '',
    webglRenderer: profile.fingerprintConfig.webglRenderer ?? '',
    webgpuMode: profile.fingerprintConfig.webgpuMode ?? 'on',
    canvasNoise: profile.fingerprintConfig.canvasNoise ?? '',
    audioContextNoise: profile.fingerprintConfig.audioContextNoise ?? '',
    screenMode: profile.fingerprintConfig.screenMode ?? 'real',
    screenResolution: profile.fingerprintConfig.screenResolution ?? '',
    fontsMode: profile.fingerprintConfig.fontsMode ?? 'auto',
    fonts: profile.fingerprintConfig.fonts ?? '',
    cpuCores:
      profile.fingerprintConfig.cpuCores != null
        ? String(profile.fingerprintConfig.cpuCores)
        : '',
    ramGb:
      profile.fingerprintConfig.ramGb != null
        ? String(profile.fingerprintConfig.ramGb)
        : '',
    mediaDevicesMode: profile.fingerprintConfig.mediaDevicesMode ?? 'auto',
    mediaAudioInputs:
      profile.fingerprintConfig.mediaAudioInputs != null
        ? String(profile.fingerprintConfig.mediaAudioInputs)
        : '',
    mediaAudioOutputs:
      profile.fingerprintConfig.mediaAudioOutputs != null
        ? String(profile.fingerprintConfig.mediaAudioOutputs)
        : '',
    mediaVideoInputs:
      profile.fingerprintConfig.mediaVideoInputs != null
        ? String(profile.fingerprintConfig.mediaVideoInputs)
        : '',
    deviceName: profile.fingerprintConfig.deviceName ?? '',
    macAddress: profile.fingerprintConfig.macAddress ?? '',
    doNotTrack:
      profile.fingerprintConfig.doNotTrack == null
        ? 'system'
        : profile.fingerprintConfig.doNotTrack
          ? 'on'
          : 'off',
    chromiumPath: profile.advanced.chromiumPath ?? '',
    userDataDir: profile.advanced.userDataDir ?? '',
    launchArgs: profile.advanced.launchArgs.join('\n'),
    headless: profile.advanced.headless,
    lastOpenedTabs: profile.advanced.lastOpenedTabs,
    passwordFilling: profile.advanced.passwordFilling,
    passwordSaving: profile.advanced.passwordSaving,
    deleteCacheOnClose: profile.advanced.deleteCacheOnClose,
    failClosed: profile.advanced.failClosed,
    exitOnLastTab: profile.advanced.exitOnLastTab,
    privacyBoundaryPolicyPath: profile.advanced.privacyBoundaryPolicyPath ?? '',
    privacyBoundaryAutoNetworkLocation:
      profile.advanced.privacyBoundaryAutoNetworkLocation,
    privacyBoundaryIpAddress: profile.advanced.privacyBoundaryIpAddress ?? '',
    privacyBoundaryCountryCode:
      profile.advanced.privacyBoundaryCountryCode ?? '',
  };
}

export function formToPayload(
  form: ProfileEditorForm,
): CreateProfileRequest & UpdateProfileRequest {
  const fingerprintConfig: Partial<FingerprintConfig> = {
    system: nullableValue(form.system),
    userAgent: nullableValue(form.userAgent),
    webrtcMode: nullableValue(form.webrtcMode),
    webrtcIp: nullableValue(form.webrtcIp),
    routeUdpViaProxy: form.routeUdpViaProxy,
    locale: nullableValue(form.locale),
    timeZone: nullableValue(form.timeZone),
    acceptLanguages: listValue(form.acceptLanguages),
    platform: nullableValue(form.platform),
    platformVersion: nullableValue(form.platformVersion),
    architecture: nullableValue(form.architecture),
    uaFullVersion: nullableValue(form.uaFullVersion),
    deviceScale: numberValue(form.deviceScale),
    geolocationMode: nullableValue(form.geolocationMode),
    latitude: numberValue(form.latitude),
    longitude: numberValue(form.longitude),
    accuracy: geolocationAccuracyValue(form),
    webglMode: nullableValue(form.webglMode),
    webglVendor: nullableValue(form.webglVendor),
    webglRenderer: nullableValue(form.webglRenderer),
    webgpuMode: nullableValue(form.webgpuMode),
    canvasNoise: nullableValue(form.canvasNoise),
    audioContextNoise: nullableValue(form.audioContextNoise),
    screenMode: nullableValue(form.screenMode),
    screenResolution: nullableValue(form.screenResolution),
    fontsMode: nullableValue(form.fontsMode),
    fonts: nullableValue(form.fonts),
    cpuCores: numberValue(form.cpuCores),
    ramGb: numberValue(form.ramGb),
    mediaDevicesMode: nullableValue(form.mediaDevicesMode),
    mediaAudioInputs: numberValue(form.mediaAudioInputs),
    mediaAudioOutputs: numberValue(form.mediaAudioOutputs),
    mediaVideoInputs: numberValue(form.mediaVideoInputs),
    deviceName: nullableValue(form.deviceName),
    macAddress: nullableValue(form.macAddress),
    doNotTrack: doNotTrackValue(form.doNotTrack),
  };
  const advanced: Partial<ProfileAdvancedConfig> = {
    chromiumPath: nullableValue(form.chromiumPath),
    userDataDir: nullableValue(form.userDataDir),
    launchArgs: multilineValue(form.launchArgs),
    headless: form.headless,
    lastOpenedTabs: form.lastOpenedTabs,
    passwordFilling: form.passwordFilling,
    passwordSaving: form.passwordSaving,
    deleteCacheOnClose: form.deleteCacheOnClose,
    failClosed: form.failClosed,
    exitOnLastTab: form.exitOnLastTab,
    privacyBoundaryPolicyPath: nullableValue(form.privacyBoundaryPolicyPath),
    privacyBoundaryAutoNetworkLocation: form.privacyBoundaryAutoNetworkLocation,
    privacyBoundaryIpAddress: nullableValue(form.privacyBoundaryIpAddress),
    privacyBoundaryCountryCode: nullableValue(form.privacyBoundaryCountryCode),
  };

  return {
    profileId: form.profileId.trim(),
    profileNo: nullableValue(form.profileNo),
    name: form.name.trim(),
    remark: form.remark.trim(),
    groupId: nullableValue(normalizeProfileGroup(form.groupId)),
    tags: listValue(form.tags),
    tabs: multilineValue(form.tabs),
    mode: form.mode,
    proxyId:
      form.proxyMode === 'none' || form.proxyId === 'none'
        ? null
        : form.proxyId,
    proxyConfig: null,
    fingerprintConfig,
    advanced,
  };
}

export function generatedProfileId(form: ProfileEditorForm) {
  const seed = form.name || form.groupId || 'profile';
  const normalized = seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `${normalized || 'profile'}-${Date.now().toString(36)}`;
}

function nullableValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function listValue(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function multilineValue(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberValue(value: string) {
  const normalized = value
    .trim()
    .replace(/\s*(cores?|核|gb|g)$/i, '')
    .trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && normalized.length > 0 ? parsed : null;
}

function geolocationAccuracyValue(form: ProfileEditorForm) {
  if (form.geolocationMode === 'manual' && !form.accuracy.trim()) {
    return 10;
  }

  return numberValue(form.accuracy);
}

function doNotTrackValue(value: ProfileEditorForm['doNotTrack']) {
  if (value === 'system') {
    return null;
  }

  return value === 'on';
}
