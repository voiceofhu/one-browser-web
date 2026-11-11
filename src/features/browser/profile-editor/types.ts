import type { ProfileMode, ProxyType } from '@/features/browser/contracts';

export type EditorMode = 'create' | 'edit';
export type ProxyMode = 'none' | 'static' | 'rotating';
export type DoNotTrackMode = 'system' | 'off' | 'on';

export interface SystemFingerprintDefaults {
  system: string;
  userAgent: string;
  webrtcMode: string;
  webrtcIp: string;
  routeUdpViaProxy: boolean;
  locale: string;
  timeZone: string;
  acceptLanguages: string;
  platform: string;
  platformVersion: string;
  architecture: string;
  uaFullVersion: string;
  deviceScale: string;
  geolocationMode: string;
  webglMode: string;
  webglVendor: string;
  webglRenderer: string;
  webgpuMode: string;
  canvasNoise: string;
  audioContextNoise: string;
  screenMode: string;
  screenResolution: string;
  fontsMode: string;
  fonts: string;
  cpuCores: string;
  ramGb: string;
  mediaDevicesMode: string;
  mediaAudioInputs: string;
  mediaAudioOutputs: string;
  mediaVideoInputs: string;
  deviceName: string;
  macAddress: string;
  doNotTrack: DoNotTrackMode;
}

export interface ProfileEditorProps {
  mode: EditorMode;
  open: boolean;
  groupOptions?: string[];
  profileId?: string | null;
  onOpenChange: (open: boolean) => void;
}

export interface ProfileEditorForm {
  profileId: string;
  profileNo: string;
  name: string;
  remark: string;
  groupId: string;
  tags: string;
  tabs: string;
  cookies: string;
  mode: ProfileMode;
  proxyMode: ProxyMode;
  proxyId: string;
  inlineProxyEnabled: boolean;
  proxyType: ProxyType;
  proxyHost: string;
  proxyPort: string;
  proxyUsername: string;
  proxyPassword: string;
  proxyServer: string;
  proxyPacUrl: string;
  proxyBypassList: string;
  system: string;
  userAgent: string;
  webrtcMode: string;
  webrtcIp: string;
  routeUdpViaProxy: boolean;
  locale: string;
  timeZone: string;
  acceptLanguages: string;
  platform: string;
  platformVersion: string;
  architecture: string;
  uaFullVersion: string;
  deviceScale: string;
  geolocationMode: string;
  latitude: string;
  longitude: string;
  accuracy: string;
  webglMode: string;
  webglVendor: string;
  webglRenderer: string;
  webgpuMode: string;
  canvasNoise: string;
  audioContextNoise: string;
  screenMode: string;
  screenResolution: string;
  fontsMode: string;
  fonts: string;
  cpuCores: string;
  ramGb: string;
  mediaDevicesMode: string;
  mediaAudioInputs: string;
  mediaAudioOutputs: string;
  mediaVideoInputs: string;
  deviceName: string;
  macAddress: string;
  doNotTrack: DoNotTrackMode;
  chromiumPath: string;
  userDataDir: string;
  launchArgs: string;
  headless: boolean;
  lastOpenedTabs: boolean;
  passwordFilling: boolean;
  passwordSaving: boolean;
  deleteCacheOnClose: boolean;
  failClosed: boolean;
  exitOnLastTab: boolean;
  privacyBoundaryPolicyPath: string;
  privacyBoundaryAutoNetworkLocation: boolean;
  privacyBoundaryIpAddress: string;
  privacyBoundaryCountryCode: string;
}

export const emptyForm: ProfileEditorForm = {
  profileId: '',
  profileNo: '',
  name: '',
  remark: '',
  groupId: '',
  tags: '',
  tabs: '',
  cookies: '',
  mode: 'standard',
  proxyMode: 'none',
  proxyId: 'none',
  inlineProxyEnabled: false,
  proxyType: 'http',
  proxyHost: '',
  proxyPort: '',
  proxyUsername: '',
  proxyPassword: '',
  proxyServer: '',
  proxyPacUrl: '',
  proxyBypassList: '',
  system: '',
  userAgent: '',
  webrtcMode: 'auto',
  webrtcIp: '',
  routeUdpViaProxy: true,
  locale: '',
  timeZone: '',
  acceptLanguages: '',
  platform: '',
  platformVersion: '',
  architecture: '',
  uaFullVersion: '',
  deviceScale: '',
  geolocationMode: 'auto',
  latitude: '',
  longitude: '',
  accuracy: '',
  webglMode: 'real',
  webglVendor: '',
  webglRenderer: '',
  webgpuMode: 'on',
  canvasNoise: '',
  audioContextNoise: '',
  screenMode: 'real',
  screenResolution: '',
  fontsMode: 'auto',
  fonts: '',
  cpuCores: '',
  ramGb: '',
  mediaDevicesMode: 'auto',
  mediaAudioInputs: '',
  mediaAudioOutputs: '',
  mediaVideoInputs: '',
  deviceName: '',
  macAddress: '',
  doNotTrack: 'system',
  chromiumPath: '',
  userDataDir: '',
  launchArgs: '',
  headless: false,
  lastOpenedTabs: false,
  passwordFilling: false,
  passwordSaving: false,
  deleteCacheOnClose: false,
  failClosed: false,
  exitOnLastTab: true,
  privacyBoundaryPolicyPath: '',
  privacyBoundaryAutoNetworkLocation: true,
  privacyBoundaryIpAddress: '',
  privacyBoundaryCountryCode: '',
};

export const profileModeOptions: Array<{ value: ProfileMode; label: string }> =
  [
    { value: 'standard', label: '标准' },
    { value: 'compat', label: '兼容' },
    { value: 'strict', label: '严格' },
    { value: 'dev', label: '开发' },
  ];

export const proxyTypeOptions: Array<{ value: ProxyType; label: string }> = [
  { value: 'http', label: 'HTTP' },
  { value: 'https', label: 'HTTPS' },
  { value: 'socks5', label: 'SOCKS5' },
  { value: 'fixed_servers', label: '固定服务器' },
  { value: 'pac_script', label: 'PAC 脚本' },
];

export type UpdateProfileEditorField = <K extends keyof ProfileEditorForm>(
  key: K,
  value: ProfileEditorForm[K],
) => void;
