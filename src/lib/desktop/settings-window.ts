import * as React from 'react';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop/client';

const SETTINGS_WINDOW_LABEL = 'settings';

type TauriInternals = {
  metadata?: { currentWindow?: { label?: string } };
};

/** True inside the App's separate settings window. */
export function isSettingsWindow() {
  if (!isTauriRuntime()) return false;
  const internals = window.__TAURI_INTERNALS__ as TauriInternals | undefined;
  return internals?.metadata?.currentWindow?.label === SETTINGS_WINDOW_LABEL;
}

/**
 * In the App, settings open in their own window (or the open one comes to
 * the front). Returns false when the caller should navigate in-page instead:
 * on the web, inside the settings window itself, or if the App refused.
 */
export async function openSettingsWindow(section?: string) {
  if (!isTauriRuntime() || isSettingsWindow()) return false;
  try {
    await desktopInvoke('open_settings_window', { section });
    return true;
  } catch {
    return false;
  }
}

const SETTINGS_NAVIGATE_HOOK = '__oneBrowserSettingsNavigate';

type SettingsNavigateWindow = Window & {
  [SETTINGS_NAVIGATE_HOOK]?: (section: string) => void;
};

/**
 * The App keeps the settings window alive between opens and switches its
 * section through this hook, so a reopen is a route change, not a reload.
 */
export function useSettingsWindowNavigation(
  navigateToSection: (section: string) => void,
) {
  React.useEffect(() => {
    if (!isSettingsWindow()) return;
    const target = window as SettingsNavigateWindow;
    target[SETTINGS_NAVIGATE_HOOK] = navigateToSection;
    return () => {
      if (target[SETTINGS_NAVIGATE_HOOK] === navigateToSection) {
        delete target[SETTINGS_NAVIGATE_HOOK];
      }
    };
  }, [navigateToSection]);
}
