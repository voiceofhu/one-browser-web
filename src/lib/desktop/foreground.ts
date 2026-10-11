// Native focus covers Dock/tray restores where WebView visibility stays visible.
export const DESKTOP_FOREGROUND_EVENT = 'one-browser-app-foreground';

export function onDesktopForeground(check: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (document.visibilityState === 'hidden') return;
    clearTimeout(timer);
    timer = setTimeout(check, 100);
  };

  window.addEventListener(DESKTOP_FOREGROUND_EVENT, schedule);
  window.addEventListener('focus', schedule);
  document.addEventListener('visibilitychange', schedule);
  return () => {
    clearTimeout(timer);
    window.removeEventListener(DESKTOP_FOREGROUND_EVENT, schedule);
    window.removeEventListener('focus', schedule);
    document.removeEventListener('visibilitychange', schedule);
  };
}
