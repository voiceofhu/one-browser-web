import type {
  ProxyConfig,
  ProxyListItem,
  ProxyType,
} from '@/features/browser/contracts';

import { resolveCountryCode } from '../../components/country-flag';

export type LatencyTone = 'fast' | 'medium' | 'slow';
export type CopyStage = 'idle' | 'loading' | 'copying';
export type ProxyAddressSource = Pick<
  ProxyConfig,
  'proxyId' | 'name' | 'type' | 'host' | 'port' | 'username'
> & { password?: string | null };

export const latencyToneClass: Record<LatencyTone, string> = {
  fast: 'text-success',
  medium: 'text-[color-mix(in_oklch,var(--success),var(--destructive)_55%)]',
  slow: 'text-destructive',
};

export function proxyAddress(proxy: ProxyAddressSource) {
  if (proxy.host && proxy.port) {
    const username = proxy.username?.trim() ?? '';
    const password = proxy.password?.trim() ?? '';
    const auth =
      username || password
        ? `${encodeURIComponent(username)}${password ? `:${encodeURIComponent(password)}` : ''}@`
        : '';
    return `${proxyProtocol(proxy.type)}://${auth}${formatProxyHost(proxy.host)}:${proxy.port}`;
  }
  return proxy.name || proxy.proxyId;
}

function formatProxyHost(host: string) {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
}

function proxyProtocol(type: ProxyType) {
  if (type === 'socks5' || type === 'http' || type === 'https') return type;
  return 'proxy';
}

export function proxyLocation(proxy: ProxyListItem) {
  const { countryCode, exitIp, country, region, message, latencyMs } =
    proxy.lastCheck;
  const code = resolveCountryCode(countryCode, country);
  const countryLabel = country?.trim() || code || '未知国家';
  const countryDisplay =
    code && countryLabel.toUpperCase() !== code
      ? `${code} · ${countryLabel}`
      : countryLabel;
  const place = [countryLabel, region].filter(Boolean).join(' / ');
  if (exitIp) {
    const latencyLabel = latencyMs !== null ? `${latencyMs} ms` : null;
    return {
      code,
      country: countryDisplay,
      detail: `${code ?? countryLabel} (${exitIp})`,
      latencyLabel,
      latencyTone: latencyTone(latencyMs),
      title: [place, exitIp, latencyLabel].filter(Boolean).join(' · '),
    };
  }
  return {
    code,
    country: countryLabel,
    detail: message || '未检测',
    latencyLabel: null,
    latencyTone: null,
    title: message || '未检测',
  };
}

function latencyTone(latencyMs: number | null): LatencyTone | null {
  if (latencyMs === null || !Number.isFinite(latencyMs)) return null;
  if (latencyMs <= 500) return 'fast';
  if (latencyMs <= 1500) return 'medium';
  return 'slow';
}

export function proxyTypeLabel(type: ProxyType) {
  if (type === 'socks5') return 'SOCKS5';
  if (type === 'http' || type === 'https') return type.toUpperCase();
  return '代理';
}

export function ipCheckerLabel(value: string | null) {
  if (value === 'ip2location' || value === 'local:ip2location') {
    return 'IP2Location';
  }
  if (value?.includes('ip-api.com')) return 'IP-API';
  return 'ipwhere.net';
}
