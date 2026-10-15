import {
  type AuthTokens,
  advanceAuthSessionGeneration,
  clearAuthToken,
  getAuthSessionGeneration,
  isAuthAccessTokenStale,
  markAuthExpiredNotice,
  notifyAuthSessionExpired,
  notifyAuthTokensChanged,
  readAuthToken,
  readAuthTokens,
  storeAuthToken,
  storeAuthTokens,
} from '@/features/auth/session';
import { DesktopApiError, desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { refreshBrowserOidcSession } from '@/lib/http/auth-refresh';
import {
  deleteHeader,
  getHeader,
  parseHttpResponse,
  sendHttpRequest,
} from '@/lib/http/transport';
import type {
  ApiResponse,
  RequestConfig,
  RequestOptions,
} from '@/lib/http/types';
import { HttpError } from '@/lib/http/types';
import {
  buildRequestUrl,
  getUrlPath,
  isUnauthorizedError,
  sanitizeRequestUrl,
  shouldLogRequest,
  shouldRefreshAuth,
  shouldSkipAuthRedirect,
} from '@/lib/http/url';

export class HttpClient {
  private readonly baseURL: string;
  private readonly defaultHeaders: Record<string, string>;
  private refreshTokensPromise: Promise<void> | null = null;
  private authSessionExpired = false;

  constructor(config: RequestConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  updateToken(token: string) {
    if (token) {
      console.info('[auth-debug] update single auth token', {
        hasAccessToken: true,
      });
      this.authSessionExpired = false;
      if (!isTauriRuntime()) {
        Reflect.deleteProperty(this.defaultHeaders, 'Authorization');
        clearAuthToken('browser-cookie-mode');
        notifyAuthTokensChanged();
        return;
      }
      this.defaultHeaders.Authorization = `Bearer ${token}`;
      storeAuthToken(token);
      advanceAuthSessionGeneration();
      notifyAuthTokensChanged();
      return;
    }

    this.authSessionExpired = true;
    Reflect.deleteProperty(this.defaultHeaders, 'Authorization');
    clearAuthToken('updateToken(empty)');
    notifyAuthTokensChanged();
  }

  updateTokens(
    tokens: AuthTokens | null,
    options: { replaceSession?: boolean } = {},
  ) {
    if (tokens?.accessToken) {
      console.info('[auth-debug] update auth tokens', {
        hasAccessToken: true,
        hasRefreshToken: Boolean(tokens.refreshToken),
        source: tokens.source,
      });
      this.authSessionExpired = false;
      if (!isTauriRuntime()) {
        Reflect.deleteProperty(this.defaultHeaders, 'Authorization');
        clearAuthToken('browser-cookie-mode');
        notifyAuthTokensChanged();
        return;
      }
      this.defaultHeaders.Authorization = `Bearer ${tokens.accessToken}`;
      storeAuthTokens(tokens);
      if (options.replaceSession ?? true) {
        advanceAuthSessionGeneration();
      }
      notifyAuthTokensChanged();
      return;
    }

    this.authSessionExpired = true;
    Reflect.deleteProperty(this.defaultHeaders, 'Authorization');
    clearAuthToken('updateTokens(null)');
    notifyAuthTokensChanged();
  }

  async request<T>(
    url: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    this.syncAuthSessionStateFromTokens();
    try {
      await this.refreshAuthTokensBeforeRequest(url);
    } catch (error: unknown) {
      if (error instanceof HttpError && isUnauthorizedError(error)) {
        this.expireAuthSession(error.message, '/auth/refresh');
      }
      throw error instanceof Error ? error : new Error('网络请求失败');
    }

    const desktopRequest = isTauriRuntime();
    const requestGeneration = desktopRequest ? getAuthSessionGeneration() : 0;
    try {
      const response = await this.sendRequest<T>(url, options);
      if (desktopRequest && requestGeneration !== getAuthSessionGeneration()) {
        console.info('[auth-request] discarded response from older session', {
          path: getUrlPath(url),
          requestGeneration,
          currentGeneration: getAuthSessionGeneration(),
        });
        throw new Error('登录状态已更新，请重试');
      }
      return response;
    } catch (error: unknown) {
      if (!(error instanceof HttpError) || !isUnauthorizedError(error)) {
        throw error instanceof Error ? error : new Error('网络请求失败');
      }
      if (desktopRequest && requestGeneration !== getAuthSessionGeneration()) {
        throw error;
      }
      this.expireAuthSession(error.message, url);
      throw error;
    }
  }

  get<T>(
    url: string,
    params?: Record<string, string | number | boolean>,
    options?: Omit<RequestOptions, 'params'>,
  ) {
    return this.request<T>(url, { ...options, method: 'GET', params });
  }

  post<T = unknown, B = unknown>(
    url: string,
    data?: B,
    options?: Omit<RequestOptions, 'data'>,
  ) {
    return this.request<T>(url, { ...options, method: 'POST', data });
  }

  put<T = unknown, B = unknown>(
    url: string,
    data?: B,
    options?: Omit<RequestOptions, 'data'>,
  ) {
    return this.request<T>(url, { ...options, method: 'PUT', data });
  }

  patch<T = unknown, B = unknown>(
    url: string,
    data?: B,
    options?: Omit<RequestOptions, 'data'>,
  ) {
    return this.request<T>(url, { ...options, method: 'PATCH', data });
  }

  delete<T = unknown>(url: string, options?: RequestOptions) {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  upload<T = unknown>(
    url: string,
    formData: FormData,
    options?: Omit<RequestOptions, 'data' | 'body'>,
  ) {
    return this.request<T>(url, { ...options, method: 'POST', data: formData });
  }

  async refreshSession() {
    const generation = getAuthSessionGeneration();
    try {
      await this.refreshAuthTokens();
    } catch (error) {
      if (
        error instanceof HttpError &&
        isUnauthorizedError(error) &&
        generation === getAuthSessionGeneration()
      ) {
        this.expireAuthSession(error.message, '/auth/refresh');
      }
      throw error;
    }
  }

  private async sendRequest<T>(url: string, options: RequestOptions) {
    const { params, data, ...fetchOptions } = options;
    const fullURL = buildRequestUrl(this.baseURL, url, params);
    const headers = { ...this.defaultHeaders };
    new Headers(fetchOptions.headers).forEach((value, key) => {
      headers[key] = value;
    });

    const accessToken =
      isTauriRuntime() && shouldRefreshAuth(url) ? readAuthToken() : '';
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else {
      deleteHeader(headers, 'Authorization');
    }

    const shouldLog = shouldLogRequest(url, fullURL);
    if (shouldLog) {
      const tokens = isTauriRuntime() ? readAuthTokens() : null;
      console.info('[auth-request] send', {
        method: fetchOptions.method || 'GET',
        url: sanitizeRequestUrl(fullURL),
        path: getUrlPath(fullURL),
        isTauri: isTauriRuntime(),
        hasAuthorization: Boolean(headers.Authorization),
        hasStoredAccessToken: Boolean(tokens?.accessToken),
        hasStoredRefreshToken: Boolean(tokens?.refreshToken),
        source: tokens?.source,
        baseURL: this.baseURL,
      });
    }

    let body = fetchOptions.body;
    if (data !== undefined) {
      if (data instanceof FormData) {
        body = data;
        deleteHeader(headers, 'Content-Type');
      } else if (data instanceof Blob) {
        body = data;
        headers['Content-Type'] = data.type || 'application/octet-stream';
      } else {
        body = JSON.stringify(data);
      }
    }

    const response = await sendHttpRequest(
      fullURL,
      isTauriRuntime()
        ? fetchOptions
        : { ...fetchOptions, credentials: 'same-origin' },
      headers,
      body,
    );
    if (shouldLog) {
      console.info('[auth-request] response', {
        method: fetchOptions.method || 'GET',
        url: sanitizeRequestUrl(fullURL),
        path: getUrlPath(fullURL),
        status: response.status,
        ok: response.ok,
        contentType: getHeader(response.headers, 'content-type'),
        hasBody: Boolean(response.body),
      });
    }
    return parseHttpResponse<T>(response);
  }

  private async refreshAuthTokens() {
    this.syncAuthSessionStateFromTokens();
    if (this.refreshTokensPromise) return this.refreshTokensPromise;
    if (this.authSessionExpired) {
      console.info('[auth-debug] refresh skipped expired auth session');
      throw new HttpError(401, 'AUTH_SESSION_EXPIRED', '登录信息已过期');
    }

    if (!isTauriRuntime()) {
      this.refreshTokensPromise = refreshBrowserOidcSession(
        this.baseURL,
      ).finally(() => {
        this.refreshTokensPromise = null;
      });
      return this.refreshTokensPromise;
    }

    const tokens = readAuthTokens();
    if (!tokens?.accessToken) {
      console.info('[auth-debug] refresh skipped missing desktop session', {
        hasAccessToken: Boolean(tokens?.accessToken),
      });
      throw new HttpError(401, 'MISSING_DESKTOP_SESSION', '登录信息已过期');
    }
    console.info('[auth-debug] refresh auth tokens start', {
      hasRefreshToken: false,
      hasAccessToken: Boolean(tokens?.accessToken),
      isTauri: isTauriRuntime(),
      hasExistingPromise: Boolean(this.refreshTokensPromise),
    });
    const generation = getAuthSessionGeneration();
    this.refreshTokensPromise = desktopInvoke<{
      accessToken: string;
      expiresIn: number;
      refreshExpiresIn: number;
      receivedAt: number;
    }>('refresh_desktop_auth_session')
      .then((snapshot) => {
        if (generation !== getAuthSessionGeneration()) {
          throw new Error('登录状态已更新，请重试');
        }
        this.updateTokens(
          {
            accessToken: snapshot.accessToken,
            refreshToken: '',
            expiresIn: snapshot.expiresIn,
            refreshExpiresIn: snapshot.refreshExpiresIn,
            receivedAt: snapshot.receivedAt,
            source: 'desktop-keychain',
          },
          { replaceSession: false },
        );
      })
      .catch((error: unknown) => {
        if (generation !== getAuthSessionGeneration()) {
          throw new Error('登录状态已更新，请重试');
        }
        if (
          error instanceof DesktopApiError &&
          (error.code === 40401 || error.code === 40901)
        ) {
          throw new HttpError(
            401,
            'DESKTOP_AUTH_SESSION_EXPIRED',
            error.message,
          );
        }
        throw error;
      })
      .finally(() => {
        this.refreshTokensPromise = null;
      });
    return this.refreshTokensPromise;
  }

  private async refreshAuthTokensBeforeRequest(url: string) {
    if (!isTauriRuntime() || !shouldRefreshAuth(url)) return;
    const tokens = readAuthTokens();
    if (!tokens?.accessToken || !isAuthAccessTokenStale(tokens)) return;
    console.info('[auth-debug] refresh auth tokens before request', {
      path: getUrlPath(url),
      hasAccessToken: Boolean(tokens.accessToken),
      hasRefreshToken: false,
    });
    await this.refreshAuthTokens();
  }

  private syncAuthSessionStateFromTokens() {
    if (!isTauriRuntime()) {
      return;
    }
    if (this.authSessionExpired && readAuthTokens()?.accessToken) {
      this.authSessionExpired = false;
    }
  }

  private expireAuthSession(message: string, url: string) {
    const notice = message.trim() || '登录信息已过期，请重新登录';
    if (shouldSkipAuthRedirect(url)) {
      console.info('[auth-request] auth redirect skipped', {
        path: getUrlPath(url),
        isTauri: isTauriRuntime(),
        message: notice,
      });
      return;
    }
    if (this.authSessionExpired && !readAuthTokens()) return;
    console.info('[auth-request] expiring auth session', {
      path: getUrlPath(url),
      isTauri: isTauriRuntime(),
      message: notice,
    });
    if (
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      markAuthExpiredNotice(notice);
    }
    this.updateTokens(null);
    notifyAuthSessionExpired(notice);
  }
}
