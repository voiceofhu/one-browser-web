import type { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  closeAllProfiles: vi.fn(),
  effects: [] as Array<() => (() => void) | void>,
  generation: vi.fn(),
  isDesktop: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react', () => ({
  useEffect: (effect: () => (() => void) | void) => mocks.effects.push(effect),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));
vi.mock('@/features/auth/session', () => ({
  AUTH_SESSION_EXPIRED_EVENT: 'one-browser:auth-session-expired',
  getAuthSessionGeneration: mocks.generation,
}));
vi.mock('@/features/browser/runtime/api', () => ({
  closeAllProfiles: mocks.closeAllProfiles,
}));
vi.mock('@/lib/desktop', () => ({ isTauriRuntime: mocks.isDesktop }));

import { useAuthRuntimeCleanup } from './runtime-cleanup';

const handlers = new Map<string, (event: Event) => void>();

beforeEach(() => {
  vi.resetAllMocks();
  mocks.effects.length = 0;
  mocks.generation.mockReturnValue(17);
  mocks.isDesktop.mockReturnValue(false);
  mocks.closeAllProfiles.mockResolvedValue({});
  handlers.clear();
  vi.stubGlobal('window', {
    addEventListener: (name: string, handler: (event: Event) => void) =>
      handlers.set(name, handler),
    removeEventListener: (name: string) => handlers.delete(name),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function useMountedCleanup() {
  const queryClient = {
    cancelQueries: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
  };
  useAuthRuntimeCleanup(queryClient as unknown as QueryClient);
  const unmount = mocks.effects[0]();
  return { queryClient, unmount };
}

function expire(generation = 17) {
  handlers.get('one-browser:auth-session-expired')?.({
    detail: { generation, message: '登录信息已过期' },
  } as unknown as Event);
}

describe('expired authentication cleanup', () => {
  it('clears Web queries and immediately replaces the route with login', () => {
    const { queryClient } = useMountedCleanup();

    expire();

    expect(queryClient.cancelQueries).toHaveBeenCalledOnce();
    expect(queryClient.clear).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith('/login', {
      replace: true,
    });
    expect(mocks.closeAllProfiles).not.toHaveBeenCalled();
  });

  it('deduplicates native expiry and redirects before waiting for profiles to close', async () => {
    mocks.isDesktop.mockReturnValue(true);
    let finishClose!: () => void;
    mocks.closeAllProfiles.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishClose = resolve;
      }),
    );
    const { queryClient } = useMountedCleanup();

    expire();
    expire();

    expect(queryClient.cancelQueries).toHaveBeenCalledOnce();
    expect(queryClient.clear).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith('/login', {
      replace: true,
    });
    await Promise.resolve();
    expect(mocks.closeAllProfiles).toHaveBeenCalledOnce();

    expire(18);
    await Promise.resolve();
    expect(mocks.closeAllProfiles).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledTimes(2);

    finishClose();
    await vi.waitFor(() => {
      expect(mocks.closeAllProfiles).toHaveBeenCalledTimes(2);
    });
  });

  it('uses the current generation for malformed events and removes its listener on unmount', () => {
    const { queryClient, unmount } = useMountedCleanup();
    const handler = handlers.get('one-browser:auth-session-expired')!;

    handler({} as Event);
    expire();

    expect(queryClient.clear).toHaveBeenCalledOnce();
    expect(mocks.generation).toHaveBeenCalledOnce();
    unmount?.();
    expect(handlers.has('one-browser:auth-session-expired')).toBe(false);
  });
});
