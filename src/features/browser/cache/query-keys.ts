import type {
  ProfileListRequest,
  ProxyListRequest,
} from '@/features/browser/contracts';

const emptyFilters = {} as const;

function filtersKey<T extends object>(filters?: T) {
  return filters ?? emptyFilters;
}

export const browserQueryKeys = {
  all: ['browser'] as const,
  status: () => [...browserQueryKeys.all, 'status'] as const,
  settings: () => [...browserQueryKeys.all, 'settings'] as const,
  profiles: () => [...browserQueryKeys.all, 'profiles'] as const,
  profilesList: (filters?: ProfileListRequest) =>
    [...browserQueryKeys.profiles(), 'list', filtersKey(filters)] as const,
  profile: (profileId: string) =>
    [...browserQueryKeys.profiles(), 'detail', profileId] as const,
  proxies: () => [...browserQueryKeys.all, 'proxies'] as const,
  proxiesList: (filters?: ProxyListRequest) =>
    [...browserQueryKeys.proxies(), 'list', filtersKey(filters)] as const,
  proxy: (proxyId: string) =>
    [...browserQueryKeys.proxies(), 'detail', proxyId] as const,
  runtime: () => [...browserQueryKeys.all, 'runtime'] as const,
} as const;
