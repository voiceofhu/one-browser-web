const APP_AUTHORIZE_PATH = "/auth/app/authorize"
const API_APP_AUTHORIZE_PATH = `/api${APP_AUTHORIZE_PATH}`
const APP_CALLBACK_PROTOCOLS = ["one-browser:"] as const
const APP_CALLBACK_HOST = "auth"
const APP_CALLBACK_PATH = "/callback"

export function isAppRedirect(value: string) {
  if (!value) {
    return false
  }

  try {
    const url = new URL(value, window.location.origin)
    return (
      isAppCallbackUrl(url) ||
      url.pathname === APP_AUTHORIZE_PATH ||
      url.pathname === API_APP_AUTHORIZE_PATH
    )
  } catch {
    return (
      value === APP_AUTHORIZE_PATH ||
      value.startsWith(`${APP_AUTHORIZE_PATH}?`) ||
      value === API_APP_AUTHORIZE_PATH ||
      value.startsWith(`${API_APP_AUTHORIZE_PATH}?`) ||
      value.startsWith("one-browser://auth/callback")
    )
  }
}

function isAppCallbackUrl(url: URL) {
  return (
    APP_CALLBACK_PROTOCOLS.includes(
      url.protocol as (typeof APP_CALLBACK_PROTOCOLS)[number]
    ) &&
    url.hostname === APP_CALLBACK_HOST &&
    url.pathname === APP_CALLBACK_PATH
  )
}

export function wakeAppRedirect(url: string) {
  if (!url || typeof window === "undefined") {
    return () => undefined
  }

  window.location.assign(url)
  return () => undefined
}
