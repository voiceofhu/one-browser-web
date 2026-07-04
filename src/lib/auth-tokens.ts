export type AuthTokenPayload = {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_in?: number
  refresh_expires_in?: number
}

type StoredAuthTokens = {
  accessToken: string | null
  refreshToken: string | null
  tokenType: string
  accessExpiresAt: number | null
  refreshExpiresAt: number | null
}

const LEGACY_AUTH_TOKENS_KEY = "one-browser:auth-tokens"
const AUTH_TOKENS_COOKIE_PATH = "/"
const LEGACY_AUTH_TOKENS_COOKIE_NAME = "one_browser_auth_tokens"
const AUTH_TOKEN_COOKIE_NAMES = [
  "access_token",
  "expires_in",
  "refresh_expires_in",
  "refresh_token",
  "token_type",
] as const
let memoryTokens: StoredAuthTokens | null = null

export function saveAuthTokens(payload: AuthTokenPayload) {
  const accessToken = payload.access_token
  const refreshToken = payload.refresh_token

  if (!accessToken || !refreshToken) {
    console.info("[auth-debug] save auth tokens rejected missing token", {
      accessToken,
      refreshToken,
      payload,
    })
    clearAuthTokens()
    return
  }

  const now = Date.now()
  const tokens: StoredAuthTokens = {
    accessToken,
    refreshToken,
    tokenType: normalizeTokenType(payload.token_type),
    accessExpiresAt: expiresAt(now, payload.expires_in),
    refreshExpiresAt: expiresAt(now, payload.refresh_expires_in),
  }

  memoryTokens = tokens
  writeAuthTokensCookie(tokens)
  removeLegacyAuthTokens()
  console.info("[auth-debug] saved auth tokens", {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenType: tokens.tokenType,
    accessExpiresAt: tokens.accessExpiresAt,
    refreshExpiresAt: tokens.refreshExpiresAt,
    payload,
  })
}

export function clearAuthTokens() {
  console.info("[auth-debug] clear auth tokens")
  memoryTokens = null
  deleteAuthTokensCookie()
  removeLegacyAuthTokens()
}

export function getAccessToken() {
  return readAuthTokens()?.accessToken ?? null
}

export function isAccessTokenStale(skewMs = 30_000) {
  const tokens = readAuthTokens()
  if (!tokens?.accessToken) {
    return true
  }

  return Boolean(
    tokens.accessExpiresAt && tokens.accessExpiresAt <= Date.now() + skewMs
  )
}

export function getRefreshToken() {
  const tokens = readAuthTokens()
  if (!tokens?.refreshToken) {
    return null
  }

  if (tokens.refreshExpiresAt && tokens.refreshExpiresAt <= Date.now()) {
    console.info("[auth-debug] refresh token expired in storage", {
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
      now: Date.now(),
    })
    clearAuthTokens()
    return null
  }

  return tokens.refreshToken
}

export function hasAuthTokens() {
  return Boolean(readAuthTokens())
}

function readAuthTokens() {
  if (memoryTokens) {
    return memoryTokens
  }

  const cookieTokens = readAuthTokensCookie()
  if (cookieTokens) {
    memoryTokens = cookieTokens
    removeLegacyAuthTokens()
    return cookieTokens
  }

  const legacyTokens = readLegacyAuthTokens()
  removeLegacyAuthTokens()
  if (legacyTokens) {
    memoryTokens = legacyTokens
    writeAuthTokensCookie(legacyTokens)
    return legacyTokens
  }

  return null
}

function writeAuthTokensCookie(tokens: StoredAuthTokens) {
  if (typeof document === "undefined") {
    return
  }

  const accessMaxAge = getRemainingSeconds(tokens.accessExpiresAt)
  const refreshMaxAge = getRemainingSeconds(tokens.refreshExpiresAt)

  writeCookie("access_token", tokens.accessToken ?? "", { maxAge: accessMaxAge })
  writeCookie("expires_in", serializeDuration(accessMaxAge), {
    maxAge: accessMaxAge,
  })
  writeCookie("refresh_expires_in", serializeDuration(refreshMaxAge), {
    maxAge: refreshMaxAge,
  })
  writeCookie("refresh_token", tokens.refreshToken ?? "", {
    maxAge: refreshMaxAge,
  })
  writeCookie("token_type", tokens.tokenType, {
    maxAge: refreshMaxAge,
  })
  deleteCookie(LEGACY_AUTH_TOKENS_COOKIE_NAME)
}

function readAuthTokensCookie() {
  const accessToken = readCookie("access_token")
  const refreshToken = readCookie("refresh_token")
  const hasSplitCookie = AUTH_TOKEN_COOKIE_NAMES.some((name) => readCookie(name))

  if (hasSplitCookie) {
    const tokens: StoredAuthTokens = {
      accessToken,
      refreshToken,
      tokenType: normalizeTokenType(readCookie("token_type")),
      accessExpiresAt: accessToken
        ? readJwtExpiresAt(accessToken) ??
          expiresAt(Date.now(), parseDurationCookie(readCookie("expires_in")))
        : null,
      refreshExpiresAt: refreshToken
        ? expiresAt(Date.now(), parseDurationCookie(readCookie("refresh_expires_in")))
        : null,
    }

    if (tokens.accessToken || tokens.refreshToken) {
      return tokens
    }

    deleteAuthTokensCookie()
    return null
  }

  return readLegacyAuthTokensCookie()
}

function readLegacyAuthTokensCookie() {
  const raw = readCookie(LEGACY_AUTH_TOKENS_COOKIE_NAME)
  if (!raw) {
    return null
  }

  try {
    const value: unknown = JSON.parse(raw)
    const tokens = normalizeStoredAuthTokens(value)
    if (tokens) {
      return tokens
    }
  } catch {
    // Invalid cookie data is cleared below.
  }

  deleteAuthTokensCookie()
  return null
}

function deleteAuthTokensCookie() {
  if (typeof document === "undefined") {
    return
  }

  AUTH_TOKEN_COOKIE_NAMES.forEach(deleteCookie)
  deleteCookie(LEGACY_AUTH_TOKENS_COOKIE_NAME)
}

function writeCookie(
  name: (typeof AUTH_TOKEN_COOKIE_NAMES)[number],
  value: string,
  options: { maxAge: number | null }
) {
  if (!value) {
    deleteCookie(name)
    return
  }

  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${AUTH_TOKENS_COOKIE_PATH}`,
    "SameSite=Lax",
  ]

  if (options.maxAge !== null) {
    attributes.push(`Max-Age=${options.maxAge}`)
  }
  if (window.location.protocol === "https:") {
    attributes.push("Secure")
  }
  document.cookie = attributes.join("; ")
}

function deleteCookie(name: string) {
  const attributes = [
    `${name}=`,
    `Path=${AUTH_TOKENS_COOKIE_PATH}`,
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ]

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attributes.push("Secure")
  }

  document.cookie = attributes.join("; ")
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null
  }

  const prefix = `${name}=`
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))

  if (!cookie) {
    return null
  }

  const value = cookie.slice(prefix.length)
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function readLegacyAuthTokens() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_AUTH_TOKENS_KEY)
    if (!raw) {
      return null
    }

    const value: unknown = JSON.parse(raw)
    return normalizeStoredAuthTokens(value)
  } catch {
    return null
  }
}

function removeLegacyAuthTokens() {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem(LEGACY_AUTH_TOKENS_KEY)
  } catch {
    // Nothing else to clear.
  }
}

function getRemainingSeconds(expiresAtValue: number | null) {
  if (!expiresAtValue) {
    return null
  }

  return Math.max(0, Math.floor((expiresAtValue - Date.now()) / 1000))
}

function serializeDuration(value: number | null) {
  return value === null ? "" : String(value)
}

function parseDurationCookie(value: string | null) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeTokenType(value: string | null | undefined) {
  return value?.trim() || "Bearer"
}

function readJwtExpiresAt(token: string) {
  const payload = token.split(".")[1]
  if (!payload) {
    return null
  }

  try {
    const json = JSON.parse(atob(toBase64(payload))) as { exp?: unknown }
    return typeof json.exp === "number" ? json.exp * 1000 : null
  } catch {
    return null
  }
}

function toBase64(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  return normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  )
}

function expiresAt(now: number, seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) {
    return null
  }

  return now + seconds * 1000
}

function normalizeStoredAuthTokens(value: unknown): StoredAuthTokens | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const tokens = value as StoredAuthTokens
  if (
    typeof tokens.accessToken === "string" &&
    typeof tokens.refreshToken === "string" &&
    isNullableNumber(tokens.accessExpiresAt) &&
    isNullableNumber(tokens.refreshExpiresAt)
  ) {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: normalizeTokenType(tokens.tokenType),
      accessExpiresAt: tokens.accessExpiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
    }
  }

  return null
}

function isNullableNumber(value: unknown) {
  return value === null || typeof value === "number"
}
