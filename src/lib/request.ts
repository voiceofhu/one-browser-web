import { toast } from "sonner"

export class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "HttpError"
    this.status = status
    this.code = code
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"
const APP_BASE_URL = import.meta.env.VITE_BASE_URL || "/"
const AUTH_EXPIRED_NOTICE_KEY = "one-browser:auth-expired-notice"
let isRedirectingToLogin = false

export function isUnauthorizedError(error: unknown): error is HttpError {
  return error instanceof HttpError && error.status === 401
}

export function consumeAuthExpiredNotice() {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const shouldNotify =
      window.sessionStorage.getItem(AUTH_EXPIRED_NOTICE_KEY) === "1"
    window.sessionStorage.removeItem(AUTH_EXPIRED_NOTICE_KEY)
    return shouldNotify
  } catch {
    return false
  }
}

function getAppBasePath() {
  const basePath = APP_BASE_URL.replace(/\/+$/, "")
  return basePath === "" ? "" : basePath
}

function stripAppBasePath(pathname: string) {
  const basePath = getAppBasePath()
  if (!basePath || !pathname.startsWith(basePath)) {
    return pathname || "/"
  }

  return pathname.slice(basePath.length) || "/"
}

function buildLoginUrl() {
  const basePath = getAppBasePath()
  const currentPath = stripAppBasePath(window.location.pathname)

  if (currentPath === "/login") {
    return null
  }

  const redirect = `${currentPath}${window.location.search}${window.location.hash}`
  return `${basePath}/login?redirect=${encodeURIComponent(redirect)}`
}

function redirectToLogin(path: string) {
  if (
    typeof window === "undefined" ||
    isRedirectingToLogin ||
    path.includes("/auth/login")
  ) {
    return
  }

  const loginUrl = buildLoginUrl()
  if (!loginUrl) {
    return
  }

  isRedirectingToLogin = true
  markAuthExpiredNotice()
  toast.warning("登录状态已失效", {
    description: "请重新登录后继续操作。",
  })
  window.location.assign(loginUrl)
}

function markAuthExpiredNotice() {
  try {
    window.sessionStorage.setItem(AUTH_EXPIRED_NOTICE_KEY, "1")
  } catch {
    // Redirect should still happen if browser storage is unavailable.
  }
}

function buildUrl(path: string, baseUrl = API_BASE_URL) {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
}

export function buildQueryPath(path: string, params?: object) {
  if (!params) {
    return path
  }

  const searchParams = new URLSearchParams()
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return
    }
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  if (!query) {
    return path
  }

  return `${path}${path.includes("?") ? "&" : "?"}${query}`
}

function buildHeaders(init: RequestInit) {
  if (init.body instanceof FormData) {
    return init.headers
  }

  const headers = new Headers(init.headers)
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return headers
}

async function parseError(response: Response) {
  const fallback = response.statusText || "Request failed"

  try {
    const body = (await response.json()) as {
      error?: string
      message?: string
    }

    return new HttpError(
      response.status,
      body.error ?? "http_error",
      body.message ?? fallback
    )
  } catch {
    return new HttpError(response.status, "http_error", fallback)
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  baseUrl = API_BASE_URL
) {
  const response = await fetch(buildUrl(path, baseUrl), {
    ...init,
    credentials: "include",
    headers: buildHeaders(init),
  })

  if (!response.ok) {
    const error = await parseError(response)
    if (isUnauthorizedError(error)) {
      redirectToLogin(path)
    }

    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function encodeBody(body?: unknown) {
  return body instanceof FormData ? body : JSON.stringify(body ?? {})
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  getRoot: <T>(path: string) => request<T>(path, {}, ""),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: encodeBody(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: encodeBody(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}
