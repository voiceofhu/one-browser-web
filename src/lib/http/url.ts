import { HttpError } from '@/lib/http/types';

export function getApiBaseUrl() {
  const envApiUrl = import.meta.env.VITE_API_URL?.trim();
  return envApiUrl ? envApiUrl.replace(/\/$/, '') : '/api';
}

export function buildRequestUrl(
  baseURL: string,
  url: string,
  params?: Record<string, unknown>,
) {
  let fullURL = url.startsWith('http') ? url : `${baseURL}${url}`;
  if (!params) return fullURL;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  const paramString = searchParams.toString();
  if (paramString) {
    fullURL += `${fullURL.includes('?') ? '&' : '?'}${paramString}`;
  }
  return fullURL;
}

export function getUrlPath(url: string) {
  if (!url.startsWith('http')) return url;
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function sanitizeRequestUrl(value: string) {
  try {
    const url =
      typeof window === 'undefined'
        ? new URL(value)
        : new URL(value, window.location.href);
    [
      'access_token',
      'accessToken',
      'token',
      'refresh_token',
      'refreshToken',
    ].forEach((key) => url.searchParams.delete(key));
    return url.toString();
  } catch {
    return value;
  }
}

export function shouldSkipAuthRedirect(url: string) {
  const path = getUrlPath(url);
  return (
    path.endsWith('/auth/login') ||
    path.endsWith('/auth/google/callback') ||
    path.endsWith('/auth/oidc/complete')
  );
}

export function shouldRefreshAuth(url: string) {
  const path = getUrlPath(url);
  return !(
    path.includes('/app-downloads/') ||
    path.endsWith('/auth/login') ||
    path.endsWith('/auth/google/callback') ||
    path.endsWith('/auth/oidc/complete') ||
    path.endsWith('/auth/refresh')
  );
}

export function shouldLogRequest(url: string, fullURL: string) {
  return getUrlPath(fullURL || url).includes('/auth/');
}

export function isUnauthorizedError(error: HttpError) {
  return error.status === 401 || error.code === 401 || error.code === '401';
}

export function isSuccessCode(code: number) {
  return code === 0 || code === 200 || code === 201;
}
