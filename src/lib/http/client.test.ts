import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearAuthToken,
  getAuthSessionGeneration,
  readAuthTokens,
  storeAuthTokens,
} from '@/features/auth/session';
import { DesktopApiError, desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { apiFetch } from '@/lib/http/api-fetch';
import { HttpClient } from './client';

vi.mock('@/lib/desktop', async () => ({
  desktopInvoke: vi.fn(),
  isTauriRuntime: vi.fn(),
  DesktopApiError: (await import('@/lib/desktop/types')).DesktopApiError,
}));
vi.mock('@/lib/http/api-fetch', () => ({ apiFetch: vi.fn() }));

function response(status: number, data: unknown = null) {
  return new Response(JSON.stringify({ code: status, data }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('session renewal', () => {
  let expired: () => void;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isTauriRuntime).mockReturnValue(false);
    const target = Object.assign(new EventTarget(), {
      location: {
        pathname: '/environments',
        href: 'https://browser.test/environments',
      },
      localStorage: { removeItem: vi.fn() },
      sessionStorage: { setItem: vi.fn() },
    });
    vi.stubGlobal('window', target);
    clearAuthToken();
    expired = vi.fn();
    target.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expired);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('expires the browser session immediately when a business request returns 401', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(response(401));
    const client = new HttpClient({ baseURL: '/api' });

    await expect(client.get('/system/user')).rejects.toMatchObject({
      status: 401,
    });
    expect(vi.mocked(apiFetch).mock.calls.map(([url]) => url)).toEqual([
      '/api/system/user',
    ]);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('announces definitive expiry from a business request after clearing tokens', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(401));
    storeAuthTokens({
      accessToken: 'old-access',
      refreshToken: '',
      receivedAt: Date.now(),
    });
    const tokensAtExpiry: unknown[] = [];
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, () => {
      tokensAtExpiry.push(readAuthTokens());
    });
    const client = new HttpClient({ baseURL: '/api' });

    await expect(client.get('/system/user')).rejects.toMatchObject({
      status: 401,
    });
    expect(expired).toHaveBeenCalledTimes(1);
    expect(tokensAtExpiry).toEqual([null]);
  });

  it('expires a session when proactive renewal returns 401', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(response(401));
    const client = new HttpClient({ baseURL: '/api' });

    await expect(client.refreshSession()).rejects.toMatchObject({
      status: 401,
    });
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('keeps the session after a network failure and can renew later', async () => {
    vi.mocked(apiFetch)
      .mockRejectedValueOnce(new TypeError('Network unavailable'))
      .mockResolvedValueOnce(response(200, { refreshed: true }));
    const client = new HttpClient({ baseURL: '/api' });

    await expect(client.refreshSession()).rejects.toThrow(
      'Network unavailable',
    );
    await expect(client.refreshSession()).resolves.toBeUndefined();
    expect(expired).not.toHaveBeenCalled();
  });

  it('shares an in-flight refresh between foreground and request renewal', async () => {
    let resolveRefresh!: (value: Response) => void;
    vi.mocked(apiFetch).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    const client = new HttpClient({ baseURL: '/api' });
    const first = client.refreshSession();
    const second = client.refreshSession();
    expect(apiFetch).toHaveBeenCalledTimes(1);

    resolveRefresh(response(200, { refreshed: true }));
    await Promise.all([first, second]);
    expect(expired).not.toHaveBeenCalled();
  });

  it('rotates desktop credentials without replacing the account session', async () => {
    vi.mocked(isTauriRuntime).mockReturnValue(true);
    storeAuthTokens({
      accessToken: 'old-access',
      refreshToken: '',
      receivedAt: Date.now(),
    });
    vi.mocked(desktopInvoke).mockResolvedValueOnce({
      accessToken: 'new-access',
      expiresIn: 900,
      refreshExpiresIn: 30 * 24 * 60 * 60,
      receivedAt: Date.now(),
    });
    const generation = getAuthSessionGeneration();
    const client = new HttpClient();

    await client.refreshSession();
    expect(readAuthTokens()?.accessToken).toBe('new-access');
    expect(getAuthSessionGeneration()).toBe(generation);
    expect(expired).not.toHaveBeenCalled();
  });

  it('does not restore a desktop session from a refresh completed after logout', async () => {
    vi.mocked(isTauriRuntime).mockReturnValue(true);
    storeAuthTokens({
      accessToken: 'old-access',
      refreshToken: '',
      receivedAt: Date.now(),
    });
    let resolveRefresh!: (value: unknown) => void;
    vi.mocked(desktopInvoke)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
      )
      .mockResolvedValue(undefined);
    const client = new HttpClient();
    const renewal = client.refreshSession();
    client.updateTokens(null);
    resolveRefresh({
      accessToken: 'late-access',
      expiresIn: 900,
      refreshExpiresIn: 2592000,
      receivedAt: Date.now(),
    });

    await expect(renewal).rejects.toThrow('登录状态已更新');
    expect(readAuthTokens()).toBeNull();
    expect(expired).not.toHaveBeenCalled();
  });

  it('does not expire a new desktop login when an older pre-request refresh fails', async () => {
    vi.mocked(isTauriRuntime).mockReturnValue(true);
    storeAuthTokens({
      accessToken: 'old-access',
      refreshToken: '',
      expiresIn: 1,
      receivedAt: Date.now() - 60_000,
    });
    let rejectRefresh!: (error: unknown) => void;
    vi.mocked(desktopInvoke).mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectRefresh = reject;
      }),
    );
    const client = new HttpClient();
    const request = client.get('/auth/me');
    client.updateTokens({
      accessToken: 'new-login',
      refreshToken: '',
      receivedAt: Date.now(),
    });
    rejectRefresh(new DesktopApiError('old session expired', { code: 40901 }));

    await expect(request).rejects.toThrow('登录状态已更新');
    expect(readAuthTokens()?.accessToken).toBe('new-login');
    expect(expired).not.toHaveBeenCalled();
  });
});
