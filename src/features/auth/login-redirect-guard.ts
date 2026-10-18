// Web runtime opens One User's login after a short countdown on the login
// page. A short-lived guard stops callback/401 redirect loops.
const GUARD_KEY = 'one:oidc-redirect-at';
const GUARD_MS = 15_000;

export function markLoginRedirect() {
  sessionStorage.setItem(GUARD_KEY, String(Date.now()));
}

export function recentlyRedirected() {
  return Date.now() - Number(sessionStorage.getItem(GUARD_KEY) ?? 0) < GUARD_MS;
}

export function sessionEstablished() {
  sessionStorage.removeItem(GUARD_KEY);
}
