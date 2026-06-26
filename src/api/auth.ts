import { http } from "@/lib/request"
import { clearAuthTokens } from "@/lib/auth-tokens"

import type {
  AuthPermissions,
  CurrentUserEnvelope,
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

type AppAuthorizationResponse = {
  callback_url?: string
  callbackUrl?: string
  redirect?: string
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_OAUTH_SCOPES = "openid email profile"
const GOOGLE_OAUTH_STATE_KEY = "one-browser:google-oauth-state"
export const APP_AUTHORIZE_PATH = "/auth/app/authorize"

export async function getCurrentUser() {
  const response = await http.get<CurrentUserEnvelope>("/auth/me")
  return response.user
}

export async function updateCurrentUserProfile(
  payload: UpdateCurrentUserProfilePayload
) {
  const response = await http.put<CurrentUserEnvelope>("/auth/me", payload)
  return response.user
}

export async function uploadCurrentUserAvatar(file: File) {
  const formData = new FormData()
  formData.set("file", file)

  const response = await http.post<
    CurrentUserEnvelope & {
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

export function previewTeamInvite(token: string) {
  return http.get<TeamInvite>(`/auth/team-invites/${encodeURIComponent(token)}`)
}

export function joinTeamInvite(token: string) {
  return http.post<TeamInvite>(
    `/auth/team-invites/${encodeURIComponent(token)}/join`
  )
}

export function buildAppAuthorizePath() {
  return APP_AUTHORIZE_PATH
}

export async function authorizeApp() {
  const response = await http.post<AppAuthorizationResponse>(APP_AUTHORIZE_PATH)
  const callbackUrl =
    response.callback_url ?? response.callbackUrl ?? response.redirect

  if (!callbackUrl) {
    throw new Error("Missing app authorization callback URL")
  }

  return callbackUrl
}

export function buildGoogleLoginUrl(redirect: string) {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_ID
  if (!clientId || typeof window === "undefined") {
    return null
  }

  const callbackPath = "/oauth"
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
  const normalizedRedirect = redirect || "/index"
  storeGoogleOAuthState({ nonce, redirect: normalizedRedirect })
  return `${nonce}.${encodeURIComponent(normalizedRedirect)}`
}

function parseGoogleOAuthState(state: string): GoogleOAuthState | null {
  const [nonce, redirect] = state.split(".", 2)
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

function createNonce() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  )
}
