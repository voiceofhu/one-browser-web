import { useEffect, useState } from "react"
import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router"

import {
  authorizeApp,
  completeGoogleLogin,
  consumeGoogleOAuthState,
} from "@/api/auth"
import { useLanguage } from "@/components/providers/language-context"
import { Spinner } from "@/components/ui/spinner"
import { authQueryKeys } from "@/hooks/use-auth"
import { localizedPath, localizedPublicPath } from "@/local"
import { saveAuthTokens } from "@/lib/auth-tokens"
import { isAppRedirect } from "@/lib/app-redirect"
import { AppAuthorizationSuccess } from "./app-authorization-success"
import { useQueryClient } from "@tanstack/react-query"

function buildLoginPath(locale: string, redirect?: string | null) {
  const params = new URLSearchParams({ oauth_error: "google" })
  if (redirect) {
    params.set("redirect", redirect)
  }

  return `${localizedPublicPath(locale, "login")}?${params.toString()}`
}

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { locale } = useLanguage()
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const [appAuthorizationUrl, setAppAuthorizationUrl] = useState<string | null>(
    null
  )

  useEffect(() => {
    let cancelled = false

    async function finishLogin() {
      if (error || !code || !state) {
        navigate(buildLoginPath(locale), { replace: true })
        return
      }

      const redirect = consumeGoogleOAuthState(state)
      if (!redirect) {
        navigate(buildLoginPath(locale), { replace: true })
        return
      }

      try {
        const redirectUri = `${window.location.origin}${location.pathname}`
        const response = await completeGoogleLogin({
          code,
          state,
          redirect_uri: redirectUri,
        })
        saveAuthTokens(response)

        if (cancelled) {
          return
        }

        await queryClient.invalidateQueries({
          queryKey: authQueryKeys.currentUser,
        })
        await queryClient.invalidateQueries({
          queryKey: authQueryKeys.permissions,
        })
        const nextRedirect = response.redirect || redirect
        if (isAppRedirect(nextRedirect)) {
          const callbackUrl = await authorizeApp()
          if (!cancelled) {
            setAppAuthorizationUrl(callbackUrl)
          }
          return
        }

        if (shouldUseDocumentRedirect(nextRedirect)) {
          window.location.assign(nextRedirect)
          return
        }

        navigate(localizedPath(locale, nextRedirect), { replace: true })
      } catch {
        if (!cancelled) {
          navigate(buildLoginPath(locale, redirect), { replace: true })
        }
      }
    }

    void finishLogin()

    return () => {
      cancelled = true
    }
  }, [code, error, locale, location.pathname, navigate, queryClient, state])

  if (appAuthorizationUrl) {
    return <AppAuthorizationSuccess appUrl={appAuthorizationUrl} />
  }

  if (!code && !error) {
    return <Navigate to={buildLoginPath(locale)} replace />
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background text-muted-foreground">
      <Spinner />
    </main>
  )
}

function shouldUseDocumentRedirect(value: string) {
  return value.startsWith("/api/") || /^[a-z][a-z0-9+.-]*:/i.test(value)
}
