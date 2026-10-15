import { onDesktopForeground } from '@/lib/desktop/foreground';
import { http } from '@/lib/http';

const RENEW_INTERVAL_MS = 5 * 60 * 1000;

export function startAuthSessionRenewal() {
  const renew = () => {
    if (navigator.onLine === false) return;
    void http.refreshSession().catch((error) => {
      console.warn('[auth-session] renewal failed', error);
    });
  };
  const timer = window.setInterval(renew, RENEW_INTERVAL_MS);
  const stopForeground = onDesktopForeground(renew);
  window.addEventListener('online', renew);

  return () => {
    window.clearInterval(timer);
    stopForeground();
    window.removeEventListener('online', renew);
  };
}
