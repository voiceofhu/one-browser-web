import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DESKTOP_FOREGROUND_EVENT, onDesktopForeground } from './foreground';

describe('desktop foreground checks', () => {
  let windowTarget: EventTarget;
  let documentTarget: EventTarget & { visibilityState: string };

  beforeEach(() => {
    vi.useFakeTimers();
    windowTarget = new EventTarget();
    documentTarget = Object.assign(new EventTarget(), {
      visibilityState: 'visible',
    });
    vi.stubGlobal('window', windowTarget);
    vi.stubGlobal('document', documentTarget);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('checks every native activation even when visibility never changes', () => {
    const check = vi.fn();
    const stop = onDesktopForeground(check);
    for (let index = 0; index < 2; index++) {
      windowTarget.dispatchEvent(new Event(DESKTOP_FOREGROUND_EVENT));
      vi.advanceTimersByTime(100);
    }
    expect(check).toHaveBeenCalledTimes(2);
    stop();
  });

  it('coalesces native, DOM focus and visibility events from one activation', () => {
    const check = vi.fn();
    const stop = onDesktopForeground(check);
    windowTarget.dispatchEvent(new Event(DESKTOP_FOREGROUND_EVENT));
    windowTarget.dispatchEvent(new Event('focus'));
    documentTarget.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(100);
    expect(check).toHaveBeenCalledTimes(1);
    stop();
  });

  it('ignores background events and cancels pending work on cleanup', () => {
    const check = vi.fn();
    const stop = onDesktopForeground(check);
    documentTarget.visibilityState = 'hidden';
    documentTarget.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(100);
    expect(check).not.toHaveBeenCalled();
    documentTarget.visibilityState = 'visible';
    windowTarget.dispatchEvent(new Event('focus'));
    stop();
    windowTarget.dispatchEvent(new Event(DESKTOP_FOREGROUND_EVENT));
    vi.advanceTimersByTime(100);
    expect(check).not.toHaveBeenCalled();
  });
});
