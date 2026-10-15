import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DESKTOP_FOREGROUND_EVENT } from '@/lib/desktop/foreground';
import { http } from '@/lib/http';
import { startAuthSessionRenewal } from './session-renewal';

vi.mock('@/lib/http', () => ({ http: { refreshSession: vi.fn() } }));

describe('online session renewal', () => {
  let connection: { onLine: boolean };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    vi.mocked(http.refreshSession).mockResolvedValue(undefined);
    vi.stubGlobal(
      'window',
      Object.assign(new EventTarget(), {
        setInterval,
        clearInterval,
      }),
    );
    vi.stubGlobal(
      'document',
      Object.assign(new EventTarget(), {
        visibilityState: 'visible',
      }),
    );
    connection = { onLine: true };
    vi.stubGlobal('navigator', connection);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renews an online session every five minutes without user requests', () => {
    const stop = startAuthSessionRenewal();
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(http.refreshSession).toHaveBeenCalledTimes(1);
    stop();
  });

  it('renews on native foreground and when connectivity returns', () => {
    const stop = startAuthSessionRenewal();
    window.dispatchEvent(new Event(DESKTOP_FOREGROUND_EVENT));
    window.dispatchEvent(new Event('focus'));
    vi.advanceTimersByTime(100);
    expect(http.refreshSession).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('online'));
    expect(http.refreshSession).toHaveBeenCalledTimes(2);
    stop();
  });

  it('skips offline renewal and removes its timer and listeners on stop', () => {
    const stop = startAuthSessionRenewal();
    connection.onLine = false;
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(http.refreshSession).not.toHaveBeenCalled();
    stop();
    connection.onLine = true;
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event(DESKTOP_FOREGROUND_EVENT));
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(http.refreshSession).not.toHaveBeenCalled();
  });
});
