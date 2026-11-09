import type { SystemFingerprintDefaults } from './types';

type NavigatorUaData = {
  platform?: string;
  getHighEntropyValues?: (
    hints: string[],
  ) => Promise<Record<string, string | undefined>>;
};

export const fallbackFingerprintDefaults: SystemFingerprintDefaults = {
  system: '当前系统',
  userAgent: '系统默认',
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
  webglMode: 'off',
  webglVendor: '系统默认',
  webglRenderer: '系统默认',
  webgpuMode: 'off',
  canvasNoise: '自动',
  audioContextNoise: '自动',
  screenMode: 'real',
  screenResolution: '',
  fontsMode: 'auto',
  fonts: '系统字体',
  cpuCores: '',
  ramGb: '',
  mediaDevicesMode: 'auto',
  mediaAudioInputs: '1',
  mediaAudioOutputs: '1',
  mediaVideoInputs: '1',
  deviceName: '当前设备',
  macAddress: '系统生成',
  doNotTrack: 'off',
};

export async function readSystemFingerprintDefaults() {
  if (typeof window === 'undefined') {
    return fallbackFingerprintDefaults;
  }

  const navigatorRef = window.navigator;
  const languages = navigatorRef.languages?.length
    ? navigatorRef.languages.join(', ')
    : navigatorRef.language;
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    fallbackFingerprintDefaults.timeZone;
  const uaData = (
    navigatorRef as Navigator & { userAgentData?: NavigatorUaData }
  ).userAgentData;
  const entropy = await readUaEntropy(uaData);
  const webgl = readWebglInfo();
  const mediaDeviceCounts = await readMediaDeviceCounts(navigatorRef);
  const seed = [
    navigatorRef.userAgent,
    navigatorRef.platform,
    languages,
    timeZone,
  ].join('|');

  return {
    ...fallbackFingerprintDefaults,
    system: systemLabel(navigatorRef, uaData, entropy),
    userAgent: navigatorRef.userAgent || fallbackFingerprintDefaults.userAgent,
    locale: navigatorRef.language || '',
    timeZone,
    acceptLanguages: languages || '',
    platform: navigatorRef.platform || uaData?.platform || '',
    platformVersion: entropy.platformVersion ?? '',
    architecture: entropy.architecture ?? '',
    uaFullVersion: entropy.uaFullVersion ?? '',
    deviceScale: Number.isFinite(window.devicePixelRatio)
      ? String(window.devicePixelRatio)
      : '',
    webglVendor: webgl.vendor || fallbackFingerprintDefaults.webglVendor,
    webglRenderer: webgl.renderer || fallbackFingerprintDefaults.webglRenderer,
    webgpuMode: 'off',
    canvasNoise: noiseValue(seed, 'canvas'),
    audioContextNoise: noiseValue(seed, 'audio-context'),
    screenResolution: readScreenResolution(),
    fonts: uaData?.platform || navigatorRef.platform || '系统字体',
    cpuCores: navigatorRef.hardwareConcurrency
      ? String(navigatorRef.hardwareConcurrency)
      : '',
    ramGb: readDeviceMemory(navigatorRef),
    mediaDevicesMode: navigatorRef.mediaDevices ? 'auto' : 'off',
    mediaAudioInputs: mediaDeviceCounts.audioInputs,
    mediaAudioOutputs: mediaDeviceCounts.audioOutputs,
    mediaVideoInputs: mediaDeviceCounts.videoInputs,
    deviceName: deviceName(systemLabel(navigatorRef, uaData, entropy)),
    macAddress: fallbackFingerprintDefaults.macAddress,
    doNotTrack: navigatorRef.doNotTrack === '1' ? 'on' : 'off',
  } satisfies SystemFingerprintDefaults;
}

async function readUaEntropy(uaData?: NavigatorUaData) {
  if (!uaData?.getHighEntropyValues) {
    return {};
  }

  try {
    return await uaData.getHighEntropyValues([
      'platformVersion',
      'architecture',
      'uaFullVersion',
      'fullVersionList',
    ]);
  } catch {
    return {};
  }
}

function systemLabel(
  navigatorRef: Navigator,
  uaData?: NavigatorUaData,
  entropy?: Record<string, string | undefined>,
) {
  const platform = uaData?.platform || navigatorRef.platform;
  const platformVersion = entropy?.platformVersion;
  const majorVersion = platformVersion?.split('.')[0];

  if (/mac/i.test(platform)) {
    return majorVersion ? `macOS ${majorVersion}` : 'macOS';
  }

  if (/win/i.test(platform)) {
    return majorVersion ? `Windows ${majorVersion}` : 'Windows';
  }

  if (/linux/i.test(platform)) {
    return 'Linux';
  }

  return platform || fallbackFingerprintDefaults.system;
}

function deviceName(system: string) {
  if (system.startsWith('macOS')) {
    return 'Mac';
  }

  if (system.startsWith('Windows')) {
    return 'Windows PC';
  }

  return `${system} 设备`;
}

function readWebglInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl || !('getExtension' in gl)) {
      return { vendor: '', renderer: '' };
    }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return { vendor: '', renderer: '' };
    }

    return {
      vendor: String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) ?? ''),
      renderer: String(
        gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '',
      ),
    };
  } catch {
    return { vendor: '', renderer: '' };
  }
}

function readScreenResolution() {
  if (typeof window === 'undefined') {
    return '';
  }

  const width = window.screen?.width;
  const height = window.screen?.height;

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return '';
  }

  return `${width}x${height}`;
}

function readDeviceMemory(navigatorRef: Navigator) {
  const memory = (navigatorRef as Navigator & { deviceMemory?: number })
    .deviceMemory;
  return Number.isFinite(memory) ? String(memory) : '';
}

async function readMediaDeviceCounts(navigatorRef: Navigator) {
  if (!navigatorRef.mediaDevices?.enumerateDevices) {
    return { audioInputs: '1', audioOutputs: '1', videoInputs: '1' };
  }

  try {
    const devices = await navigatorRef.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(
      (device) => device.kind === 'audioinput',
    ).length;
    const audioOutputs = devices.filter(
      (device) => device.kind === 'audiooutput',
    ).length;
    const videoInputs = devices.filter(
      (device) => device.kind === 'videoinput',
    ).length;

    return {
      audioInputs: String(Math.max(audioInputs, 1)),
      audioOutputs: String(Math.max(audioOutputs, 1)),
      videoInputs: String(Math.max(videoInputs, 1)),
    };
  } catch {
    return { audioInputs: '1', audioOutputs: '1', videoInputs: '1' };
  }
}

function noiseValue(seed: string, salt: string) {
  const hash = [...`${seed}:${salt}`].reduce(
    (value, character) =>
      (Math.imul(value, 31) + character.charCodeAt(0)) >>> 0,
    0x811c9dc5,
  );
  return `Noise [${hash.toString(16).toUpperCase().padStart(8, '0')}]`;
}
