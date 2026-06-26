import { useEffect, useMemo, useRef, useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import {
  buildAppAuthorizePath,
  buildGoogleLoginUrl,
} from "@/api/auth"
import { LoginForm } from "@/components/login-form"
import { useTranslation } from "@/components/providers/language-context"
import { Spinner } from "@/components/ui/spinner"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import { isLoginPath } from "@/local"
import { consumeAuthExpiredNotice } from "@/lib/request"
import {
  useAppAuthorizeMutation,
  useCurrentUser,
  useLoginMutation,
} from "@/hooks/use-auth"
import { AppAuthorizationSuccess } from "./app-authorization-success"
import { InteractiveGridBackground } from "./interactive-grid-background"

function normalizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/index"
  }

  const redirectPathname = value.split(/[?#]/)[0]
  if (isLoginPath(redirectPathname)) {
    return "/index"
  }

  return value
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAppLogin = searchParams.get("from") === "app"
  const redirectTo = normalizeRedirect(searchParams.get("redirect"))
  const oauthError = searchParams.get("oauth_error")
  const [appAuthorizationUrl, setAppAuthorizationUrl] = useState<string | null>(
    null
  )
  const appAuthorizationRequested = useRef(false)
  const googleLoginUrl = useMemo(
    () =>
      buildGoogleLoginUrl(isAppLogin ? buildAppAuthorizePath() : redirectTo),
    [isAppLogin, redirectTo]
  )
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined
  const loginMutation = useLoginMutation()
  const appAuthorizeMutation = useAppAuthorizeMutation()
  const currentUser = useCurrentUser()
  const { t } = useTranslation()

  useEffect(() => {
    const authNotice = consumeAuthExpiredNotice()
    if (authNotice !== null) {
      toast.warning(t("auth.expired.title"), {
        description: authNotice || t("auth.expired.description"),
      })
    }
  }, [t])

  useEffect(() => {
    if (
      !isAppLogin ||
      !currentUser.isSuccess ||
      appAuthorizationUrl ||
      appAuthorizationRequested.current ||
      appAuthorizeMutation.isPending
    ) {
      return
    }

    appAuthorizationRequested.current = true
    appAuthorizeMutation.mutate(undefined, {
      onSuccess: setAppAuthorizationUrl,
      onError: (error) =>
        toast.error(getErrorMessage(error, t("layout.actionFailed"))),
    })
  }, [
    appAuthorizationUrl,
    appAuthorizeMutation,
    currentUser.isSuccess,
    isAppLogin,
    t,
  ])

  if (appAuthorizationUrl) {
    return <AppAuthorizationSuccess appUrl={appAuthorizationUrl} />
  }

  if (isAppLogin && currentUser.isSuccess) {
    return (
      <main className="grid min-h-svh place-items-center bg-background text-muted-foreground">
        <InteractiveGridBackground />
        <Spinner className="relative z-10" />
      </main>
    )
  }

  if (currentUser.isSuccess) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <InteractiveGridBackground />
      <header className="relative z-10 flex items-center justify-end gap-1.5">
        <LanguageSwitcher />
        <ThemeToggleButton />
      </header>
      <section className="relative z-10 grid flex-1 place-items-center py-6 sm:py-8 lg:py-10">
        <LoginForm
          className="w-full max-w-[25rem]"
          isSubmitting={loginMutation.isPending}
          error={
            loginMutation.error ||
            (oauthError === "google" ? new Error(t("login.googleError")) : null)
          }
          googleLoginUrl={googleLoginUrl}
          turnstileSiteKey={turnstileSiteKey}
          onSubmit={async (values) => {
            await loginMutation.mutateAsync(values)
            if (isAppLogin) {
              const callbackUrl = await appAuthorizeMutation.mutateAsync()
              setAppAuthorizationUrl(callbackUrl)
              return
            }
            navigate(redirectTo, { replace: true })
          }}
        />
      </section>
    </main>
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
