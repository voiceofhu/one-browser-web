import { ArrowRightIcon } from "lucide-react"
import { useEffect, useRef } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { useTranslation } from "@/components/providers/language-context"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import { hasAuthTokens } from "@/lib/auth-tokens"
import { HttpError } from "@/lib/request"
import { localizedPath, localizedPublicPath, type Locale } from "@/local"
import { RouteLoading } from "@/router/route-loading"
import { useBindReferralMutation } from "@/hooks/use-auth"
import type { BindReferralResult } from "@/api/auth"
import { InteractiveGridBackground } from "@/views/login/interactive-grid-background"

const DEFAULT_TEAM_REDIRECT = "/browser/team"
const PENDING_REFERRAL_INVITE_KEY = "one-browser:pending-referral-invite"
type TranslationFn = ReturnType<typeof useTranslation>["t"]

export default function InvitePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { locale, t } = useTranslation()
  const aff = searchParams.get("aff")?.trim() ?? ""
  const hasInvite = Boolean(aff)
  const redirectTo = normalizeRedirect(searchParams.get("redirect"), locale)
  const bindMutation = useBindReferralMutation()
  const autoBindRef = useRef("")
  const isLoggedIn = hasAuthTokens()
  const currentInvitePath = `${location.pathname}${location.search}${location.hash}`
  const loginPath = `${localizedPublicPath(locale, "login")}?redirect=${encodeURIComponent(currentInvitePath)}`
  const loadError = hasInvite ? null : new Error(t("invite.missingToken"))

  useEffect(() => {
    if (!hasInvite) {
      return
    }

    rememberReferralInvite(aff, currentInvitePath)

    if (!isLoggedIn) {
      navigate(loginPath, { replace: true })
      return
    }

    if (bindMutation.isPending || autoBindRef.current === aff) {
      return
    }

    autoBindRef.current = aff
    bindMutation.mutate(
      { aff, bound_method: "login" },
      {
        onSuccess: (result) => handleBindResult(result, t, navigate, redirectTo),
        onError: (error) => {
          autoBindRef.current = ""
          toast.error(getErrorMessage(error, t("invite.bindFailed")))
          forgetReferralInvite()
          navigate(redirectTo, { replace: true })
        },
      }
    )
  }, [
    aff,
    bindMutation,
    currentInvitePath,
    hasInvite,
    isLoggedIn,
    loginPath,
    navigate,
    redirectTo,
    t,
  ])

  if (hasInvite) {
    return <RouteLoading />
  }

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <InteractiveGridBackground />
      <header className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/pwa-512x512.png" alt="" className="size-8 rounded-lg" />
          <span className="truncate text-sm font-semibold">
            {t("brand.name")}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggleButton />
        </div>
      </header>

      <section className="relative z-10 grid flex-1 place-items-center py-8 sm:py-10 lg:py-12">
        <Card className="w-full max-w-lg border-border/80 bg-card/95">
          <CardHeader className="gap-2 px-8 pt-8 text-center">
            <CardTitle className="text-2xl font-semibold tracking-normal">
              {t("invite.defaultTitle")}
            </CardTitle>
            <CardDescription className="text-base leading-7">
              {t("invite.defaultDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-8">
            {loadError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {getErrorMessage(loadError, t("invite.loadFailed"))}
                </AlertDescription>
              </Alert>
            ) : null}

          </CardContent>
          <CardFooter className="flex flex-col gap-2 bg-transparent px-8 pb-8 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => navigate(redirectTo, { replace: true })}
            >
              <ArrowRightIcon data-icon="inline-start" />
              {t("invite.continue")}
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

function normalizeRedirect(value: string | null, locale: Locale) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return localizedPath(locale, DEFAULT_TEAM_REDIRECT)
  }

  const redirectPathname = value.split(/[?#]/)[0]

  return `${localizedPath(locale, redirectPathname)}${value.slice(redirectPathname.length)}`
}

function rememberReferralInvite(aff: string, path: string) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.setItem(
      PENDING_REFERRAL_INVITE_KEY,
      JSON.stringify({
        aff,
        path,
        createdAt: Date.now(),
      })
    )
  } catch {
    // Redirect carries the same invite path, so storage is only a fallback.
  }
}

function forgetReferralInvite() {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.removeItem(PENDING_REFERRAL_INVITE_KEY)
  } catch {
    // The invite redirect has already been resolved.
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : fallback
}

function handleBindResult(
  result: BindReferralResult,
  t: TranslationFn,
  navigate: ReturnType<typeof useNavigate>,
  redirectTo: string
) {
  forgetReferralInvite()
  if (result.reason === "BOUND_SUCCESS") {
    toast.success(t("invite.bindSuccess"))
  } else if (result.reason === "ALREADY_BOUND") {
    toast.message(t("invite.bindAlreadyBound"))
  } else if (result.reason === "CANNOT_INVITE_SELF") {
    toast.message(t("invite.selfInvite"))
  } else {
    toast.message(result.message ?? t("invite.bindSkipped"))
  }
  navigate(redirectTo, { replace: true })
}
