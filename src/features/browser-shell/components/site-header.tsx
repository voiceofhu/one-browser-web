import { useDesktopPlatform } from '@/lib/desktop/use-desktop-platform';
import * as React from 'react';

type WindowAction = 'minimize' | 'toggleMaximize' | 'close';

async function withCurrentWindow(action: WindowAction) {
  if (typeof window === 'undefined' || !window.__TAURI_INTERNALS__) {
    return;
  }

  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow()[action]();
  } catch (error) {
    console.warn(`Window action "${action}" failed.`, error);
  }
}

async function startWindowDrag(event: React.MouseEvent<HTMLElement>) {
  if (
    event.button !== 0 ||
    event.defaultPrevented ||
    typeof window === 'undefined' ||
    !window.__TAURI_INTERNALS__
  ) {
    return;
  }

  const target = event.target instanceof HTMLElement ? event.target : null;
  if (
    target?.closest(
      'a,button,input,textarea,select,[role="button"],[data-no-window-drag]',
    )
  ) {
    return;
  }

  event.preventDefault();

  if (event.detail > 1) {
    await withCurrentWindow('toggleMaximize');
    return;
  }

  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().startDragging();
  } catch (error) {
    console.warn('Window drag failed.', error);
  }
}

export function SiteHeader() {
  const platform = useDesktopPlatform();

  if (platform === 'windows') {
    return null;
  }

  const isMac = platform === 'macos';

  return (
    <header
      className="bg-sidebar flex h-(--header-height) shrink-0 items-center gap-2 border-b px-3"
      onMouseDown={isMac ? (event) => void startWindowDrag(event) : undefined}
    >
      {isMac ? (
        <div className="w-[4.75rem] shrink-0" aria-hidden="true" />
      ) : null}

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-4 flex-1 self-stretch" />
      </div>
    </header>
  );
}
