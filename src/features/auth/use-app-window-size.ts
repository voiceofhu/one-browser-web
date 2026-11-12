import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { isSettingsWindow } from '@/lib/desktop/settings-window';
import * as React from 'react';

const DEFAULT_APP_WINDOW_SIZE = {
  width: 1040,
  height: 680,
  minWidth: 900,
  minHeight: 580,
} as const;

const LOGIN_APP_WINDOW_SIZE = {
  width: 420,
  height: 720,
  minWidth: 360,
  minHeight: 560,
} as const;

const WINDOW_RESIZE_DURATION_MS = 320;

type AppWindowSizePreset = {
  readonly width: number;
  readonly height: number;
  readonly minWidth: number;
  readonly minHeight: number;
};

async function applyAppWindowSizePreset(preset: AppWindowSizePreset) {
  // Login/workspace sizes belong to the main window; the settings window
  // boots the same app and must leave both windows' sizes alone.
  if (!isTauriRuntime() || isSettingsWindow()) {
    return;
  }

  try {
    await desktopInvoke<void>('animate_app_window', {
      request: {
        width: preset.width,
        height: preset.height,
        minWidth: preset.minWidth,
        minHeight: preset.minHeight,
        durationMs: isReducedMotionPreferred() ? 0 : WINDOW_RESIZE_DURATION_MS,
      },
    });
  } catch (error) {
    console.warn('App window size update failed.', error);
  }
}

function isReducedMotionPreferred() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useLoginAppWindowSize(enabled = true) {
  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    void applyAppWindowSizePreset(LOGIN_APP_WINDOW_SIZE);
  }, [enabled]);
}

export function useDefaultAppWindowSize(enabled = true) {
  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    void applyAppWindowSizePreset(DEFAULT_APP_WINDOW_SIZE);
  }, [enabled]);
}
