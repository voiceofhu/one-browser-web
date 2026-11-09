import type { CompactTabOption } from './editor-controls';

export type NoiseFieldName = 'canvasNoise' | 'audioContextNoise';
export type RealManualMode = 'real' | 'manual';
export type AutoManualMode = 'auto' | 'manual';
export type RealManualRandomMode = 'real' | 'manual' | 'random';
export type MediaDevicesMode = 'real' | 'auto' | 'manual';
export type HardwareSystem = 'macos' | 'windows';
export type ScreenResolutionOption = { value: string; label: string };
export type NumericValueOption = { value: string; label: string };
export type ModeOption<T extends string> = CompactTabOption<T>;

export const noiseFields: Array<{ key: NoiseFieldName; label: string }> = [
  { key: 'canvasNoise', label: 'Canvas' },
  { key: 'audioContextNoise', label: 'AudioContext' },
];

export const realManualOptions: Array<ModeOption<RealManualMode>> = [
  { value: 'real', label: '真实' },
  { value: 'manual', label: '手动' },
];
export const autoManualOptions: Array<ModeOption<AutoManualMode>> = [
  { value: 'auto', label: '自动' },
  { value: 'manual', label: '手动' },
];
export const realManualRandomOptions: Array<ModeOption<RealManualRandomMode>> =
  [
    { value: 'real', label: '真实' },
    { value: 'manual', label: '手动' },
    { value: 'random', label: '随机' },
  ];
export const mediaDevicesOptions: Array<ModeOption<MediaDevicesMode>> = [
  { value: 'real', label: '真实' },
  { value: 'auto', label: '自动' },
  { value: 'manual', label: '手动' },
];
export const doNotTrackOptions: Array<ModeOption<'off' | 'on'>> = [
  { value: 'off', label: '关闭' },
  { value: 'on', label: '开启' },
];
export const webgpuOptions: Array<ModeOption<'off' | 'on'>> = [
  { value: 'off', label: '关闭' },
  { value: 'on', label: '开启' },
];

const baseScreenResolutionOptions = [
  '1920x1080',
  '1366x768',
  '2560x1440',
  '3840x2160',
  '1280x720',
  '1600x900',
  '1920x1200',
  '2560x1600',
  '3440x1440',
];
export const baseCpuCoreOptions = [
  '2',
  '4',
  '6',
  '8',
  '10',
  '12',
  '16',
  '20',
  '24',
  '32',
  '64',
  '128',
];
export const baseRamGbOptions = [
  '2',
  '4',
  '8',
  '16',
  '24',
  '32',
  '64',
  '96',
  '128',
];
export const hardwareProfiles: Record<
  HardwareSystem,
  { cpuCores: string[]; ramGb: string[]; deviceNames: string[] }
> = {
  macos: {
    cpuCores: ['8', '10', '12', '16', '20', '24', '32'],
    ramGb: ['8', '16', '24', '32', '36', '48', '64'],
    deviceNames: ['Mac', 'MacBook Pro', 'MacBook Air', 'Mac mini', 'iMac'],
  },
  windows: {
    cpuCores: ['4', '6', '8', '12', '16', '24', '32'],
    ramGb: ['8', '16', '24', '32', '64'],
    deviceNames: ['DESKTOP', 'LAPTOP'],
  },
};

export function isRealManualMode(value: string): value is RealManualMode {
  return value === 'real' || value === 'manual';
}
export function isMediaDevicesMode(value: string): value is MediaDevicesMode {
  return value === 'real' || value === 'auto' || value === 'manual';
}
export function resolveHardwareSystem(system: string): HardwareSystem {
  return /win/i.test(system) ? 'windows' : 'macos';
}
export function randomMacAddress() {
  const bytes = Array.from({ length: 6 }, () => randomInteger(0, 255));
  bytes[0] = (bytes[0] | 0x02) & 0xfe;
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join(':');
}
export function normalizedMacAddress(value: string) {
  const trimmedValue = value.trim();
  if (!/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(trimmedValue)) return '';
  return trimmedValue.toLowerCase();
}
export function screenResolutionOptionsWithCurrent(currentResolution: string) {
  const current = normalizeScreenResolution(currentResolution);
  const values = current
    ? [current, ...baseScreenResolutionOptions]
    : baseScreenResolutionOptions;
  return Array.from(new Set(values)).map((value) => ({ value, label: value }));
}
export function selectedScreenResolutionOption(
  options: ScreenResolutionOption[],
  resolution: string,
) {
  const value = normalizeScreenResolution(resolution);
  return options.find((option) => option.value === value) ?? null;
}
function normalizeScreenResolution(value: string) {
  return value.trim().replace(/\s*[xX]\s*/, 'x');
}
export function numericValueOptions(
  baseValues: string[],
  unitLabel: string,
  currentValue: string,
) {
  const current = normalizeNumericValue(currentValue);
  const values = current ? [current, ...baseValues] : baseValues;
  return Array.from(new Set(values)).map((value) => ({
    value,
    label: formatNumericValue(value, unitLabel),
  }));
}
export function selectedNumericValueOption(
  options: NumericValueOption[],
  rawValue: string,
) {
  const value = normalizeNumericValue(rawValue);
  return options.find((option) => option.value === value) ?? null;
}
export function normalizeNumericValue(value: string) {
  return value
    .trim()
    .replace(/\s*(cores?|核|gb|g)$/i, '')
    .trim();
}
export function formatNumericValue(value: string, unitLabel: string) {
  const normalizedValue = normalizeNumericValue(value);
  return normalizedValue ? `${normalizedValue} ${unitLabel}` : '';
}
export function randomNearbyHardwareValue(
  baseValues: string[],
  currentValue: string,
) {
  const current = normalizeNumericValue(currentValue);
  if (!current) return randomItem(baseValues);
  const currentIndex = baseValues.indexOf(current);
  if (currentIndex === -1) {
    const currentNumber = Number(current);
    const nearbyValues = Number.isFinite(currentNumber)
      ? baseValues.filter(
          (value) => Math.abs(Number(value) - currentNumber) <= 4,
        )
      : [];
    return randomItem(Array.from(new Set([current, ...nearbyValues])));
  }
  return randomItem(
    baseValues.slice(
      Math.max(0, currentIndex - 1),
      Math.min(baseValues.length, currentIndex + 2),
    ),
  );
}
export function explicitDeviceName(value: string) {
  const trimmedValue = value.trim();
  return Boolean(trimmedValue && trimmedValue !== '当前设备');
}
export function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}
function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
