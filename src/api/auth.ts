import { buildQueryPath, http } from "@/lib/request"
import { clearAuthTokens } from "@/lib/auth-tokens"
import { getCurrentLocale, localizedPath } from "@/local"

import type {
  AuthPermissions,
  CurrentUser,
  LoginResponse,
  SexFlag,
  TeamInvite,
} from "@/types/admin"

export type UpdateCurrentUserProfilePayload = {
  nick_name: string
  email: string
  phone_number: string
  sex: SexFlag
  avatar: string
}

export type ChangeCurrentUserPasswordPayload = {
  old_password: string
  new_password: string
}

type GoogleOAuthState = {
  nonce: string
  redirect: string
}

export type GoogleOAuthCallbackResponse = LoginResponse & {
  redirect: string
}

export type AppAuthorizationPayload = {
  from?: string
  turnstile_token?: string
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_OAUTH_SCOPES = "openid email profile"
const GOOGLE_OAUTH_STATE_KEY = "one-browser:google-oauth-state"
const GOOGLE_OAUTH_STATE_COOKIE_NAME = "one_browser_google_oauth_state"
const GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60
const GOOGLE_OAUTH_CALLBACK_PATH = "/oauth/google"
export const APP_AUTHORIZE_PATH = "/auth/app/authorize"
const APP_CALLBACK_PROTOCOLS = ["one-browser:"] as const
const APP_CALLBACK_HOST = "auth"
const APP_CALLBACK_PATH = "/callback"
const REQUIRED_APP_CALLBACK_PARAMS = [
  "access_token",
  "refresh_token",
  "expires_in",
  "refresh_expires_in",
] as const

export function isGoogleLoginEnabled() {
  return Boolean(import.meta.env.VITE_GOOGLE_OAUTH_ID)
}

export async function getCurrentUser() {
  return http.get<CurrentUser>("/auth/me")
}

export async function updateCurrentUserProfile(
  payload: UpdateCurrentUserProfilePayload
) {
  return http.put<CurrentUser>("/auth/me", payload)
}

export async function uploadCurrentUserAvatar(file: File) {
  const formData = new FormData()
  formData.set("file", file)

  const response = await http.post<{
    user: CurrentUser
    avatar: string
  }>("/auth/avatar", formData)
  return response.user
}

export function changeCurrentUserPassword(
  payload: ChangeCurrentUserPasswordPayload
) {
  return http.put<void>("/auth/password", payload)
}

export function getAuthPermissions() {
  return http.get<AuthPermissions>("/auth/permissions")
}

export function login(payload: {
  username: string
  password: string
  turnstile_token?: string
}) {
  return http.post<LoginResponse>("/auth/login", payload)
}

export type TeamInviteLookup = {
  token: string
}

export type ReferralCodeCheck = {
  valid: boolean
  reason:
    | "OK"
    | "EMPTY_CODE"
    | "INVALID_CODE"
    | "REVOKED"
    | "DISABLED"
    | "EXPIRED"
    | "USAGE_LIMIT"
  code?: string | null
  message?: string
}

export type BindReferralPayload = {
  aff: string
  bound_method?: "signup" | "login" | "manual" | "admin"
}

export type BindReferralResult = {
  success: boolean
  reason:
    | "BOUND_SUCCESS"
    | "ALREADY_BOUND"
    | "NO_CODE"
    | "INVALID_CODE"
    | "REVOKED"
    | "DISABLED"
    | "EXPIRED"
    | "USAGE_LIMIT"
    | "CANNOT_INVITE_SELF"
  relation_id?: number | null
  message?: string
}

export function previewTeamInvite({ token }: TeamInviteLookup) {
  return http.get<TeamInvite>(
    buildQueryPath("/referrals/team-invite/check", { token })
  )
}

export function acceptTeamInvite({ token }: TeamInviteLookup) {
  return http.post<TeamInvite>("/referrals/team-invite/accept", { token })
}

export function declineTeamInvite({ token }: TeamInviteLookup) {
  return http.post<TeamInvite>("/referrals/team-invite/decline", { token })
}

export function checkReferralCode(aff: string) {
  return http.get<ReferralCodeCheck>(
    buildQueryPath("/referral-codes/check", { aff })
  )
}

export function bindReferral(payload: BindReferralPayload) {
  return http.post<BindReferralResult>("/referrals/bind", payload)
}

export async function authorizeApp(payload: AppAuthorizationPayload = {}) {
  console.info("[auth-debug] authorize app request", payload)
  const callbackUrl = await http.post<string>(APP_AUTHORIZE_PATH, payload)
  console.info("[auth-debug] authorize app response", {
    hasCallbackUrl: Boolean(callbackUrl),
    callbackParams: describeAppCallbackUrl(callbackUrl),
  })

  if (!callbackUrl) {
    throw new Error("Missing app authorization callback URL")
  }
  if (!isCompleteAppCallbackUrl(callbackUrl)) {
    throw new Error("Incomplete app authorization callback URL")
  }

  return callbackUrl
}

function describeAppCallbackUrl(callbackUrl: string) {
  try {
    const parsed = new URL(callbackUrl)
    return {
      hasAccessToken: Boolean(parsed.searchParams.get("access_token")),
      hasRefreshToken: Boolean(parsed.searchParams.get("refresh_token")),
      hasToken: Boolean(parsed.searchParams.get("token")),
      expiresIn: parsed.searchParams.get("expires_in"),
      refreshExpiresIn: parsed.searchParams.get("refresh_expires_in"),
      apiUrl: parsed.searchParams.get("api_url"),
      userId: parsed.searchParams.get("user_id"),
      userName: parsed.searchParams.get("user_name"),
    }
  } catch (error) {
    return {
      parseError: error instanceof Error ? error.message : String(error),
    }
  }
}

export function buildGoogleLoginUrl(redirect: string) {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_ID
  if (!clientId || typeof window === "undefined") {
    console.warn("[auth-debug][google] build login url skipped", {
      hasClientId: Boolean(clientId),
      hasWindow: typeof window !== "undefined",
      redirect,
    })
    return null
  }

  const redirectUri = buildGoogleOAuthRedirectUri()
  const state = createGoogleOAuthState(redirect)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES,
    state,
    prompt: "select_account",
  })

  console.info("[auth-debug][google] build login url", {
    currentOrigin: window.location.origin,
    publicUrlEnv: import.meta.env.VITE_APP_PUBLIC_URL || "",
    redirectUri,
    redirect,
    statePrefix: state.slice(0, 12),
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

function buildGoogleOAuthRedirectUri() {
  const publicUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : import.meta.env.VITE_APP_PUBLIC_URL?.trim()

  return `${(publicUrl || "").replace(/\/+$/, "")}${GOOGLE_OAUTH_CALLBACK_PATH}`
}

export function completeGoogleLogin(payload: {
  code: string
  state: string
  redirect_uri: string
}) {
  return http.post<GoogleOAuthCallbackResponse>(
    "/auth/google/callback",
    payload
  )
}

export function consumeGoogleOAuthState(state: string) {
  const parsed = parseGoogleOAuthState(state)
  const sessionState = readStoredGoogleOAuthState()
  const cookieState = readStoredGoogleOAuthStateCookie()
  const stored = sessionState ?? cookieState
  clearGoogleOAuthState()

  console.info("[auth-debug][google] consume oauth state", {
    incomingStatePrefix: state.slice(0, 12),
    parsed: Boolean(parsed),
    parsedNoncePrefix: parsed?.nonce.slice(0, 8) ?? "",
    parsedRedirect: parsed?.redirect ?? "",
    hasSessionState: Boolean(sessionState),
    hasCookieState: Boolean(cookieState),
    storedNoncePrefix: stored?.nonce.slice(0, 8) ?? "",
    nonceMatched: Boolean(parsed && stored && parsed.nonce === stored.nonce),
  })

  if (!parsed || !stored || parsed.nonce !== stored.nonce) {
    return null
  }

  return parsed.redirect
}

export async function logout() {
  await http.post<void>("/auth/logout")
  clearAuthTokens()
}

function createGoogleOAuthState(redirect: string) {
  const nonce = createNonce()
  const normalizedRedirect =
    redirect || localizedPath(getCurrentLocale(), "/index")
  storeGoogleOAuthState({ nonce, redirect: normalizedRedirect })
  console.info("[auth-debug][google] created oauth state", {
    noncePrefix: nonce.slice(0, 8),
    redirect: normalizedRedirect,
  })
  return `${nonce}.${encodeURIComponent(normalizedRedirect)}`
}

function parseGoogleOAuthState(state: string): GoogleOAuthState | null {
  const separatorIndex = state.indexOf(".")
  if (separatorIndex <= 0) {
    return null
  }

  const nonce = state.slice(0, separatorIndex)
  const redirect = state.slice(separatorIndex + 1)
  if (!nonce || !redirect) {
    return null
  }

  try {
    return { nonce, redirect: decodeURIComponent(redirect) }
  } catch {
    return null
  }
}

function storeGoogleOAuthState(state: GoogleOAuthState) {
  let sessionStored = false
  try {
    window.sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, JSON.stringify(state))
    sessionStored = true
  } catch {
    // The cookie fallback below keeps the OAuth callback recoverable.
  }
  const cookieStored = writeGoogleOAuthStateCookie(state)
  console.info("[auth-debug][google] stored oauth state", {
    noncePrefix: state.nonce.slice(0, 8),
    redirect: state.redirect,
    sessionStored,
    cookieStored,
  })
}

function readStoredGoogleOAuthState() {
  try {
    const raw = window.sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY)
    if (!raw) {
      return null
    }

    const value: unknown = JSON.parse(raw)
    if (
      value &&
      typeof value === "object" &&
      typeof (value as GoogleOAuthState).nonce === "string" &&
      typeof (value as GoogleOAuthState).redirect === "string"
    ) {
      return value as GoogleOAuthState
    }
  } catch {
    // Invalid state is handled as an OAuth failure by the caller.
  }

  return null
}

function clearGoogleOAuthState() {
  try {
    window.sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY)
  } catch {
    // Nothing else to clean up.
  }
  deleteGoogleOAuthStateCookie()
}

function writeGoogleOAuthStateCookie(state: GoogleOAuthState) {
  if (typeof document === "undefined") {
    return false
  }

  document.cookie = [
    `${GOOGLE_OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(state))}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS}`,
    window.location.protocol === "https:" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ")
  return true
}

function readStoredGoogleOAuthStateCookie() {
  if (typeof document === "undefined") {
    return null
  }

  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GOOGLE_OAUTH_STATE_COOKIE_NAME}=`))
    ?.slice(GOOGLE_OAUTH_STATE_COOKIE_NAME.length + 1)

  if (!raw) {
    return null
  }

  try {
    const value: unknown = JSON.parse(decodeURIComponent(raw))
    if (
      value &&
      typeof value === "object" &&
      typeof (value as GoogleOAuthState).nonce === "string" &&
      typeof (value as GoogleOAuthState).redirect === "string"
    ) {
      return value as GoogleOAuthState
    }
  } catch {
    // Invalid state is handled as an OAuth failure by the caller.
  }

  return null
}

function deleteGoogleOAuthStateCookie() {
  if (typeof document === "undefined") {
    return
  }

  document.cookie = [
    `${GOOGLE_OAUTH_STATE_COOKIE_NAME}=`,
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    window.location.protocol === "https:" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ")
}

function isCompleteAppCallbackUrl(value: string) {
  try {
    const url = new URL(value)
    if (!isSupportedAuthorizationCallbackUrl(url)) {
      return false
    }

    return REQUIRED_APP_CALLBACK_PARAMS.every((key) =>
      Boolean(url.searchParams.get(key)?.trim())
    )
  } catch {
    return false
  }
}

function isSupportedAuthorizationCallbackUrl(url: URL) {
  if (url.protocol === "http:" || url.protocol === "https:") {
    return true
  }

  return (
    APP_CALLBACK_PROTOCOLS.includes(
      url.protocol as (typeof APP_CALLBACK_PROTOCOLS)[number]
    ) &&
    url.hostname === APP_CALLBACK_HOST &&
    url.pathname === APP_CALLBACK_PATH
  )
}

function createNonce() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  )
}
