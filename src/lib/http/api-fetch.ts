import { toBackendUrl } from '@/lib/http/url';
import { createApiFetch } from '@/lib/oblivious';

/** Production builds send API calls through Oblivious HTTP; `plain` must match the backend `Gateway::plain`. */
export const apiFetch = createApiFetch({
  enabled: import.meta.env.MODE === 'production',
  // Logical `/api/*` paths stay unchanged for the gateway; only the wire URL
  // moves to the backend origin when the Web is bundled into the desktop app.
  endpoint: toBackendUrl,
  plain: (pathname) =>
    [
      '/api/auth/oidc/start',
      '/api/auth/google/callback',
      '/api/auth/avatar',
      '/api/browser/assets/uploads/direct',
      '/api/health/stream',
      '/api/integrations/telegram/webhook',
      '/api/app-downloads/update/latest.json',
    ].includes(pathname) ||
    /^\/api\/app-downloads\/assets\/[^/]+\/download$/.test(pathname) ||
    /^\/api\/browser\/assets\/uploads\/[^/]+\/parts$/.test(pathname),
});
