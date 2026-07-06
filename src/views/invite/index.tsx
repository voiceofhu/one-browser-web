import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { useTranslation } from "@/components/providers/language-context"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import { hasAuthTokens } from "@/lib/auth-tokens"
import { HttpError } from "@/lib/request"
import { localizedPath, localizedPublicPath, type Locale } from "@/local"
import { Spinner } from "@/components/ui/spinner"
import { useBindReferralMutation } from "@/hooks/use-auth"
import type { BindReferralResult } from "@/api/auth"
import { InteractiveGridBackground } from "@/views/login/interactive-grid-background"

const DEFAULT_HOME_REDIRECT = "/index"
const PENDING_REFERRAL_INVITE_KEY = "one-browser:pending-referral-invite"
type TranslationFn = ReturnType<typeof useTranslation>["t"]
type BindStatus = "binding" | "error" | "success"

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
  const [bindStatus, setBindStatus] = useState<BindStatus>("binding")
  const [bindMessage, setBindMessage] = useState<string | null>(null)
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
    setBindStatus("binding")
    setBindMessage(null)
    bindMutation.mutate(
      { aff, bound_method: "login" },
      {
        onSuccess: (result) => {
          handleBindResult(result, t)
          setBindStatus(result.success ? "success" : "error")
          setBindMessage(getBindResultMessage(result, t))
          redirectToApp(redirectTo)
        },
        onError: (error) => {
          autoBindRef.current = ""
          const message = getErrorMessage(error, t("invite.bindFailed"))
          setBindStatus("error")
          setBindMessage(message)
          toast.error(message)
          forgetReferralInvite()
          if (!(error instanceof HttpError && error.status === 401)) {
            redirectToApp(redirectTo)
          }
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
    return (
      <InviteStatusPage
        bindMessage={bindMessage}
        bindStatus={bindStatus}
        onContinue={() => redirectToApp(redirectTo)}
        t={t}
      />
    )
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
        <div className="flex w-full max-w-md flex-col gap-5 rounded-lg bg-card/85 px-6 py-6 text-card-foreground shadow-sm shadow-foreground/5 backdrop-blur sm:px-7">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-xl font-semibold tracking-normal">
              {t("invite.defaultTitle")}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("invite.defaultDescription")}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {loadError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {getErrorMessage(loadError, t("invite.loadFailed"))}
                </AlertDescription>
              </Alert>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => redirectToApp(redirectTo)}
            >
              <ArrowRightIcon data-icon="inline-start" />
              {t("invite.continue")}
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

function normalizeRedirect(value: string | null, locale: Locale) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return localizedPath(locale, DEFAULT_HOME_REDIRECT)
  }

  const redirectPathname = value.split(/[?#]/)[0]

  return `${localizedPath(locale, redirectPathname)}${value.slice(redirectPathname.length)}`
}

function redirectToApp(path: string) {
  window.location.assign(path)
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

function handleBindResult(result: BindReferralResult, t: TranslationFn) {
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
}

function getBindResultMessage(result: BindReferralResult, t: TranslationFn) {
  if (result.reason === "BOUND_SUCCESS") {
    return result.message ?? t("invite.bindSuccessDescription")
  }
  if (result.reason === "ALREADY_BOUND") {
    return result.message ?? t("invite.bindAlreadyBound")
  }
  if (result.reason === "CANNOT_INVITE_SELF") {
    return result.message ?? t("invite.selfInvite")
  }

  return result.message ?? t("invite.bindSkipped")
}

function InviteStatusPage({
  bindMessage,
  bindStatus,
  onContinue,
  t,
}: {
  bindMessage: string | null
  bindStatus: BindStatus
  onContinue: () => void
  t: TranslationFn
}) {
  const isBinding = bindStatus === "binding"
  const isSuccess = bindStatus === "success"
  const title = isBinding
    ? t("invite.bindingTitle")
    : isSuccess
      ? t("invite.bindSuccess")
      : t("invite.bindFailed")
  const description =
    bindMessage ??
    (isBinding
      ? t("invite.bindingDescription")
      : isSuccess
        ? t("invite.bindSuccessDescription")
        : t("invite.bindFailedDescription"))

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
        <div className="flex w-full max-w-md flex-col gap-5 rounded-lg bg-card/85 px-6 py-6 text-card-foreground shadow-sm shadow-foreground/5 backdrop-blur sm:max-w-sm sm:px-7">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="grid size-10 place-items-center rounded-full bg-muted text-foreground">
              {isBinding ? (
                <Spinner className="size-5" />
              ) : isSuccess ? (
                <CheckCircle2Icon className="size-5 text-green-600" />
              ) : (
                <AlertTriangleIcon className="size-5 text-destructive" />
              )}
            </div>
            <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="w-full sm:flex-1"
              disabled={isBinding}
              onClick={onContinue}
            >
              <ArrowRightIcon data-icon="inline-start" />
              {t("invite.continue")}
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
