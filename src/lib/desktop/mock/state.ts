import type {
  AppSettings,
  ProfileConfig,
  ProxyCheckResult,
  ProxyConfig,
  RuntimeProfile,
} from '@/features/browser/contracts';

export const mockNow = new Date(0).toISOString();

export const mockSettings: AppSettings = {
  chromiumPath: null,
  profileRoot: '/tmp/one-browser/profiles',
  defaultStartUrl: 'https://ip.huzhihui.com/',
  egressSelectionMode: 'auto',
  preferredEgressId: null,
  apiEnabled: true,
  apiHost: '127.0.0.1',
  apiPort: 27523,
};

export const mockProxyCheck: ProxyCheckResult = {
  status: 'unchecked',
  exitIp: null,
  countryCode: null,
  country: null,
  region: null,
  asn: null,
  latencyMs: null,
  checkedAt: null,
  message: '',
};

export const mockProfiles = new Map<string, ProfileConfig>();
export const mockProxies = new Map<string, ProxyConfig>();
export const mockRuntime = new Map<string, RuntimeProfile>();
