import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloseProfileResult } from '../contracts';

const mocks = vi.hoisted(() => ({
  close: vi.fn(),
  effects: [] as Array<() => void>,
}));
vi.mock('react', () => ({
  useEffect: (effect: () => void) => mocks.effects.push(effect),
}));
vi.mock('../environments/api', () => ({ closeRemoteEnvironment: mocks.close }));
vi.mock('@/lib/desktop', () => ({ desktopInvoke: vi.fn() }));
vi.mock('./cache-sync', () => ({ syncProfileListsFromRuntime: vi.fn() }));
vi.mock('./open-progress-toast', () => ({ toastBrowserOpenProgress: vi.fn() }));
import { closedRemoteEnvironmentLeases, useRuntimeEvents } from './events';
import type { QueryClient } from '@tanstack/react-query';

beforeEach(() => {
  mocks.close.mockReset().mockResolvedValue({});
  mocks.effects.length = 0;
});

describe('remote close generation', () => {
  it('carries the source generation, deduplicates it, and skips missing leases', () => {
    const closed = (
      profileId: string,
      leaseGeneration?: number,
    ): CloseProfileResult => ({ profileId, leaseGeneration, closed: true });
    expect(
      closedRemoteEnvironmentLeases([
        closed('remote-env-42', 7),
        closed('remote-env-42', 7),
        closed('local', 1),
        closed('remote-env-9'),
        closed('remote-env-8', 0),
      ]),
    ).toEqual([{ environmentId: 42, generation: 7 }]);
  });

  it('does not turn a late empty runtime snapshot into a close of a newer instance', async () => {
    const handlers = new Map<string, (event: Event) => void>();
    vi.stubGlobal('window', {
      addEventListener: (name: string, handler: (event: Event) => void) =>
        handlers.set(name, handler),
      removeEventListener: vi.fn(),
    });
    const queryClient = {
      getQueryData: vi
        .fn()
        .mockReturnValue([{ profileId: 'remote-env-42', leaseGeneration: 9 }]),
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    };
    useRuntimeEvents(queryClient as unknown as QueryClient);
    mocks.effects[0]();
    const changed = handlers.get('browser-runtime-changed')!;
    changed({ detail: { runtime: [] } } as unknown as Event);
    await Promise.resolve();
    expect(mocks.close).not.toHaveBeenCalled();
    changed({
      detail: {
        runtime: [],
        closedProfiles: [
          { profileId: 'remote-env-42', leaseGeneration: 7, closed: true },
        ],
      },
    } as unknown as Event);
    await Promise.resolve();
    expect(mocks.close).toHaveBeenCalledExactlyOnceWith(42, 7);
    vi.unstubAllGlobals();
  });
});
