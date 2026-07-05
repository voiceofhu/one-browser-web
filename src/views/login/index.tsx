import { useCallback, useEffect } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { buildGoogleLoginUrl, isGoogleLoginEnabled } from "@/api/auth"
import { LoginForm } from "@/components/login-form"
import { useTranslation } from "@/components/providers/language-context"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import { isLoginPath, localizedPath, type Locale } from "@/local"
import { consumeAuthExpiredNotice } from "@/lib/request"
import { useCurrentUser, useLoginMutation } from "@/hooks/use-auth"
import { InteractiveGridBackground } from "./interactive-grid-background"

function normalizeRedirect(value: string | null, locale: Locale) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return localizedPath(locale, "/index")
  }

  const redirectPathname = value.split(/[?#]/)[0]
  if (isLoginPath(redirectPathname)) {
    return localizedPath(locale, "/index")
  }

  return `${localizedPath(locale, redirectPathname)}${value.slice(redirectPathname.length)}`
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const oauthError = searchParams.get("oauth_error")
  const { locale, t } = useTranslation()
  const redirectTo = normalizeRedirect(searchParams.get("redirect"), locale)
  const googleLoginEnabled = isGoogleLoginEnabled()
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined
  const loginMutation = useLoginMutation()
  const currentUser = useCurrentUser()
  const handleGoogleLogin = useCallback(() => {
    console.info("[auth-debug][google] login button clicked", {
      redirectTo,
    })
    const googleLoginUrl = buildGoogleLoginUrl(redirectTo)
    if (!googleLoginUrl) {
      toast.error(t("login.googleError"))
      return
    }

    window.location.assign(googleLoginUrl)
  }, [redirectTo, t])

  useEffect(() => {
    const authNotice = consumeAuthExpiredNotice()
    if (authNotice !== null) {
      toast.warning(t("auth.expired.title"), {
        description: authNotice || t("auth.expired.description"),
      })
    }
  }, [t])

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
          googleLoginEnabled={googleLoginEnabled}
          onGoogleLogin={handleGoogleLogin}
          turnstileSiteKey={turnstileSiteKey}
          onSubmit={async (values) => {
            await loginMutation.mutateAsync(values)
            navigate(redirectTo, { replace: true })
          }}
        />
      </section>
    </main>
  )
}
