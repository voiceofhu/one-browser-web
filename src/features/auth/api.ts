import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { http } from '@/lib/http';

import type { AuthPermissions, CurrentUser, TeamInvite } from './types';

export type UpdateCurrentUserProfilePayload = {
  nick_name: string;
  email: string;
  phone_number: string;
  sex: '0' | '1' | '2';
  avatar: string;
};

export type UserInviteFriend = {
  user_id: number;
  user_name: string;
  nick_name: string;
  email: string;
  avatar: string;
  status: string;
  created_at: string;
  invited_at?: string | null;
};

export type UserInviteOverview = {
  invite_code_id?: number;
  invite_code: string;
  invite_url?: string | null;
  status?: string | null;
  code_type?: string | null;
  max_uses?: number | null;
  used_count?: number;
  expires_at?: string | null;
  invited_friends: UserInviteFriend[];
};

export type SendUserInviteEmailPayload = {
  email: string;
  turnstile_token?: string;
};

export type TeamInviteLookup = {
  token: string;
};

type AvatarUploadResponse = {
  avatar?: string;
  user: CurrentUser;
};

export const WEB_LOGIN_URL_ENV = 'VITE_WEB_LOGIN_URL';
const DEVELOPMENT_WEB_LOGIN_URL = 'http://127.0.0.1:27515/api/auth/oidc/start';
const DESKTOP_AUTH_START_PATH = '/api/auth/oidc/start';
const OIDC_START_PATH = '/api/auth/oidc/start';

type WebLoginConfig =
  | {
      status: 'ready';
      url: string;
      host: string;
    }
  | {
      status: 'missing' | 'invalid';
      reason: 'missing-env' | 'unsupported-protocol' | 'invalid-url';
      message: string;
    };

export function getWebLoginConfig(): WebLoginConfig {
  const desktopLoginUrl = isTauriRuntime()
    ? (window as Window & { __ONE_BROWSER_CONFIG__?: { webLoginUrl?: string } })
        .__ONE_BROWSER_CONFIG__?.webLoginUrl
    : undefined;
  const configuredUrl =
    desktopLoginUrl?.trim() ||
    import.meta.env.VITE_WEB_LOGIN_URL?.trim() ||
    (import.meta.env.DEV ? DEVELOPMENT_WEB_LOGIN_URL : undefined);

  if (!configuredUrl) {
    return {
      status: 'missing',
      reason: 'missing-env',
      message: `请配置 ${WEB_LOGIN_URL_ENV}`,
    };
  }

  try {
    const url = new URL(configuredUrl);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return {
        status: 'invalid',
        reason: 'unsupported-protocol',
        message: `${WEB_LOGIN_URL_ENV} 只支持 http 或 https`,
      };
    }

    if (
      url.pathname !== DESKTOP_AUTH_START_PATH ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return {
        status: 'invalid',
        reason: 'invalid-url',
        message: `${WEB_LOGIN_URL_ENV} 必须是 origin + ${DESKTOP_AUTH_START_PATH}`,
      };
    }

    return {
      status: 'ready',
      url: url.toString(),
      host: url.host,
    };
  } catch {
    return {
      status: 'invalid',
      reason: 'invalid-url',
      message: `${WEB_LOGIN_URL_ENV} 不是有效链接`,
    };
  }
}

export function buildWebLoginUrl(returnTo?: string, selectAccount = false) {
  if (!isTauriRuntime()) {
    const origin =
      typeof window === 'undefined'
        ? 'http://localhost'
        : window.location.origin;
    const url = new URL(OIDC_START_PATH, origin);
    url.searchParams.set('return_to', normalizeBrowserReturnTo(returnTo));
    if (selectAccount) url.searchParams.set('prompt', 'select_account');
    return typeof window === 'undefined'
      ? `${url.pathname}${url.search}`
      : url.toString();
  }

  const config = getWebLoginConfig();

  if (config.status !== 'ready') {
    throw new Error(config.message);
  }

  const url = new URL(config.url);
  url.searchParams.set('return_to', '/callback?desktop=1');
  return url.toString();
}

export async function prepareWebLoginUrl(
  returnTo?: string,
  selectAccount = false,
) {
  return buildWebLoginUrl(returnTo, selectAccount);
}

function normalizeBrowserReturnTo(value?: string) {
  const currentUrl = new URL(
    value ||
      (typeof window === 'undefined'
        ? import.meta.env.BASE_URL || '/'
        : window.location.href),
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  );
  [
    'access_token',
    'accessToken',
    'token',
    'refresh_token',
    'refreshToken',
    'expires_in',
    'expiresIn',
    'refresh_expires_in',
    'refreshExpiresIn',
    'api_url',
    'apiUrl',
    'user_id',
    'user_name',
  ].forEach((key) => currentUrl.searchParams.delete(key));
  currentUrl.hash = '';
  if (
    typeof window !== 'undefined' &&
    currentUrl.origin !== window.location.origin
  ) {
    return '/';
  }
  return `${currentUrl.pathname}${currentUrl.search}`;
}

export type DesktopHandoffAuthorization = {
  callback_url: string;
  expires_in: number;
};

export type OidcCompletePayload = {
  code?: string;
  error?: string;
  errorDescription?: string;
  state: string;
};

export type OidcCompleteResult = {
  returnTo: string;
};

export async function completeOidcLogin(payload: OidcCompletePayload) {
  const response = await http.post<OidcCompleteResult, OidcCompletePayload>(
    '/auth/oidc/complete',
    payload,
  );
  return response.data;
}

/**
 * `handoffState` is the state the desktop app generated when it opened the
 * login page; the backend echoes it so the app can bind the deep link to it.
 * `from` is the app's deep-link scheme (`one-browser-dev` for dev builds); the
 * backend only accepts its own allowlist and defaults to `one-browser`.
 */
export async function authorizeDesktopHandoff(
  handoffState?: string,
  from?: string,
) {
  const response = await http.post<
    DesktopHandoffAuthorization,
    { handoff_state?: string; from?: string }
  >('/auth/app/handoff', {
    ...(handoffState ? { handoff_state: handoffState } : {}),
    ...(handoffState && from ? { from } : {}),
  });
  return response.data;
}

export async function getCurrentUser() {
  const response = await http.get<CurrentUser>('/auth/me');
  return response.data;
}

export async function updateCurrentUserProfile(
  payload: UpdateCurrentUserProfilePayload,
) {
  const response = await http.put<CurrentUser>('/auth/me', payload);
  return response.data;
}

export async function uploadCurrentUserAvatar(file: File) {
  const formData = new FormData();
  formData.set('file', file);

  const response = await http.upload<AvatarUploadResponse>(
    '/auth/avatar',
    formData,
  );
  return response.data.user;
}

export async function getCurrentUserInvite() {
  const response = await http.get<UserInviteOverview>('/me/referral-link');
  return response.data;
}

export async function sendUserInviteEmail(payload: SendUserInviteEmailPayload) {
  return http.post<void, SendUserInviteEmailPayload>(
    '/me/referral-link/email',
    payload,
  );
}

export async function previewTeamInvite({ token }: TeamInviteLookup) {
  const response = await http.get<TeamInvite>('/referrals/team-invite/check', {
    token,
  });
  return response.data;
}

export async function acceptTeamInvite({ token }: TeamInviteLookup) {
  const response = await http.post<TeamInvite, TeamInviteLookup>(
    '/referrals/team-invite/accept',
    { token },
  );
  return response.data;
}

export async function declineTeamInvite({ token }: TeamInviteLookup) {
  const response = await http.post<TeamInvite, TeamInviteLookup>(
    '/referrals/team-invite/decline',
    { token },
  );
  return response.data;
}

export async function getAuthPermissions() {
  const response = await http.get<AuthPermissions>(
    '/auth/app/permissions',
    undefined,
    { cache: 'no-store' },
  );
  return response.data;
}

export async function logout() {
  try {
    await http.post<void>('/auth/logout');
  } finally {
    if (isTauriRuntime()) {
      await desktopInvoke('clear_desktop_auth_session');
    }
  }
}
