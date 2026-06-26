export type AuthTokenPayload = {
  access_token: string
  refresh_token: string
  expires_in?: number
  refresh_expires_in?: number
}

type StoredAuthTokens = {
  accessToken: string
  refreshToken: string
  accessExpiresAt: number | null
  refreshExpiresAt: number | null
}

const AUTH_TOKENS_KEY = "one-browser:auth-tokens"
let memoryTokens: StoredAuthTokens | null = null

export function saveAuthTokens(payload: AuthTokenPayload) {
  const accessToken = payload.access_token
  const refreshToken = payload.refresh_token

  if (!accessToken || !refreshToken) {
    clearAuthTokens()
    return
  }

  const now = Date.now()
  const tokens: StoredAuthTokens = {
    accessToken,
    refreshToken,
    accessExpiresAt: expiresAt(now, payload.expires_in),
    refreshExpiresAt: expiresAt(now, payload.refresh_expires_in),
  }

  memoryTokens = tokens

  try {
    window.localStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens))
  } catch {
    // Keep the in-memory copy for browsers that block localStorage.
  }
}

export function clearAuthTokens() {
  memoryTokens = null

  try {
    window.localStorage.removeItem(AUTH_TOKENS_KEY)
  } catch {
    // Nothing else to clear.
  }
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
  if (!tokens) {
    return null
  }

  if (tokens.refreshExpiresAt && tokens.refreshExpiresAt <= Date.now()) {
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

  try {
    const raw = window.localStorage.getItem(AUTH_TOKENS_KEY)
    if (!raw) {
      return null
    }

    const value: unknown = JSON.parse(raw)
    if (!isStoredAuthTokens(value)) {
      clearAuthTokens()
      return null
    }

    memoryTokens = value
    return value
  } catch {
    return null
  }
}

function expiresAt(now: number, seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) {
    return null
  }

  return now + seconds * 1000
}

function isStoredAuthTokens(value: unknown): value is StoredAuthTokens {
  if (!value || typeof value !== "object") {
    return false
  }

  const tokens = value as StoredAuthTokens
  return (
    typeof tokens.accessToken === "string" &&
    typeof tokens.refreshToken === "string" &&
    isNullableNumber(tokens.accessExpiresAt) &&
    isNullableNumber(tokens.refreshExpiresAt)
  )
}

function isNullableNumber(value: unknown) {
  return value === null || typeof value === "number"
}
