import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { getBackendOrigin } from '@/lib/http/url';

const PASSWORD_REDIRECT_PATH = '/api/auth/oidc/account/password';

export async function openOneUserPasswordPage() {
  const url = new URL(PASSWORD_REDIRECT_PATH, getBackendOrigin()).toString();
  if (isTauriRuntime()) {
    await desktopInvoke('open_external_url', { request: { url } });
    return;
  }
  window.location.assign(url);
}
