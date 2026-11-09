import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ShuffleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { parseFontList, systemFontsLabel } from './font-options';
import type {
  DoNotTrackMode,
  ProfileEditorForm,
  SystemFingerprintDefaults,
} from './types';

export function SummaryPanel({
  defaults,
  form,
  onGenerateRandomFingerprint,
}: {
  defaults: SystemFingerprintDefaults;
  form: ProfileEditorForm;
  onGenerateRandomFingerprint?: () => void;
}) {
  const rows = [
    ['系统', valueOrDefault(form.system, defaults.system)],
    ['用户代理', valueOrDefault(form.userAgent, defaults.userAgent)],
    ['WebRTC', webrtcLabel(form, defaults)],
    ['时区', timeZoneLabel(form.timeZone)],
    ['地理位置', geolocationLabel(form)],
    ['语言', languageLabel(form)],
    ['WebGL 信息', webglInfoLabel(form, defaults)],
    ['WebGPU', webgpuLabel(form.webgpuMode, defaults.webgpuMode)],
    ['Canvas', noiseLabel(form.canvasNoise, defaults.canvasNoise)],
    [
      '音频上下文',
      noiseLabel(form.audioContextNoise, defaults.audioContextNoise),
    ],
    ['屏幕', screenLabel(form, defaults)],
    ['字体', fontsLabel(form, defaults)],
    ['CPU', coresLabel(form.cpuCores, defaults.cpuCores)],
    ['RAM', ramLabel(form.ramGb, defaults.ramGb)],
    ['媒体设备', mediaDevicesLabel(form, defaults)],
    ['设备名称', valueOrDefault(form.deviceName, defaults.deviceName)],
    ['MAC 地址', valueOrDefault(form.macAddress, defaults.macAddress)],
    ['请勿跟踪', doNotTrackLabel(form.doNotTrack, defaults.doNotTrack)],
  ];

  return (
    <Card className="bg-muted/40 sticky top-0 hidden h-fit max-h-[calc(min(90dvh,42rem)-7rem)] gap-0 overflow-hidden py-0 shadow-none lg:flex">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-3 py-1 [.border-b]:pb-1">
        <CardTitle className="text-sm">摘要</CardTitle>
        {onGenerateRandomFingerprint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground -my-1 -mr-1 size-7"
                aria-label="生成新指纹"
                onClick={onGenerateRandomFingerprint}
              >
                <HugeiconsIcon
                  icon={ShuffleIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">生成新指纹</TooltipContent>
          </Tooltip>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2 overflow-y-auto px-4 py-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2 text-xs"
          >
            <div className="text-muted-foreground">{label}</div>
            <div className="min-w-0 text-right font-medium break-words">
              {value}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function valueOrDefault(value: string, defaultValue: string) {
  const trimmed = value.trim();
  return trimmed || defaultValue || '自动';
}

function modeLabel(value: string, defaultValue: string) {
  const mode = value || defaultValue || 'auto';
  const labels: Record<string, string> = {
    auto: '自动',
    real: '真实',
    manual: '手动',
    random: '随机',
    on: '开启',
    off: '关闭',
  };

  return labels[mode] ?? mode;
}

function webrtcLabel(
  form: ProfileEditorForm,
  defaults: SystemFingerprintDefaults,
) {
  const mode = modeLabel(form.webrtcMode, defaults.webrtcMode);

  if (form.webrtcMode === 'manual') {
    return form.webrtcIp.trim() ? `${mode}: ${form.webrtcIp.trim()}` : mode;
  }

  return form.routeUdpViaProxy ? `${mode} · UDP 走代理` : mode;
}

function geolocationLabel(form: ProfileEditorForm) {
  if (
    form.geolocationMode === 'manual' ||
    form.latitude ||
    form.longitude ||
    form.accuracy
  ) {
    const latitude = form.latitude || '自动';
    const longitude = form.longitude || '自动';
    const accuracy = form.accuracy || '10';
    return `${latitude}, ${longitude} (${accuracy}m)`;
  }

  return '基于 IP';
}

function timeZoneLabel(value: string) {
  return value.trim() || '基于 IP';
}

function languageLabel(form: ProfileEditorForm) {
  const locale = form.locale.trim();
  const acceptLanguages = form.acceptLanguages.trim();

  if (!locale && !acceptLanguages) {
    return '基于 IP';
  }

  const label = languageName(locale || acceptLanguages.split(',')[0]?.trim());

  return acceptLanguages ? `${label} · ${acceptLanguages}` : label;
}

function languageName(value?: string) {
  const code = value?.trim();
  const names: Record<string, string> = {
    af: 'Afrikaans',
    sq: 'Albanian',
    am: 'Amharic',
    ar: 'Arabic',
    an: 'Aragonese',
    hy: 'Armenian',
    ast: 'Asturian',
    az: 'Azerbaijani',
    bn: 'Bangla',
    eu: 'Basque',
    be: 'Belarusian',
    bg: 'Bulgarian',
    ca: 'Catalan',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    hr: 'Croatian',
    cs: 'Czech',
    da: 'Danish',
    nl: 'Dutch',
    'en-US': 'English (United States)',
    'en-GB': 'English (United Kingdom)',
    et: 'Estonian',
    fi: 'Finnish',
    'fr-FR': 'French',
    gl: 'Galician',
    ka: 'Georgian',
    'de-DE': 'German',
    el: 'Greek',
    he: 'Hebrew',
    hi: 'Hindi',
    hu: 'Hungarian',
    id: 'Indonesian',
    'it-IT': 'Italian',
    'ja-JP': 'Japanese',
    'ko-KR': 'Korean',
    lv: 'Latvian',
    lt: 'Lithuanian',
    ms: 'Malay',
    nb: 'Norwegian Bokmal',
    fa: 'Persian',
    pl: 'Polish',
    'pt-BR': 'Portuguese (Brazil)',
    'pt-PT': 'Portuguese (Portugal)',
    ro: 'Romanian',
    'ru-RU': 'Russian',
    sr: 'Serbian',
    sk: 'Slovak',
    sl: 'Slovenian',
    'es-ES': 'Spanish',
    'sv-SE': 'Swedish',
    th: 'Thai',
    tr: 'Turkish',
    uk: 'Ukrainian',
    vi: 'Vietnamese',
  };

  return (code && names[code]) || code || '手动';
}

function webglInfoLabel(
  form: ProfileEditorForm,
  defaults: SystemFingerprintDefaults,
) {
  if ((form.webglMode || defaults.webglMode) === 'off') {
    return '关闭';
  }

  const vendor = valueOrDefault(form.webglVendor, defaults.webglVendor);
  const renderer = valueOrDefault(form.webglRenderer, defaults.webglRenderer);
  const mode = modeLabel(form.webglMode, defaults.webglMode);
  const label = `${vendor} / ${renderer}`;

  return `${mode} · ${label}`;
}

function webgpuLabel(value: string, defaultValue: string) {
  const mode = value || defaultValue;
  return mode === 'off' ? '关闭' : '开启';
}

function noiseLabel(value: string, defaultValue: string) {
  const raw = value.trim();

  if (raw === 'off') {
    return '关闭';
  }

  return raw || defaultValue || '自动';
}

function screenLabel(
  form: ProfileEditorForm,
  defaults: SystemFingerprintDefaults,
) {
  const mode = modeLabel(form.screenMode, defaults.screenMode);
  const resolution = form.screenResolution.trim();

  if (form.screenMode === 'manual') {
    return resolution ? `${mode} · ${resolution}` : mode;
  }

  return mode;
}

function fontsLabel(
  form: ProfileEditorForm,
  defaults: SystemFingerprintDefaults,
) {
  if (form.fontsMode === 'manual') {
    const fontCount = parseFontList(form.fonts).length;
    const systemLabel = systemFontsLabel(
      form.system || defaults.system || defaults.fonts,
    );

    return fontCount
      ? `手动 · ${systemLabel} · 附加字体 ${fontCount}`
      : `手动 · ${systemLabel}`;
  }

  return defaults.fonts || modeLabel(form.fontsMode, defaults.fontsMode);
}

function coresLabel(value: string, defaultValue: string) {
  const raw = normalizeNumberText(value) || normalizeNumberText(defaultValue);
  return raw ? `${raw} 核` : '自动';
}

function ramLabel(value: string, defaultValue: string) {
  const raw = normalizeNumberText(value) || normalizeNumberText(defaultValue);
  return raw ? `${raw} GB` : '自动';
}

function mediaDevicesLabel(
  form: ProfileEditorForm,
  defaults: SystemFingerprintDefaults,
) {
  const mode = modeLabel(form.mediaDevicesMode, defaults.mediaDevicesMode);

  if (form.mediaDevicesMode !== 'manual') {
    return mode;
  }

  const audioInputs = form.mediaAudioInputs || defaults.mediaAudioInputs || '1';
  const audioOutputs =
    form.mediaAudioOutputs || defaults.mediaAudioOutputs || '1';
  const videoInputs = form.mediaVideoInputs || defaults.mediaVideoInputs || '1';

  return `${mode} · 输入 ${audioInputs} · 输出 ${audioOutputs} · 视频 ${videoInputs}`;
}

function doNotTrackLabel(value: DoNotTrackMode, defaultValue: DoNotTrackMode) {
  if (value === 'system') {
    return defaultValue === 'on' ? '跟随系统: 开启' : '跟随系统: 关闭';
  }

  return value === 'on' ? '开启' : '关闭';
}

function normalizeNumberText(value: string) {
  return value
    .trim()
    .replace(/\s*(cores?|核|gb|g)$/i, '')
    .trim();
}
