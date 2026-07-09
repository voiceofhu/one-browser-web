import {
  ArrowRightIcon,
  CheckIcon,
  Clock3Icon,
  LogInIcon,
  MailIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react"
import type React from "react"
import { useEffect } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { buildGoogleLoginUrl, isGoogleLoginEnabled } from "@/api/auth"
import { useTranslation } from "@/components/providers/language-context"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import {
  useAcceptTeamInviteMutation,
  useDeclineTeamInviteMutation,
  useTeamInviteQuery,
} from "@/hooks/use-auth"
import { hasAuthTokens } from "@/lib/auth-tokens"
import { HttpError } from "@/lib/request"
import { localizedPath, localizedPublicPath, type Locale } from "@/local"
import type { TeamInvite } from "@/types/admin"
import { InteractiveGridBackground } from "@/views/login/interactive-grid-background"

const DEFAULT_TEAM_REDIRECT = "/browser/team"

export default function TeamInvitePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { locale, t } = useTranslation()
  const token = searchParams.get("token")?.trim() ?? ""
  const redirectTo = normalizeRedirect(searchParams.get("redirect"), locale)
  const inviteQuery = useTeamInviteQuery({ token })
  const acceptMutation = useAcceptTeamInviteMutation()
  const declineMutation = useDeclineTeamInviteMutation()
  const isLoggedIn = hasAuthTokens()
  const googleLoginEnabled = isGoogleLoginEnabled()
  const currentInvitePath = `${location.pathname}${location.search}${location.hash}`
  const loginPath = `${localizedPublicPath(locale, "login")}?redirect=${encodeURIComponent(currentInvitePath)}`
  const invite = inviteQuery.data
  const canRespond = Boolean(token && invite && invite.status === "pending")
  const isMutating = acceptMutation.isPending || declineMutation.isPending

  useEffect(() => {
    if (invite?.status === "accepted") {
      navigate(redirectTo, { replace: true })
    }
  }, [invite?.status, navigate, redirectTo])

  function requireLoginOrRun(action: () => void) {
    if (!isLoggedIn) {
      navigate(loginPath, { replace: true })
      return
    }
    action()
  }

  function acceptInvite() {
    requireLoginOrRun(() => {
      if (!token || !invite) {
        return
      }

      acceptMutation.mutate(
        { token },
        {
          onSuccess: (result) => {
            toast.success(t("teamInvite.acceptSuccess"), {
              description: t("teamInvite.acceptSuccessDescription", {
                team: result.team_name,
              }),
            })
            navigate(redirectTo, { replace: true })
          },
          onError: (error) => {
            toast.error(getErrorMessage(error, t("teamInvite.acceptFailed")))
          },
        }
      )
    })
  }

  function handleGoogleLogin() {
    const googleLoginUrl = buildGoogleLoginUrl(currentInvitePath)
    if (!googleLoginUrl) {
      toast.error(t("login.googleError"))
      return
    }

    window.location.assign(googleLoginUrl)
  }

  function declineInvite() {
    requireLoginOrRun(() => {
      if (!token || !invite) {
        return
      }

      declineMutation.mutate(
        { token },
        {
          onSuccess: (result) => {
            toast.message(t("teamInvite.declineSuccess"), {
              description: t("teamInvite.declineSuccessDescription", {
                team: result.team_name,
              }),
            })
            navigate(redirectTo, { replace: true })
          },
          onError: (error) => {
            toast.error(getErrorMessage(error, t("teamInvite.declineFailed")))
          },
        }
      )
    })
  }

  if (invite?.status === "accepted") {
    return null
  }

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <InteractiveGridBackground />
      <header className="relative z-10 flex items-center justify-end gap-1.5">
        <LanguageSwitcher />
        <ThemeToggleButton />
      </header>

      <section className="relative z-10 grid flex-1 place-items-center py-6 sm:py-8 lg:py-10">
        <Card className="relative isolate w-full max-w-[25rem] overflow-hidden border border-white/50 bg-card/70 p-0 shadow-xl shadow-foreground/10 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[linear-gradient(135deg,rgb(255_255_255/0.44),rgb(255_255_255/0.12)_38%,rgb(255_255_255/0.03)_68%,transparent)] before:opacity-80 after:pointer-events-none after:absolute after:inset-px after:z-0 after:rounded-[calc(var(--radius-xl)-1px)] after:shadow-[inset_0_1px_0_rgb(255_255_255/0.56),inset_0_-1px_0_rgb(255_255_255/0.12)] supports-backdrop-filter:bg-card/55 dark:border-white/15 dark:bg-card/50 dark:shadow-black/30 dark:before:bg-[linear-gradient(135deg,rgb(255_255_255/0.18),rgb(255_255_255/0.06)_42%,transparent_72%)] dark:after:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),inset_0_-1px_0_rgb(255_255_255/0.05)] dark:supports-backdrop-filter:bg-card/42">
          <CardContent className="relative z-10 flex flex-col gap-5 px-5 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-col items-center gap-2 text-center">
              <img
                src="/pwa-512x512.png"
                alt=""
                className="size-14 drop-shadow-[0_10px_16px_rgba(15,23,42,0.16)] dark:drop-shadow-[0_12px_18px_rgba(0,0,0,0.36)]"
              />
              <h1 className="text-[1.55rem] leading-tight font-semibold">
                {t("teamInvite.title")}
              </h1>
              <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                {t("teamInvite.description")}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {!token ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {t("teamInvite.missingToken")}
                  </AlertDescription>
                </Alert>
              ) : null}

              {inviteQuery.isLoading ? (
                <InviteSkeleton />
              ) : inviteQuery.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {getErrorMessage(
                      inviteQuery.error,
                      t("teamInvite.loadFailed")
                    )}
                  </AlertDescription>
                </Alert>
              ) : invite ? (
                <InviteSummary invite={invite} locale={locale} />
              ) : null}

              {invite && !canRespond ? (
                <Alert>
                  <AlertDescription>
                    {t("teamInvite.unavailable")}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="lg"
                className="w-full justify-center"
                disabled={!canRespond || isMutating}
                onClick={acceptInvite}
              >
                {acceptMutation.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : isLoggedIn ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <LogInIcon data-icon="inline-start" />
                )}
                {isLoggedIn
                  ? t("teamInvite.accept")
                  : t("teamInvite.loginRequired")}
              </Button>

              {!isLoggedIn && googleLoginEnabled && canRespond ? (
                <>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {t("login.oauthSeparator")}
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full justify-center"
                    disabled={isMutating}
                    onClick={handleGoogleLogin}
                  >
                    <GoogleLogo data-icon="inline-start" />
                    {t("login.google")}
                  </Button>
                </>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full justify-center"
                onClick={() => navigate(redirectTo, { replace: true })}
              >
                <ArrowRightIcon data-icon="inline-start" />
                {t("teamInvite.continue")}
              </Button>

              <Button
                type="button"
                variant="destructive"
                className="w-full justify-center"
                disabled={!canRespond || isMutating}
                onClick={declineInvite}
              >
                {declineMutation.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <XIcon data-icon="inline-start" />
                )}
                {t("teamInvite.decline")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function InviteSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/70 p-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  )
}

function InviteSummary({
  invite,
  locale,
}: {
  invite: TeamInvite
  locale: Locale
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/70 p-3">
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-primary ring-1 ring-border">
            <UsersRoundIcon className="size-4" aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              {t("teamInvite.badge")}
            </span>
            <span className="truncate font-semibold">{invite.team_name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {invite.team_key}
            </span>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {invite.role_name || "-"}
        </Badge>
      </div>

      <dl className="grid gap-2 text-sm">
        <SummaryItem
          icon={ShieldCheckIcon}
          label={t("teamInvite.role")}
          value={invite.role_name}
        />
        <SummaryItem
          icon={UserRoundIcon}
          label={t("teamInvite.inviter")}
          value={invite.inviter_name}
        />
        <SummaryItem
          icon={MailIcon}
          label={t("teamInvite.email")}
          value={invite.email}
        />
        <SummaryItem
          icon={Clock3Icon}
          label={t("teamInvite.expiresAt")}
          value={formatDateTime(invite.expires_at, locale)}
        />
      </dl>
    </div>
  )
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  value?: string | null
}) {
  return (
    <div className="grid min-h-9 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <dt className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden={true} />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="min-w-0 truncate text-right font-medium">
        {value || "-"}
      </dd>
    </div>
  )
}

function GoogleLogo(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

function normalizeRedirect(value: string | null, locale: Locale) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return localizedPath(locale, DEFAULT_TEAM_REDIRECT)
  }

  const redirectPathname = value.split(/[?#]/)[0]

  return `${localizedPath(locale, redirectPathname)}${value.slice(redirectPathname.length)}`
}

function formatDateTime(value: string, locale: Locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : fallback
}
