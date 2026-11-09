import type { ProfileEditorForm, SystemFingerprintDefaults } from './types';

export function randomFingerprintPatch(
  form: ProfileEditorForm,
  defaults: SystemFingerprintDefaults,
): Partial<ProfileEditorForm> {
  const identitySeed = fingerprintIdentitySeed(form, defaults);

  // Keep native system signals; only per-profile noise seeds should vary.
  return {
    mode: 'compat',
    system: '',
    userAgent: '',
    platform: '',
    platformVersion: '',
    architecture: '',
    uaFullVersion: '',
    deviceScale: '',
    webrtcMode: 'off',
    webrtcIp: '',
    routeUdpViaProxy: true,
    locale: '',
    timeZone: '',
    acceptLanguages: '',
    geolocationMode: 'auto',
    latitude: '',
    longitude: '',
    accuracy: '',
    webglMode: 'real',
    webglVendor: '',
    webglRenderer: '',
    webgpuMode: 'on',
    canvasNoise: noiseValue(identitySeed, 'canvas'),
    audioContextNoise: noiseValue(identitySeed, 'audio-context'),
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
  };
}

function randomSeed32() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

    return seed || 1;
  }

  return randomInteger(1, 0xffffffff);
}

function fingerprintIdentitySeed(
  form: ProfileEditorForm,
  defaults: SystemFingerprintDefaults,
) {
  const nonce = randomSeed32().toString(16).padStart(8, '0');

  return [
    'one-browser-privacy-fingerprint-v1',
    nonce,
    form.profileId,
    form.name,
    form.groupId,
    defaults.userAgent,
    defaults.platform,
    defaults.platformVersion,
    defaults.architecture,
    defaults.locale,
    defaults.timeZone,
    defaults.acceptLanguages,
    defaults.screenResolution,
    defaults.webglVendor,
    defaults.webglRenderer,
    defaults.cpuCores,
    defaults.ramGb,
  ]
    .map((value) => value.trim())
    .join('|');
}

function noiseValue(seed: string, surface: string) {
  return `Noise [${deriveSeed32(seed, surface)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0')}]`;
}

function deriveSeed32(seed: string, salt: string) {
  const value = [...`${seed}:${salt}`].reduce(
    (hash, character) =>
      Math.imul(hash ^ character.charCodeAt(0), 0x01000193) >>> 0,
    0x811c9dc5,
  );

  return value || 1;
}

function randomInteger(min: number, max: number, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
