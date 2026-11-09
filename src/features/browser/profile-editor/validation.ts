import { z } from 'zod/v3';

const text = z.string();
const flag = z.boolean();
const optionalNumberText = z.string().refine(
  (value) => {
    const trimmed = normalizeNumberText(value);
    return trimmed.length === 0 || Number.isFinite(Number(trimmed));
  },
  { message: '请输入有效数字' },
);

export const profileEditorSchema = z
  .object({
    profileId: text,
    profileNo: text,
    name: text,
    remark: text,
    groupId: text,
    tags: text,
    tabs: text,
    cookies: text.refine(isValidCookieText, {
      message: 'Cookie 格式需为 JSON、Netscape 或 Name=Value',
    }),
    mode: z.enum(['standard', 'compat', 'strict', 'dev']),
    proxyMode: z.enum(['none', 'static', 'rotating']),
    proxyId: text,
    inlineProxyEnabled: flag,
    proxyType: z.enum([
      'no_proxy',
      'http',
      'https',
      'socks5',
      'fixed_servers',
      'pac_script',
    ]),
    proxyHost: text,
    proxyPort: text,
    proxyUsername: text,
    proxyPassword: text,
    proxyServer: text,
    proxyPacUrl: text,
    proxyBypassList: text,
    system: text,
    userAgent: text,
    webrtcMode: text,
    webrtcIp: text,
    routeUdpViaProxy: flag,
    locale: text,
    timeZone: text,
    acceptLanguages: text,
    platform: text,
    platformVersion: text,
    architecture: text,
    uaFullVersion: text,
    deviceScale: optionalNumberText,
    geolocationMode: text,
    latitude: optionalNumberText,
    longitude: optionalNumberText,
    accuracy: optionalNumberText,
    webglMode: text,
    webglVendor: text,
    webglRenderer: text,
    webgpuMode: text,
    canvasNoise: text,
    audioContextNoise: text,
    screenMode: text,
    screenResolution: text,
    fontsMode: text,
    fonts: text,
    cpuCores: optionalNumberText,
    ramGb: optionalNumberText,
    mediaDevicesMode: text,
    mediaAudioInputs: optionalNumberText,
    mediaAudioOutputs: optionalNumberText,
    mediaVideoInputs: optionalNumberText,
    deviceName: text,
    macAddress: text,
    doNotTrack: z.enum(['system', 'off', 'on']),
    chromiumPath: text,
    userDataDir: text,
    launchArgs: text,
    headless: flag,
    lastOpenedTabs: flag,
    passwordFilling: flag,
    passwordSaving: flag,
    deleteCacheOnClose: flag,
    failClosed: flag,
    exitOnLastTab: flag,
    privacyBoundaryPolicyPath: text,
    privacyBoundaryAutoNetworkLocation: flag,
    privacyBoundaryIpAddress: text,
    privacyBoundaryCountryCode: text,
  })
  .superRefine((value, context) => {
    addMaxNumberIssue(
      context,
      value.cpuCores,
      ['cpuCores'],
      128,
      'CPU 不能超过 128',
    );
    addMaxNumberIssue(
      context,
      value.ramGb,
      ['ramGb'],
      128,
      'RAM 不能超过 128 GB',
    );

    if (
      value.proxyMode !== 'none' &&
      (!value.proxyId.trim() || value.proxyId === 'none')
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['proxyId'],
        message: '请选择已保存代理',
      });
    }

    if (value.geolocationMode !== 'manual') {
      return;
    }

    if (!value.latitude.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['latitude'],
        message: '纬度不能为空',
      });
    }

    if (!value.longitude.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['longitude'],
        message: '经度不能为空',
      });
    }

    addMinNumberIssue(
      context,
      value.accuracy,
      ['accuracy'],
      10,
      '精度不能小于 10',
    );
  });

function addMaxNumberIssue(
  context: z.RefinementCtx,
  value: string,
  path: string[],
  maxValue: number,
  message: string,
) {
  const trimmed = normalizeNumberText(value);

  if (!trimmed) {
    return;
  }

  const parsedValue = Number(trimmed);

  if (Number.isFinite(parsedValue) && parsedValue > maxValue) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message,
    });
  }
}

function addMinNumberIssue(
  context: z.RefinementCtx,
  value: string,
  path: string[],
  minValue: number,
  message: string,
) {
  const trimmed = normalizeNumberText(value);

  if (!trimmed) {
    return;
  }

  const parsedValue = Number(trimmed);

  if (Number.isFinite(parsedValue) && parsedValue < minValue) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message,
    });
  }
}

function normalizeNumberText(value: string) {
  return value
    .trim()
    .replace(/\s*(cores?|核|gb|g)$/i, '')
    .trim();
}

function isValidCookieText(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  return (
    isJsonCookieText(trimmed) ||
    isNetscapeCookieText(trimmed) ||
    isNameValueCookieText(trimmed)
  );
}

function isJsonCookieText(value: string) {
  if (!value.startsWith('[') && !value.startsWith('{')) {
    return false;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.every(
        (item) =>
          isRecord(item) &&
          typeof item.name === 'string' &&
          typeof item.value === 'string',
      );
    }

    return isRecord(parsed);
  } catch {
    return false;
  }
}

function isNetscapeCookieText(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  if (!lines.length) {
    return false;
  }

  return lines.every((line) => {
    const columns = line.split(/\t+/);
    return (
      columns.length >= 7 &&
      columns[0].length > 0 &&
      columns[2].startsWith('/') &&
      columns[5].length > 0
    );
  });
}

function isNameValueCookieText(value: string) {
  const entries = value
    .split(/[;\r\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!entries.length) {
    return false;
  }

  return entries.every((entry) => /^[^=\s;]+=[\s\S]*$/.test(entry));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
