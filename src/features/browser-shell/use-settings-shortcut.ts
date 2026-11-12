import { settingsPath } from '@/features/browser/settings/settings-sections';
import { isTauriRuntime } from '@/lib/desktop';
import { openSettingsWindow } from '@/lib/desktop/settings-window';
import { useRouter } from '@/router/compat';
import * as React from 'react';

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || '');

/** The platform's settings shortcut as shown in menus. */
export const settingsShortcutLabel = isMac ? '⌘,' : 'Ctrl+,';

/**
 * ⌘, / Ctrl+, opens the settings window in the App, as desktop apps do. Not bound on the
 * web, where the shortcut belongs to the browser itself.
 */
export function useSettingsShortcut() {
  const router = useRouter();

  React.useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key !== ',' ||
        event.altKey ||
        event.shiftKey ||
        (isMac ? !event.metaKey || event.ctrlKey : !event.ctrlKey)
      ) {
        return;
      }
      event.preventDefault();
      void openSettingsWindow().then((opened) => {
        if (!opened) router.push(settingsPath());
      });
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);
}
