import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Navigate, useLocation, useNavigate } from "react-router"

import { APP_NAME } from "@/app"
import { authorizeApp } from "@/api/auth"
import { useTranslation } from "@/components/providers/language-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/turnstile-widget"
import { authQueryKeys, useCurrentUser } from "@/hooks/use-auth"
import { localizedPublicPath } from "@/local"
import { isUnauthorizedError, markAuthRedirectNotice } from "@/lib/request"
import { clearAuthTokens } from "@/lib/auth-tokens"
import { cn } from "@/lib/utils"
import {
  AppAuthorizationPending,
  AppAuthorizationSuccess,
} from "./app-authorization-success"
import { InteractiveGridBackground } from "./interactive-grid-background"

export default function OAuthAuthorizationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { locale, t } = useTranslation()
  const currentUser = useCurrentUser()
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const authorizeInFlightRef = useRef(false)
  const authorizationRequestIdRef = useRef(0)
  const submittedAuthorizationKeyRef = useRef("")
  const loginRedirectedRef = useRef(false)
  const [turnstileToken, setTurnstileToken] = useState("")
  const [appAuthorizationUrl, setAppAuthorizationUrl] = useState<string | null>(
    null
  )
  const [authorizationError, setAuthorizationError] = useState("")
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined
  const authorizationSource = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get("from")?.trim() ?? ""
  }, [location.search])
  const hasAuthorizationSource = Boolean(authorizationSource)
  const loginRedirect = `${location.pathname}${location.search}${location.hash}`
  const loginPath = `${localizedPublicPath(locale, "login")}?redirect=${encodeURIComponent(loginRedirect)}`

  const redirectToLogin = useCallback(() => {
    if (loginRedirectedRef.current) {
      return
    }

    loginRedirectedRef.current = true
    clearAuthTokens()
    queryClient.removeQueries({ queryKey: authQueryKeys.all })
    markAuthRedirectNotice(t("appAuth.loginRequiredToast"))
    navigate(loginPath, { replace: true })
  }, [loginPath, navigate, queryClient, t])

  const handleTurnstileError = useCallback(() => {
    setAuthorizationError(t("login.turnstileLoadFailed"))
  }, [t])

  useEffect(() => {
    if (isUnauthorizedError(currentUser.error)) {
      redirectToLogin()
    }
  }, [currentUser.error, redirectToLogin])

  useEffect(() => {
    if (
      !turnstileSiteKey ||
      !currentUser.isSuccess ||
      !authorizationSource ||
      !turnstileToken ||
      authorizeInFlightRef.current ||
      appAuthorizationUrl
    ) {
      return
    }

    const authorizationKey = `${authorizationSource}\n${turnstileToken}`
    if (submittedAuthorizationKeyRef.current === authorizationKey) {
      return
    }

    const requestId = authorizationRequestIdRef.current + 1
    authorizationRequestIdRef.current = requestId
    submittedAuthorizationKeyRef.current = authorizationKey
    authorizeInFlightRef.current = true
    setIsAuthorizing(true)
    setAuthorizationError("")

    authorizeApp({ from: authorizationSource, turnstile_token: turnstileToken })
      .then((callbackUrl) => {
        if (authorizationRequestIdRef.current === requestId) {
          setAppAuthorizationUrl(callbackUrl)
        }
      })
      .catch((error) => {
        if (authorizationRequestIdRef.current === requestId) {
          submittedAuthorizationKeyRef.current = ""
          if (isUnauthorizedError(error)) {
            redirectToLogin()
            return
          }

          setAuthorizationError(
            getErrorMessage(error, t("appAuth.authorizationFailed"))
          )
          turnstileRef.current?.reset()
        }
      })
      .finally(() => {
        if (authorizationRequestIdRef.current === requestId) {
          authorizeInFlightRef.current = false
          setIsAuthorizing(false)
        }
      })
  }, [
    appAuthorizationUrl,
    authorizationSource,
    currentUser.isSuccess,
    redirectToLogin,
    t,
    turnstileToken,
    turnstileSiteKey,
  ])

  if (!hasAuthorizationSource) {
    return <Navigate to={localizedPublicPath(locale, "login")} replace />
  }

  if (appAuthorizationUrl) {
    return <AppAuthorizationSuccess appUrl={appAuthorizationUrl} />
  }

  if (currentUser.isLoading || currentUser.isFetching || isAuthorizing) {
    return <AppAuthorizationPending />
  }

  if (isUnauthorizedError(currentUser.error)) {
    return <AppAuthorizationPending />
  }

  if (currentUser.isError) {
    return (
      <AuthorizationShell>
        <AuthorizationCard
          error={getErrorMessage(currentUser.error, t("layout.actionFailed"))}
        />
      </AuthorizationShell>
    )
  }

  return (
    <AuthorizationShell>
      <AuthorizationCard
        className={isAuthorizing ? "pointer-events-none opacity-75" : undefined}
        error={
          authorizationError ||
          (!turnstileSiteKey ? t("appAuth.turnstileSiteKeyMissing") : "")
        }
      >
        {turnstileSiteKey ? (
          <TurnstileWidget
            ref={turnstileRef}
            siteKey={turnstileSiteKey}
            action="app_authorize"
            appearance="always"
            loadingLabel={t("login.turnstileLoading")}
            onTokenChange={setTurnstileToken}
            onError={handleTurnstileError}
          />
        ) : null}
      </AuthorizationCard>
    </AuthorizationShell>
  )
}

function AuthorizationShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <InteractiveGridBackground />
      <section className="relative z-10 grid flex-1 place-items-center py-8 sm:py-10 lg:py-12">
        {children}
      </section>
    </main>
  )
}

function AuthorizationCard({
  children,
  className,
  error,
}: {
  children?: ReactNode
  className?: string
  error?: string
}) {
  const { t } = useTranslation()

  return (
    <Card
      className={cn("w-full max-w-md border-border/80 bg-card/95", className)}
    >
      <CardHeader className="items-center gap-2 px-8 pt-8 text-center">
        <CardTitle className="text-2xl font-semibold tracking-normal">
          {t("appAuth.verifyTitle")}
        </CardTitle>
        <CardDescription className="text-base leading-7">
          {t("appAuth.verifyDescription", { appName: APP_NAME })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 px-8 pb-8 text-center">
        {children}
        <p className="text-sm text-muted-foreground">
          {t("appAuth.verifyHint")}
        </p>
        {error ? (
          <Alert variant="destructive" className="text-left">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return fallback
}
