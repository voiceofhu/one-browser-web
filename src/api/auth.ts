import { buildQueryPath, http } from "@/lib/request"
import { clearAuthTokens } from "@/lib/auth-tokens"
import { getCurrentLocale, localizedPath, type Locale } from "@/local"

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

  const response = await http.post<
    {
      user: CurrentUser
      avatar: string
    }
  >("/auth/avatar", formData)
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
  code: string
  team_code: string
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

export function previewTeamInvite({ code, team_code }: TeamInviteLookup) {
  return http.get<TeamInvite>(
    buildQueryPath("/referrals/team-invite/check", {
      aff: code,
      team: team_code,
    })
  )
}

export function joinTeamInvite({ code, team_code }: TeamInviteLookup) {
  return http.post<TeamInvite>("/referrals/team-invite/join", {
    aff: code,
    team: team_code,
  })
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
    callbackUrl,
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
      accessToken: parsed.searchParams.get("access_token"),
      refreshToken: parsed.searchParams.get("refresh_token"),
      token: parsed.searchParams.get("token"),
      expiresIn: parsed.searchParams.get("expires_in"),
      refreshExpiresIn: parsed.searchParams.get("refresh_expires_in"),
      apiUrl: parsed.searchParams.get("api_url"),
      userId: parsed.searchParams.get("user_id"),
      userName: parsed.searchParams.get("user_name"),
    }
  } catch (error) {
    return { parseError: error instanceof Error ? error.message : String(error) }
  }
}

export function buildGoogleLoginUrl(redirect: string, locale?: Locale) {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_ID
  if (!clientId || typeof window === "undefined") {
    return null
  }

  const callbackPath = localizedPath(locale ?? getCurrentLocale(), "/oauth")
  const redirectUri = `${window.location.origin}${callbackPath}`
  const state = createGoogleOAuthState(redirect)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES,
    state,
    prompt: "select_account",
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
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
  const stored = readStoredGoogleOAuthState()
  clearGoogleOAuthState()

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
  try {
    window.sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, JSON.stringify(state))
  } catch {
    // The callback will fail closed if session storage is unavailable.
  }
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
