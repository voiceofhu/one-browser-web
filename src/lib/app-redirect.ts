const APP_AUTHORIZE_PATH = "/auth/app/authorize"
const API_APP_AUTHORIZE_PATH = `/api${APP_AUTHORIZE_PATH}`
const APP_CALLBACK_PROTOCOL = "one-browser:"
const APP_CALLBACK_HOST = "auth"
const APP_CALLBACK_PATH = "/callback"
const WAKE_FRAME_TTL_MS = 5000

export const APP_AUTH_CLOSE_DELAY_SECONDS = 10

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
    url.protocol === APP_CALLBACK_PROTOCOL &&
    url.hostname === APP_CALLBACK_HOST &&
    url.pathname === APP_CALLBACK_PATH
  )
}

export function wakeAppRedirect(
  url: string,
  options: { preservePage?: boolean } = {}
) {
  if (!url || typeof window === "undefined") {
    return () => undefined
  }

  if (options.preservePage === false) {
    window.location.assign(url)
    return () => undefined
  }

  const frame = window.document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  frame.tabIndex = -1
  frame.src = url
  Object.assign(frame.style, {
    border: "0",
    clipPath: "inset(50%)",
    height: "1px",
    opacity: "0",
    pointerEvents: "none",
    position: "absolute",
    width: "1px",
  })

  window.document.body.appendChild(frame)
  const removeTimer = window.setTimeout(() => frame.remove(), WAKE_FRAME_TTL_MS)

  return () => {
    window.clearTimeout(removeTimer)
    frame.remove()
  }
}

export function closeCurrentWindow() {
  window.open("", "_self")
  window.close()
  window.setTimeout(() => {
    window.location.replace("about:blank")
  }, 100)
}
