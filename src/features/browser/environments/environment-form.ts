import type {
  FingerprintConfig,
  ProfileAdvancedConfig,
  ProfileConfig,
} from '../contracts';
import { profileToForm } from '../profile-editor/form';
import { emptyForm, profileModeOptions } from '../profile-editor/types';
import type { RemoteEnvironmentResource } from './types';

export function remoteEnvironmentToForm(
  record: RemoteEnvironmentResource | null,
) {
  if (!record) {
    return emptyForm;
  }
  const profile: ProfileConfig = {
    profileId: record.environment_key,
    profileNo: record.environment_no,
    name: record.name,
    identityName: null,
    remark: record.remark,
    groupId: record.group_key,
    tags: [],
    tabs: [],
    mode: normalizedProfileMode(record.mode),
    proxyId: record.proxy_id ? String(record.proxy_id) : null,
    proxyConfig: null,
    fingerprintConfig: {
      ...defaultFingerprintConfig,
      ...(record.fingerprint_config ?? {}),
    },
    advanced: {
      ...defaultAdvancedConfig,
      ...(record.advanced ?? {}),
      launchArgs:
        record.advanced?.launchArgs ?? defaultAdvancedConfig.launchArgs,
    },
    createdAt: record.created_at,
    updatedAt: record.updated_at ?? record.created_at,
    lastOpenAt: record.last_open_at,
  };
  return profileToForm(profile);
}

export function remoteProxyId(value?: string | null) {
  if (!value || value === 'none') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizedProfileMode(value: string): ProfileConfig['mode'] {
  return (
    profileModeOptions.find((option) => option.value === value)?.value ??
    'standard'
  );
}

const defaultFingerprintConfig: FingerprintConfig = {
  system: null,
  userAgent: null,
  webrtcMode: null,
  webrtcIp: null,
  routeUdpViaProxy: true,
  locale: null,
  timeZone: null,
  acceptLanguages: [],
  platform: null,
  platformVersion: null,
  architecture: null,
  uaFullVersion: null,
  deviceScale: null,
  geolocationMode: null,
  latitude: null,
  longitude: null,
  accuracy: null,
  webglMode: null,
  webglVendor: null,
  webglRenderer: null,
  webgpuMode: null,
  canvasNoise: null,
  audioContextNoise: null,
  screenMode: null,
  screenResolution: null,
  fontsMode: null,
  fonts: null,
  cpuCores: null,
  ramGb: null,
  mediaDevicesMode: null,
  mediaAudioInputs: null,
  mediaAudioOutputs: null,
  mediaVideoInputs: null,
  deviceName: null,
  macAddress: null,
  doNotTrack: null,
};

const defaultAdvancedConfig: ProfileAdvancedConfig = {
  chromiumPath: null,
  userDataDir: null,
  launchArgs: [],
  headless: false,
  lastOpenedTabs: false,
  passwordFilling: false,
  passwordSaving: false,
  deleteCacheOnClose: false,
  failClosed: false,
  exitOnLastTab: true,
  privacyBoundaryPolicyPath: null,
  privacyBoundaryAutoNetworkLocation: true,
  privacyBoundaryIpAddress: null,
  privacyBoundaryCountryCode: null,
};
