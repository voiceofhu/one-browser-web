import { createApiFetch } from '@/lib/sealed';

/** Production builds encrypt API calls; `plain` must match the backend `Sealed::plain`. */
export const apiFetch = createApiFetch({
  enabled: import.meta.env.MODE === 'production',
  info: 'one-browser sealed api v1',
  plain: (pathname) =>
    [
      '/api/auth/oidc/start',
      '/api/auth/google/callback',
      '/api/auth/avatar',
      '/api/browser/assets/uploads/direct',
      '/api/health/stream',
      '/api/system/egress-nodes/events',
      '/api/integrations/telegram/webhook',
    ].includes(pathname) ||
    /^\/api\/app-downloads\/assets\/[^/]+\/download$/.test(pathname) ||
    /^\/api\/browser\/assets\/uploads\/[^/]+\/parts$/.test(pathname),
});
