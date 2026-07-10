import {
  getAcceptLanguageHeader,
  getCurrentLocale,
  isLoginPath,
  localizedPath,
  localizedPublicPath,
} from "@/local"
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  isAccessTokenStale,
  saveAuthTokens,
  type AuthTokenPayload,
} from "@/lib/auth-tokens"

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
let authSessionExpired = false
let isRedirectingToLogin = false
let refreshPromise: Promise<AuthTokenPayload> | null = null

export function isUnauthorizedError(error: unknown): error is HttpError {
  return error instanceof HttpError && error.status === 401
}

export function consumeAuthExpiredNotice() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const notice = window.sessionStorage.getItem(AUTH_EXPIRED_NOTICE_KEY)
    window.sessionStorage.removeItem(AUTH_EXPIRED_NOTICE_KEY)
    return notice
  } catch {
    return null
  }
}

export function markAuthRedirectNotice(message: string) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.setItem(AUTH_EXPIRED_NOTICE_KEY, message)
  } catch {
    // Redirect should still happen if browser storage is unavailable.
  }
}

export async function ensureFreshAccessToken(options?: { force?: boolean }) {
  syncAuthSessionStateFromTokens()

  if (!options?.force && !isAccessTokenStale()) {
    console.info("[auth-debug] ensure fresh access token skipped refresh", {
      force: options?.force ?? false,
      accessToken: getAccessToken(),
    })
    return getAccessToken()
  }

  console.info("[auth-debug] ensure fresh access token refreshing", {
    force: options?.force ?? false,
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
  })
  try {
    await refreshAuthTokens()
  } catch (error) {
    if (isUnauthorizedError(error)) {
      expireAuthSession("", error)
    }

    throw error
  }

  return getAccessToken()
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

  const locale = getCurrentLocale()
  const loginPath = localizedPublicPath(locale, "login")
  const redirect = `${localizedPath(locale, currentPath)}${window.location.search}${window.location.hash}`
  return `${basePath}${loginPath}?redirect=${encodeURIComponent(redirect)}`
}

function redirectToLogin(path: string, error: HttpError) {
  if (
    typeof window === "undefined" ||
    isRedirectingToLogin ||
    shouldSkipAuthRedirect(path)
  ) {
    return
  }

  const loginUrl = buildLoginUrl()
  if (!loginUrl) {
    return
  }

  isRedirectingToLogin = true
  markAuthExpiredNotice(error.message)
  window.location.assign(loginUrl)
}

function shouldSkipAuthRedirect(path: string) {
  return path.includes("/auth/login") || path.includes("/auth/google/callback")
}

function markAuthExpiredNotice(message: string) {
  markAuthRedirectNotice(message)
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

function buildHeaders(init: RequestInit, options?: { auth?: boolean }) {
  const headers = new Headers(init.headers)
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", getAcceptLanguageHeader())
  }

  if (options?.auth !== false && !headers.has("Authorization")) {
    const accessToken = getAccessToken()
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`)
    }
  }

  if (init.body instanceof FormData) {
    return headers
  }

  if (init.body instanceof Blob) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", init.body.type || "application/octet-stream")
    }
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
  syncAuthSessionStateFromTokens()

  const response = await sendRequest(path, init, baseUrl)

  if (!response.ok) {
    const error = await parseError(response)
    if (isUnauthorizedError(error)) {
      console.info("[auth-debug] request unauthorized", {
        path,
        url: buildUrl(path, baseUrl),
        status: error.status,
        code: error.code,
        message: error.message,
        accessToken: getAccessToken(),
        refreshToken: getRefreshToken(),
      })
      if (!shouldRefreshAuth(path)) {
        throw error
      }
      if (authSessionExpired || isRedirectingToLogin) {
        expireAuthSession(path, error)
        throw error
      }

      const refreshed = await refreshAndRetry<T>(path, init, baseUrl)
      if (refreshed.ok) {
        return refreshed.data
      }

      if (
        "refreshError" in refreshed &&
        isUnauthorizedError(refreshed.refreshError)
      ) {
        expireAuthSession(path, refreshed.refreshError)
      }

      if (
        "refreshError" in refreshed &&
        refreshed.refreshError instanceof Error
      ) {
        throw refreshed.refreshError
      }

      if ("retryError" in refreshed && refreshed.retryError instanceof Error) {
        throw refreshed.retryError
      }
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

  if (!isSuccessCode(body.code)) {
    throw new HttpError(
      response.status,
      String(body.code),
      body.message || "Request failed",
      getResponseDetails(body)
    )
  }

  markAuthSessionActiveIfTokenPresent()
  return body.data
}

async function sendRequest(path: string, init: RequestInit, baseUrl: string) {
  return fetch(buildUrl(path, baseUrl), {
    ...init,
    credentials: "omit",
    headers: buildHeaders(init),
  })
}

async function refreshAndRetry<T>(
  path: string,
  init: RequestInit,
  baseUrl: string
) {
  if (!shouldRefreshAuth(path)) {
    return { ok: false as const }
  }

  try {
    await refreshAuthTokens()
  } catch (refreshError) {
    return { ok: false as const, refreshError }
  }

  const response = await sendRequest(path, init, baseUrl)
  if (!response.ok) {
    return { ok: false as const, retryError: await parseError(response) }
  }

  return { ok: true as const, data: await parseResponseData<T>(response) }
}

function shouldRefreshAuth(path: string) {
  return !(
    path.includes("/auth/login") ||
    path.includes("/auth/google/callback") ||
    path.includes("/auth/refresh")
  )
}

async function refreshAuthTokens() {
  if (authSessionExpired) {
    console.info("[auth-debug] refresh skipped expired auth session")
    throw new HttpError(401, "AUTH_SESSION_EXPIRED", "请重新登录")
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    authSessionExpired = true
    console.info("[auth-debug] refresh skipped missing refresh token", {
      accessToken: getAccessToken(),
    })
    throw new HttpError(401, "MISSING_REFRESH_TOKEN", "请重新登录")
  }

  console.info("[auth-debug] refresh auth tokens start", {
    refreshToken,
    accessToken: getAccessToken(),
    hasExistingPromise: Boolean(refreshPromise),
  })
  refreshPromise ??= fetchRefreshToken(refreshToken).finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

async function fetchRefreshToken(refreshToken: string) {
  const init: RequestInit = {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  }
  const refreshUrl = buildUrl("/auth/refresh")
  console.info("[auth-debug] fetch refresh token request", {
    url: refreshUrl,
    refreshToken,
  })
  const response = await fetch(refreshUrl, {
    ...init,
    credentials: "omit",
    headers: buildHeaders(init, { auth: false }),
  })
  console.info("[auth-debug] fetch refresh token response", {
    url: refreshUrl,
    refreshToken,
    status: response.status,
    ok: response.ok,
  })

  if (!response.ok) {
    const error = await parseError(response)
    console.info("[auth-debug] fetch refresh token failed", {
      url: refreshUrl,
      refreshToken,
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
    })
    throw error
  }

  const tokens = await parseResponseData<AuthTokenPayload>(response)
  console.info("[auth-debug] fetch refresh token parsed", {
    url: refreshUrl,
    previousRefreshToken: refreshToken,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenType: tokens.token_type,
    expiresIn: tokens.expires_in,
    refreshExpiresIn: tokens.refresh_expires_in,
  })
  saveAuthTokens(tokens)
  markAuthSessionActive()
  return tokens
}

function expireAuthSession(path: string, error: HttpError) {
  console.info("[auth-debug] expire auth session", {
    path,
    status: error.status,
    code: error.code,
    message: error.message,
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
  })
  authSessionExpired = true
  refreshPromise = null
  clearAuthTokens()
  redirectToLogin(path, error)
}

function markAuthSessionActive() {
  authSessionExpired = false
  isRedirectingToLogin = false
}

function markAuthSessionActiveIfTokenPresent() {
  if (getAccessToken()) {
    markAuthSessionActive()
  }
}

function syncAuthSessionStateFromTokens() {
  if (authSessionExpired && getAccessToken() && getRefreshToken()) {
    markAuthSessionActive()
  }
}

async function parseResponseData<T>(response: Response) {
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

  if (!isSuccessCode(body.code)) {
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

function isSuccessCode(code: number) {
  return code === 0 || code === 200 || code === 201
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
  return body instanceof FormData || body instanceof Blob
    ? body
    : JSON.stringify(body ?? {})
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
