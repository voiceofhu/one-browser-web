import { createApiFetch } from '@/lib/oblivious';

/** Production builds send API calls through Oblivious HTTP; `plain` must match the backend `Gateway::plain`. */
export const apiFetch = createApiFetch({
  enabled: import.meta.env.MODE === 'production',
  plain: (pathname) =>
    [
      '/api/auth/oidc/start',
      '/api/auth/google/callback',
      '/api/auth/avatar',
      '/api/browser/assets/uploads/direct',
      '/api/health/stream',
      '/api/integrations/telegram/webhook',
    ].includes(pathname) ||
    /^\/api\/app-downloads\/assets\/[^/]+\/download$/.test(pathname) ||
    /^\/api\/browser\/assets\/uploads\/[^/]+\/parts$/.test(pathname),
});
