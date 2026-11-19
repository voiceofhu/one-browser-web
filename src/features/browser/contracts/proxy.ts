import type { PageRequest } from './common';

export type ProxyType =
  'no_proxy' | 'http' | 'https' | 'socks5' | 'fixed_servers' | 'pac_script';

export type ProxyCheckStatus =
  'unchecked' | 'checking' | 'ok' | 'blocked' | 'error';

export interface InlineProxyConfig {
  type: ProxyType;
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  server: string | null;
  pacUrl: string | null;
  bypassList: string[];
}

export interface ProxyCheckResult {
  status: ProxyCheckStatus;
  exitIp: string | null;
  countryCode: string | null;
  country: string | null;
  region: string | null;
  asn: string | null;
  latencyMs: number | null;
  checkedAt: string | null;
  message: string;
}

export interface ProxyConfig {
  proxyId: string;
  name: string;
  type: ProxyType;
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  server: string | null;
  pacUrl: string | null;
  bypassList: string[];
  refreshUrl: string | null;
  ipChecker: string | null;
  remark: string;
  createdAt: string;
  updatedAt: string;
  lastCheck: ProxyCheckResult;
}

export interface ProxyListItem {
  proxyId: string;
  name: string;
  type: ProxyType;
  host: string | null;
  port: number | null;
  username: string | null;
  hasPassword: boolean;
  ipChecker: string | null;
  remark: string;
  profileCount: number;
  relatedProfileNo: string[];
  lastCheck: ProxyCheckResult;
  enabled?: boolean;
}

export interface ProxyListRequest extends PageRequest {
  keyword?: string;
  proxyIds?: string[];
  type?: ProxyType | ProxyType[];
  checkStatus?: ProxyCheckStatus | ProxyCheckStatus[];
  hasPassword?: boolean;
}

export interface CreateProxyRequest {
  proxyId: string;
  name?: string;
  type: ProxyType;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  server?: string | null;
  pacUrl?: string | null;
  bypassList?: string[];
  refreshUrl?: string | null;
  ipChecker?: string | null;
  remark?: string;
}

export interface UpdateProxyRequest {
  proxyId: string;
  name?: string;
  type?: ProxyType;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  server?: string | null;
  pacUrl?: string | null;
  bypassList?: string[];
  refreshUrl?: string | null;
  ipChecker?: string | null;
  remark?: string;
}

export interface GetProxyRequest {
  proxyId: string;
}

export interface DeleteProxiesRequest {
  proxyIds: string[];
}

export interface DeleteProxiesResult {
  deleted: string[];
  affectedProfiles: string[];
}

/** A loopback SOCKS5 port published by One Node PC (desktop only). */
export interface OneNodeSocksPort {
  nodeId: string;
  name: string;
  host: string;
  port: number;
  link: string;
  reachable: boolean;
}

export interface OneNodeSocksList {
  /** `local-socks.json` exists; when false the UI renders nothing. */
  installed: boolean;
  available: boolean;
  reason?: string;
  ports: OneNodeSocksPort[];
}
