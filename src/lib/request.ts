import { toast } from "sonner"

import {
  getAcceptLanguageHeader,
  getCurrentLocale,
  isLoginPath,
  localizedPublicPath,
  translate,
} from "@/local"

export class HttpError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(
    status: number,
    code: string,
    message: string,
    details: unknown = null
  ) {
    super(message)
    this.name = "HttpError"
    this.status = status
    this.code = code
    this.details = details
  }
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

type ApiErrorResponse = {
  code: string | number
  message: string
  details?: unknown
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

  if (isLoginPath(currentPath)) {
    return null
  }

  const loginPath = localizedPublicPath(getCurrentLocale(), "login")
  const redirect = `${currentPath}${window.location.search}${window.location.hash}`
  return `${basePath}${loginPath}?redirect=${encodeURIComponent(redirect)}`
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
  const locale = getCurrentLocale()
  toast.warning(translate(locale, "auth.expired.title"), {
    description: translate(locale, "auth.expired.description"),
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

export function buildApiUrl(path: string, baseUrl = API_BASE_URL) {
  return buildUrl(path, baseUrl)
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
  const headers = new Headers(init.headers)
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", getAcceptLanguageHeader())
  }

  if (init.body instanceof FormData) {
    return headers
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return headers
}

async function parseError(response: Response) {
  const fallback = response.statusText || "Request failed"

  try {
    const body: unknown = await response.json()
    if (!isApiErrorResponse(body)) {
      return new HttpError(response.status, "HTTP_ERROR", fallback)
    }

    return new HttpError(
      response.status,
      String(body.code),
      body.message,
      body.details ?? null
    )
  } catch {
    return new HttpError(response.status, "HTTP_ERROR", fallback)
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

  const body: unknown = await response.json()
  if (!isApiResponse<T>(body)) {
    throw new HttpError(
      response.status,
      "INVALID_API_RESPONSE",
      "Invalid API response"
    )
  }

  if (body.code !== 0) {
    throw new HttpError(
      response.status,
      String(body.code),
      body.message || "Request failed",
      getResponseDetails(body)
    )
  }

  return body.data
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object"
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    isRecord(value) &&
    typeof value.code === "number" &&
    typeof value.message === "string" &&
    "data" in value
  )
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    isRecord(value) &&
    (typeof value.code === "string" || typeof value.code === "number") &&
    typeof value.message === "string"
  )
}

function getResponseDetails(value: Record<string, unknown>) {
  return "details" in value ? value.details : null
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
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: encodeBody(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}
