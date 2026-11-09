import type { ProxyConfig, ProxyType } from '@/features/browser/contracts';

export const proxyTypeValues = ['socks5', 'http', 'https'] as const;
export type EditableProxyType = (typeof proxyTypeValues)[number];

export const proxyTypes = [
  { value: 'socks5', label: 'Socks5' },
  { value: 'http', label: 'HTTP' },
  { value: 'https', label: 'HTTPS' },
] satisfies Array<{ value: EditableProxyType; label: string }>;

export const ipCheckerValues = ['ipwhere', 'ip-api', 'ip2location'] as const;
export type IpCheckerValue = (typeof ipCheckerValues)[number];

/**
 * `ipwhere` (ipwhere.net, One IP) is the default: exit IP plus IANA time zone, network
 * type and risk in one call. The desktop fills any checker's missing time zone from it.
 */
export const ipCheckerOptions = [
  {
    value: 'ipwhere',
    label: 'ipwhere.net',
    url: 'ipwhere',
  },
  {
    value: 'ip-api',
    label: 'IP-API',
    url: 'http://ip-api.com/json/?fields=status,message,query,country,countryCode,regionName,timezone,as',
  },
  {
    value: 'ip2location',
    label: 'IP2Location',
    url: 'ip2location',
  },
] satisfies Array<{
  value: IpCheckerValue;
  label: string;
  url: string | null;
}>;

export const smartParseFormats = [
  'host:port:username:password[change_ip_url]',
  'username:password@host:port[change_ip_url]',
  '[IPv6-host]:port:username:password[change_ip_url]',
  'username:password@[IPv6-host]:port[change_ip_url]',
  'socks5://1.1.144.32:27384:sock5:xxx',
  'http://192.168.0.1:8000',
  'socks5://login:password@192.168.0.1:8000',
  'https://192.168.0.1:8000:login:password',
  'http://[2a06:c006:bd1e::4653:e7bc]:8000',
];

export function createProxyId() {
  return `proxy-${Date.now().toString(36)}`;
}

export function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535
    ? parsed
    : null;
}

export function initialType(proxy?: ProxyConfig | null): EditableProxyType {
  if (
    proxy?.type === 'http' ||
    proxy?.type === 'https' ||
    proxy?.type === 'socks5'
  ) {
    return proxy.type;
  }

  return 'socks5';
}

export function ipCheckerValue(proxy?: ProxyConfig | null): IpCheckerValue {
  const checker = proxy?.ipChecker?.trim();
  if (!checker || checker === 'ip-api' || checker === 'local:ip-api') {
    return 'ipwhere';
  }

  return (
    ipCheckerOptions.find((item) => item.url === checker)?.value ??
    (checker === 'local:ip2location'
      ? 'ip2location'
      : checker.includes('ip-api.com')
        ? 'ip-api'
        : 'ipwhere')
  );
}

export function ipCheckerUrl(value: string) {
  return ipCheckerOptions.find((item) => item.value === value)?.url ?? null;
}

export function proxyName(
  type: ProxyType,
  host: string,
  port: string,
  fallback: string,
) {
  const address = [host.trim(), port.trim()].filter(Boolean).join(':');
  return address ? `${type.toUpperCase()} ${address}` : fallback;
}

export function parseHostPortInput(value: string) {
  let input = value.trim();
  if (!input) {
    return null;
  }

  const schemeMatch = input.match(/^([a-z][a-z0-9+.-]*):\/\/(.+)$/i);
  const protocol = schemeMatch?.[1]?.toLowerCase();
  const parsedType = proxyTypes.some((item) => item.value === protocol)
    ? (protocol as EditableProxyType)
    : undefined;

  if (schemeMatch?.[2]) {
    input = schemeMatch[2];
  }

  const [authPart, addressPart] = input.includes('@')
    ? input.split('@', 2)
    : ['', input];
  const [authUser, authPassword] = authPart
    ? authPart.split(':', 2).map(safeDecode)
    : ['', ''];
  const bracketMatch = addressPart.match(
    /^\[([^\]]+)\]:(\d+)(?::([^:]*))?(?::([^[]+))?(?:\[(.+)\])?$/,
  );

  if (bracketMatch) {
    return {
      type: parsedType,
      host: bracketMatch[1],
      port: bracketMatch[2],
      username: authUser || safeDecode(bracketMatch[3] ?? ''),
      password: authPassword || safeDecode(bracketMatch[4] ?? ''),
      refreshUrl: bracketMatch[5],
    };
  }

  const refreshMatch = addressPart.match(/^(.*)\[([^\]]+)\]$/);
  const addressWithoutRefresh = refreshMatch?.[1] ?? addressPart;
  const parts = addressWithoutRefresh.split(':');
  if (parts.length < 2) {
    return null;
  }

  return {
    type: parsedType,
    host: parts[0],
    port: parts[1],
    username: authUser || safeDecode(parts[2] ?? ''),
    password: authPassword || safeDecode(parts[3] ?? ''),
    refreshUrl: refreshMatch?.[2] ?? parts.slice(4).join(':'),
  };
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
