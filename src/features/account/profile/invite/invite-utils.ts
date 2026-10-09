import type { UserInviteOverview } from '@/features/auth/api';

export function formatFullDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function buildInviteUrl(code: string) {
  const inviteCode = code.trim();
  if (!inviteCode) return '';
  const configuredUrl = import.meta.env.VITE_WEB_LOGIN_URL?.trim();
  const fallbackOrigin =
    typeof window === 'undefined'
      ? 'https://browser.aicbe.com'
      : window.location.origin;

  try {
    const url = new URL(configuredUrl || fallbackOrigin, fallbackOrigin);
    let pathname = url.pathname.replace(/\/+$/, '');
    if (pathname.endsWith('/api/auth/oidc/start')) {
      pathname = pathname.slice(0, -'/api/auth/oidc/start'.length);
    } else if (pathname.endsWith('/oauth/authorize')) {
      pathname = pathname.slice(0, -'/oauth/authorize'.length);
    } else if (pathname.endsWith('/login')) {
      pathname = pathname.slice(0, -'/login'.length);
    }
    url.pathname = `${pathname === '' ? '' : pathname}/invite`;
    url.search = '';
    url.searchParams.set('aff', inviteCode);
    url.hash = '';
    return url.toString();
  } catch {
    return `/invite?aff=${encodeURIComponent(inviteCode)}`;
  }
}

export function normalizeInviteUrl(value: string | null | undefined) {
  return value?.trim() || '';
}

export function isInviteOverviewUsable(
  overview: UserInviteOverview | undefined,
) {
  if (!overview || (overview.status && overview.status !== 'active')) {
    return false;
  }
  if (overview.expires_at) {
    const expiresAt = new Date(overview.expires_at).getTime();
    if (!Number.isNaN(expiresAt) && expiresAt <= Date.now()) return false;
  }
  return !(
    overview.max_uses !== null &&
    overview.max_uses !== undefined &&
    typeof overview.used_count === 'number' &&
    overview.used_count >= overview.max_uses
  );
}
