import { useEffect, useState } from "react"
import { AlertTriangleIcon, HomeIcon } from "lucide-react"
import { useLocation, useNavigate, useSearchParams } from "react-router"

import { completeGoogleLogin, consumeGoogleOAuthState } from "@/api/auth"
import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { authQueryKeys } from "@/hooks/use-auth"
import { localizedPath, stripLocaleFromPathname } from "@/local"
import { saveAuthTokens } from "@/lib/auth-tokens"
import { shouldUseDocumentRedirect } from "@/lib/login-source"
import { useQueryClient } from "@tanstack/react-query"

type OAuthCallbackFailureStage =
  | "google_error"
  | "missing_params"
  | "state_rejected"
  | "backend_failed"

type OAuthCallbackFailure = {
  stage: OAuthCallbackFailureStage
  message?: string
}

function isAppAuthorizationRedirect(value: string) {
  const pathname = value.split(/[?#]/)[0]

  return stripLocaleFromPathname(pathname) === "/oauth/authorize"
}

const handledGoogleCallbackKeys = new Set<string>()

function buildGoogleCallbackKey(payload: {
  code: string | null
  state: string | null
  error: string | null
}) {
  return JSON.stringify([
    payload.code ?? "",
    payload.state ?? "",
    payload.error ?? "",
  ])
}

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { locale, t } = useTranslation()
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const [callbackError, setCallbackError] =
    useState<OAuthCallbackFailure | null>(null)

  useEffect(() => {
    const callbackKey = buildGoogleCallbackKey({ code, state, error })
    if (handledGoogleCallbackKeys.has(callbackKey)) {
      console.info("[auth-debug][google] callback duplicate effect skipped", {
        hasCode: Boolean(code),
        hasState: Boolean(state),
        statePrefix: state?.slice(0, 12) ?? "",
        error,
      })
      return
    }
    handledGoogleCallbackKeys.add(callbackKey)

    async function finishLogin() {
      console.info("[auth-debug][google] callback page loaded", {
        href: window.location.href,
        pathname: location.pathname,
        search: location.search,
        hasCode: Boolean(code),
        codeLength: code?.length ?? 0,
        hasState: Boolean(state),
        statePrefix: state?.slice(0, 12) ?? "",
        error,
      })

      if (error || !code || !state) {
        console.warn("[auth-debug][google] callback missing oauth params", {
          error,
          hasCode: Boolean(code),
          hasState: Boolean(state),
        })
        setCallbackError({
          stage: error ? "google_error" : "missing_params",
          message: error ?? undefined,
        })
        return
      }

      const redirect = consumeGoogleOAuthState(state)
      if (!redirect) {
        console.warn("[auth-debug][google] callback rejected oauth state", {
          statePrefix: state.slice(0, 12),
        })
        setCallbackError({
          stage: "state_rejected",
        })
        return
      }

      const redirectUri = `${window.location.origin}${location.pathname}`
      const requestPayload = {
        code,
        state,
        redirect_uri: redirectUri,
      }

      try {
        console.info("[auth-debug][google] callback posting to backend", {
          redirectUri,
          redirect,
          statePrefix: state.slice(0, 12),
        })
        const response = await completeGoogleLogin(requestPayload)
        console.info("[auth-debug][google] callback backend success", {
          hasAccessToken: Boolean(response.access_token),
          hasRefreshToken: Boolean(response.refresh_token),
          expiresIn: response.expires_in,
          refreshExpiresIn: response.refresh_expires_in,
          responseRedirect: response.redirect,
        })
        saveAuthTokens(response)

        await queryClient.invalidateQueries({
          queryKey: authQueryKeys.currentUser,
        })
        await queryClient.invalidateQueries({
          queryKey: authQueryKeys.permissions,
        })
        const nextRedirect =
          shouldUseDocumentRedirect(redirect) ||
          isAppAuthorizationRedirect(redirect)
            ? redirect
            : response.redirect || redirect
        console.info("[auth-debug][google] callback redirect resolved", {
          redirect,
          responseRedirect: response.redirect,
          nextRedirect,
          documentRedirect: shouldUseDocumentRedirect(nextRedirect),
        })

        if (shouldUseDocumentRedirect(nextRedirect)) {
          window.location.assign(nextRedirect)
          return
        }

        navigate(localizedPath(locale, nextRedirect), { replace: true })
      } catch (error) {
        console.error("[auth-debug][google] callback failed", {
          message: error instanceof Error ? error.message : String(error),
          error,
        })
        setCallbackError({
          stage: "backend_failed",
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    void finishLogin()
  }, [
    code,
    error,
    locale,
    location.pathname,
    location.search,
    navigate,
    queryClient,
    state,
  ])

  if (callbackError) {
    return (
      <main className="grid min-h-svh place-items-center bg-background px-4 py-8 text-foreground">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>{t("oauthCallback.failed")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 text-destructive">
              <AlertTriangleIcon className="mt-0.5 shrink-0" />
              <div className="flex min-w-0 flex-col gap-1">
                <div className="text-base leading-6 font-semibold">
                  {getFailureTitle(callbackError.stage, t)}
                </div>
                <div className="text-sm leading-6">
                  {getFailureMessage(callbackError, t)}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end px-4 py-2 sm:px-5">
            <Button
              type="button"
              size="sm"
              onClick={() =>
                navigate(localizedPath(locale, "/"), { replace: true })
              }
            >
              <HomeIcon data-icon="inline-start" />
              {t("oauthCallback.backToHome")}
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background px-4 text-muted-foreground">
      <div className="flex flex-col items-center gap-3 text-center">
        <Spinner />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            {t("oauthCallback.processing")}
          </p>
          <p className="text-xs">{t("oauthCallback.processingDescription")}</p>
        </div>
      </div>
    </main>
  )
}

function getFailureTitle(
  stage: OAuthCallbackFailureStage,
  t: ReturnType<typeof useTranslation>["t"]
) {
  switch (stage) {
    case "google_error":
      return t("oauthCallback.googleErrorTitle")
    case "missing_params":
      return t("oauthCallback.missingParamsTitle")
    case "state_rejected":
      return t("oauthCallback.stateRejectedTitle")
    case "backend_failed":
      return t("oauthCallback.backendFailedTitle")
  }
}

function getFailureMessage(
  failure: OAuthCallbackFailure,
  t: ReturnType<typeof useTranslation>["t"]
) {
  switch (failure.stage) {
    case "google_error":
      return failure.message || t("oauthCallback.googleErrorMessage")
    case "missing_params":
      return t("oauthCallback.missingParamsMessage")
    case "state_rejected":
      return t("oauthCallback.stateRejectedMessage")
    case "backend_failed":
      return (
        String(failure.message || "") || t("oauthCallback.backendFailedMessage")
      )
  }
}
