import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@/lib/desktop/mock', () => ({ invokeMockCommand: vi.fn() }));

import { invoke } from '@tauri-apps/api/core';
import { desktopInvoke } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('installed App version', () => {
  it('preserves the native version when the Web bundle has a different version', async () => {
    vi.stubGlobal('window', {
      __TAURI_INTERNALS__: {},
      location: new URL('https://browser.aicbe.com/dashboard'),
    });
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const nativeVersion = `${Number(__APP_VERSION__.split('.')[0]) + 1}.1.1`;
    const nativeStatus = { appVersion: nativeVersion };
    vi.mocked(invoke).mockResolvedValueOnce(nativeStatus);

    const status = await desktopInvoke<typeof nativeStatus>('get_app_status');

    expect(status.appVersion).toBe(nativeVersion);
    expect(status).toBe(nativeStatus);
    expect(invoke).toHaveBeenCalledWith('get_app_status', undefined);
  });
});
