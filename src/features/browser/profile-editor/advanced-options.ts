export const webrtcModeOptions = [
  { value: 'off', label: '关闭' },
  { value: 'real', label: '真实' },
  { value: 'auto', label: '自动' },
  { value: 'manual', label: '手动' },
];

const realManualRandomOptions = [
  { value: 'real', label: '真实' },
  { value: 'manual', label: '手动' },
  { value: 'random', label: '随机' },
];

export const offRealManualRandomOptions = [
  { value: 'off', label: '关闭' },
  ...realManualRandomOptions,
];

export const autoManualOptions = [
  { value: 'auto', label: '基于 IP' },
  { value: 'manual', label: '自定义' },
];

export type TimeZoneOption = { value: string; label: string };
export type LanguageOption = {
  value: string;
  label: string;
  acceptLanguages: string;
};
export type WebglSystemValue = 'macos' | 'windows' | 'linux';
export type WebglVendorOption = {
  value: string;
  label: string;
  iconUrl: string;
  systems: WebglSystemValue[];
  renderers: string[];
};
export type WebglRendererOption = { value: string; label: string };

const languageOptions: LanguageOption[] = [
  { value: 'af', label: 'Afrikaans', acceptLanguages: 'af' },
  { value: 'sq', label: 'Albanian', acceptLanguages: 'sq' },
  { value: 'am', label: 'Amharic', acceptLanguages: 'am' },
  { value: 'ar', label: 'Arabic', acceptLanguages: 'ar' },
  { value: 'an', label: 'Aragonese', acceptLanguages: 'an' },
  { value: 'hy', label: 'Armenian', acceptLanguages: 'hy' },
  { value: 'ast', label: 'Asturian', acceptLanguages: 'ast' },
  { value: 'az', label: 'Azerbaijani', acceptLanguages: 'az' },
  { value: 'bn', label: 'Bangla', acceptLanguages: 'bn' },
  { value: 'eu', label: 'Basque', acceptLanguages: 'eu' },
  { value: 'be', label: 'Belarusian', acceptLanguages: 'be' },
  { value: 'bg', label: 'Bulgarian', acceptLanguages: 'bg' },
  { value: 'ca', label: 'Catalan', acceptLanguages: 'ca' },
  {
    value: 'zh-CN',
    label: 'Chinese (Simplified)',
    acceptLanguages: 'zh-CN, zh',
  },
  {
    value: 'zh-TW',
    label: 'Chinese (Traditional)',
    acceptLanguages: 'zh-TW, zh',
  },
  { value: 'hr', label: 'Croatian', acceptLanguages: 'hr' },
  { value: 'cs', label: 'Czech', acceptLanguages: 'cs' },
  { value: 'da', label: 'Danish', acceptLanguages: 'da' },
  { value: 'nl', label: 'Dutch', acceptLanguages: 'nl' },
  {
    value: 'en-US',
    label: 'English (United States)',
    acceptLanguages: 'en-US, en',
  },
  {
    value: 'en-GB',
    label: 'English (United Kingdom)',
    acceptLanguages: 'en-GB, en',
  },
  { value: 'et', label: 'Estonian', acceptLanguages: 'et' },
  { value: 'fi', label: 'Finnish', acceptLanguages: 'fi' },
  { value: 'fr-FR', label: 'French', acceptLanguages: 'fr-FR, fr' },
  { value: 'gl', label: 'Galician', acceptLanguages: 'gl' },
  { value: 'ka', label: 'Georgian', acceptLanguages: 'ka' },
  { value: 'de-DE', label: 'German', acceptLanguages: 'de-DE, de' },
  { value: 'el', label: 'Greek', acceptLanguages: 'el' },
  { value: 'he', label: 'Hebrew', acceptLanguages: 'he' },
  { value: 'hi', label: 'Hindi', acceptLanguages: 'hi' },
  { value: 'hu', label: 'Hungarian', acceptLanguages: 'hu' },
  { value: 'id', label: 'Indonesian', acceptLanguages: 'id' },
  { value: 'it-IT', label: 'Italian', acceptLanguages: 'it-IT, it' },
  { value: 'ja-JP', label: 'Japanese', acceptLanguages: 'ja-JP, ja' },
  { value: 'ko-KR', label: 'Korean', acceptLanguages: 'ko-KR, ko' },
  { value: 'lv', label: 'Latvian', acceptLanguages: 'lv' },
  { value: 'lt', label: 'Lithuanian', acceptLanguages: 'lt' },
  { value: 'ms', label: 'Malay', acceptLanguages: 'ms' },
  { value: 'nb', label: 'Norwegian Bokmal', acceptLanguages: 'nb' },
  { value: 'fa', label: 'Persian', acceptLanguages: 'fa' },
  { value: 'pl', label: 'Polish', acceptLanguages: 'pl' },
  {
    value: 'pt-BR',
    label: 'Portuguese (Brazil)',
    acceptLanguages: 'pt-BR, pt',
  },
  {
    value: 'pt-PT',
    label: 'Portuguese (Portugal)',
    acceptLanguages: 'pt-PT, pt',
  },
  { value: 'ro', label: 'Romanian', acceptLanguages: 'ro' },
  { value: 'ru-RU', label: 'Russian', acceptLanguages: 'ru-RU, ru' },
  { value: 'sr', label: 'Serbian', acceptLanguages: 'sr' },
  { value: 'sk', label: 'Slovak', acceptLanguages: 'sk' },
  { value: 'sl', label: 'Slovenian', acceptLanguages: 'sl' },
  { value: 'es-ES', label: 'Spanish', acceptLanguages: 'es-ES, es' },
  { value: 'sv-SE', label: 'Swedish', acceptLanguages: 'sv-SE, sv' },
  { value: 'th', label: 'Thai', acceptLanguages: 'th' },
  { value: 'tr', label: 'Turkish', acceptLanguages: 'tr' },
  { value: 'uk', label: 'Ukrainian', acceptLanguages: 'uk' },
  { value: 'vi', label: 'Vietnamese', acceptLanguages: 'vi' },
];

// WebGL presets are complete pairs in the exact form real Chrome reports
// (vendor = "Google Inc. (<ANGLE vendor>)", renderer = the ANGLE string of the
// declared OS: D3D11 on Windows, Metal on macOS, OpenGL on Linux). One Browser
// also normalizes plain legacy values such as "NVIDIA" / "Apple M1" into this
// form and hides WebGL extensions / caps limits the declared GPU backend never
// has, but extensions and limits the host lacks cannot be added, so the most
// convincing preset is a GPU of the same family as this machine's.
const windowsAngle = (vendor: string, model: string, deviceId: string) =>
  `ANGLE (${vendor}, ${model} (0x0000${deviceId}) Direct3D11 vs_5_0 ps_5_0, D3D11)`;
const metalAngle = (vendor: string, model: string) =>
  `ANGLE (${vendor}, ANGLE Metal Renderer: ${model}, Unspecified Version)`;

const webglVendorOptions: WebglVendorOption[] = [
  {
    value: 'Google Inc. (Apple)',
    label: 'Apple',
    iconUrl: 'https://cdn.simpleicons.org/apple/111111',
    systems: ['macos'],
    renderers: [
      'Apple M1',
      'Apple M1 Pro',
      'Apple M1 Max',
      'Apple M2',
      'Apple M2 Pro',
      'Apple M3',
      'Apple M3 Pro',
      'Apple M4',
      'Apple M4 Pro',
    ].map((model) => metalAngle('Apple', model)),
  },
  {
    value: 'Google Inc. (Intel)',
    // Only coherent on an Intel Mac: an Apple Silicon host keeps its own
    // WebGL limits and WebGPU behaviour.
    label: 'Intel（仅 Intel 芯片 Mac，Apple 芯片有风险）',
    iconUrl: 'https://cdn.simpleicons.org/intel/0071C5',
    systems: ['macos'],
    renderers: [
      'Intel(R) Iris(TM) Plus Graphics',
      'Intel(R) UHD Graphics 630',
      'Intel(R) Iris(TM) Plus Graphics 655',
    ].map((model) => metalAngle('Intel', model)),
  },
  {
    value: 'Google Inc. (NVIDIA)',
    label: 'NVIDIA',
    iconUrl: 'https://cdn.simpleicons.org/nvidia/76B900',
    systems: ['windows'],
    renderers: [
      windowsAngle('NVIDIA', 'NVIDIA GeForce RTX 4090', '2684'),
      windowsAngle('NVIDIA', 'NVIDIA GeForce RTX 4070', '2786'),
      windowsAngle('NVIDIA', 'NVIDIA GeForce RTX 4060', '2882'),
      windowsAngle('NVIDIA', 'NVIDIA GeForce RTX 3080', '2206'),
      windowsAngle('NVIDIA', 'NVIDIA GeForce RTX 3060', '2503'),
      windowsAngle('NVIDIA', 'NVIDIA GeForce GTX 1660 SUPER', '21C4'),
      windowsAngle('NVIDIA', 'NVIDIA GeForce GTX 1650', '1F82'),
    ],
  },
  {
    value: 'Google Inc. (AMD)',
    label: 'AMD',
    iconUrl: 'https://cdn.simpleicons.org/amd/ED1C24',
    systems: ['windows'],
    renderers: [
      windowsAngle('AMD', 'AMD Radeon RX 7900 XTX', '744C'),
      windowsAngle('AMD', 'AMD Radeon RX 6700 XT', '73DF'),
      windowsAngle('AMD', 'AMD Radeon RX 6600', '73FF'),
      windowsAngle('AMD', 'AMD Radeon(TM) Graphics', '1638'),
    ],
  },
  {
    value: 'Google Inc. (Intel)',
    label: 'Intel',
    iconUrl: 'https://cdn.simpleicons.org/intel/0071C5',
    systems: ['windows'],
    renderers: [
      windowsAngle('Intel', 'Intel(R) UHD Graphics 620', '5917'),
      windowsAngle('Intel', 'Intel(R) UHD Graphics 630', '3E92'),
      windowsAngle('Intel', 'Intel(R) UHD Graphics 770', '4680'),
      windowsAngle('Intel', 'Intel(R) Iris(R) Xe Graphics', '9A49'),
    ],
  },
  {
    value: 'Google Inc. (NVIDIA Corporation)',
    label: 'NVIDIA',
    iconUrl: 'https://cdn.simpleicons.org/nvidia/76B900',
    systems: ['linux'],
    renderers: [
      'ANGLE (NVIDIA Corporation, NVIDIA GeForce RTX 3060/PCIe/SSE2, OpenGL 4.5.0)',
      'ANGLE (NVIDIA Corporation, NVIDIA GeForce GTX 1660 SUPER/PCIe/SSE2, OpenGL 4.5.0)',
    ],
  },
  {
    value: 'Google Inc. (Intel)',
    label: 'Intel',
    iconUrl: 'https://cdn.simpleicons.org/intel/0071C5',
    systems: ['linux'],
    renderers: [
      'ANGLE (Intel, Mesa Intel(R) UHD Graphics 620 (KBL GT2), OpenGL 4.6)',
      'ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL 4.6)',
    ],
  },
  {
    value: 'Google Inc. (AMD)',
    label: 'AMD',
    iconUrl: 'https://cdn.simpleicons.org/amd/ED1C24',
    systems: ['linux'],
    renderers: [
      'ANGLE (AMD, AMD Radeon RX 6600 (radeonsi, navi23, LLVM 15.0.7, DRM 3.54, 6.5.0), OpenGL 4.6)',
    ],
  },
];

// "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 (0x00002684) Direct3D11 ...)" ->
// "NVIDIA GeForce RTX 4090", for compact picker labels.
export function webglRendererLabel(renderer: string) {
  const match = /^ANGLE \([^,]+, (.*), [^,]+\)$/.exec(renderer.trim());
  if (!match) return renderer;
  return match[1]
    .replace(/^ANGLE Metal Renderer: /, '')
    .replace(/^Mesa /, '')
    .replace(/ \(0x[0-9A-Fa-f]+\).*$/, '')
    .replace(/\/PCIe\/SSE2$/, '')
    .replace(/ \((?:KBL|CFL|radeonsi)[^)]*\)$/, '');
}

export function timeZoneOptions(
  defaultTimeZone: string,
  selectedTimeZone: string,
): TimeZoneOption[] {
  const preferred = [
    selectedTimeZone,
    defaultTimeZone,
    'Asia/Shanghai',
    'UTC',
  ].filter(Boolean);
  const zones = Array.from(new Set([...preferred, ...supportedTimeZones()]));
  return zones
    .map((timeZone) => ({
      value: timeZone,
      label: `${formatGmtOffset(timeZone)} ${timeZone}`,
      offset: timeZoneOffsetMinutes(timeZone),
    }))
    .sort((a, b) => a.offset - b.offset || a.value.localeCompare(b.value))
    .map(({ value, label }) => ({ value, label }));
}

function supportedTimeZones() {
  if (typeof Intl.supportedValuesOf === 'function')
    return Intl.supportedValuesOf('timeZone');
  return [
    'UTC',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Europe/London',
    'Europe/Paris',
    'America/New_York',
    'America/Los_Angeles',
    'Pacific/Niue',
  ];
}

function timeZoneOffsetMinutes(timeZone: string) {
  try {
    const value =
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'shortOffset',
      })
        .formatToParts(new Date())
        .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
    const match = value.match(/^GMT(?:([+-])(\d{1,2})(?::?(\d{2}))?)?$/);
    if (!match?.[1]) return 0;
    const total = Number(match[2]) * 60 + Number(match[3] ?? '0');
    return match[1] === '-' ? -total : total;
  } catch {
    return 0;
  }
}

function formatGmtOffset(timeZone: string) {
  const offset = timeZoneOffsetMinutes(timeZone);
  const sign = offset < 0 ? '-' : '+';
  const absolute = Math.abs(offset);
  return `GMT${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
}

export function languageOptionsWithCurrent(currentLocale: string) {
  if (
    !currentLocale ||
    languageOptions.some((option) => option.value === currentLocale)
  ) {
    return languageOptions;
  }
  return [
    {
      value: currentLocale,
      label: currentLocale,
      acceptLanguages: currentLocale,
    },
    ...languageOptions,
  ];
}

export function selectedLanguageOption(
  options: LanguageOption[],
  locale: string,
  acceptLanguages: string,
) {
  const normalizedLocale = locale.trim();
  const normalizedAcceptLanguages = acceptLanguages.trim();
  return (
    options.find((option) => option.value === normalizedLocale) ??
    options.find(
      (option) => option.acceptLanguages === normalizedAcceptLanguages,
    ) ??
    options.find((option) => option.value === 'zh-CN') ??
    options[0]
  );
}

export function resolveWebglSystem(system: string): WebglSystemValue {
  if (/win/i.test(system)) return 'windows';
  if (/linux|\bx11\b/i.test(system)) return 'linux';
  return 'macos';
}

export function preferredWebglVendor(system: WebglSystemValue) {
  return (
    webglVendorOptions.find((vendor) => vendor.systems.includes(system))
      ?.value ?? ''
  );
}

export function webglVendorsForSystem(
  system: WebglSystemValue,
  currentVendor: string,
) {
  const vendors = webglVendorOptions.filter((vendor) =>
    vendor.systems.includes(system),
  );
  const trimmedVendor = currentVendor.trim();
  if (
    trimmedVendor &&
    !vendors.some((vendor) => vendor.value === trimmedVendor)
  ) {
    return [
      {
        value: trimmedVendor,
        label: trimmedVendor,
        iconUrl: (vendors[0] ?? webglVendorOptions[0]).iconUrl,
        systems: [system],
        renderers: [trimmedVendor],
      },
      ...vendors,
    ];
  }
  return vendors;
}

export function selectedWebglVendor(
  vendors: WebglVendorOption[],
  vendorValue: string,
) {
  return (
    vendors.find((vendor) => vendor.value === vendorValue.trim()) ??
    vendors[0] ??
    webglVendorOptions[0]
  );
}

export function webglRenderersForVendor(
  vendor: WebglVendorOption,
  currentRenderer: string,
) {
  const renderers = vendor.renderers.map((renderer) => ({
    value: renderer,
    label: webglRendererLabel(renderer),
  }));
  const trimmedRenderer = currentRenderer.trim();
  if (
    trimmedRenderer &&
    !renderers.some((renderer) => renderer.value === trimmedRenderer)
  ) {
    return [
      { value: trimmedRenderer, label: webglRendererLabel(trimmedRenderer) },
      ...renderers,
    ];
  }
  return renderers;
}

export function selectedWebglRenderer(
  renderers: WebglRendererOption[],
  rendererValue: string,
) {
  return (
    renderers.find((renderer) => renderer.value === rendererValue.trim()) ??
    renderers[0] ?? { value: '', label: '' }
  );
}

export function explicitWebglValue(value: string) {
  const trimmedValue = value.trim();
  return Boolean(trimmedValue && trimmedValue !== '系统默认');
}

export function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}
