import { ArrowRightIcon, CheckIcon, XIcon } from "lucide-react"
import { useEffect } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { useTranslation } from "@/components/providers/language-context"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  localizedPath,
  localizedPublicPath,
  type Locale,
} from "@/local"
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

      <section className="relative z-10 grid flex-1 place-items-center py-6 sm:py-8 lg:py-10">
        <Card className="w-full max-w-md border-border/80 bg-card/95 px-5 pt-5 pb-0 shadow-sm shadow-foreground/5 backdrop-blur">
          <CardHeader className="items-center gap-2 p-0 text-center">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-lg font-semibold tracking-normal">
                {t("teamInvite.title")}
              </CardTitle>
              <CardDescription className="mx-auto max-w-xs text-sm leading-6">
                {t("teamInvite.description")}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-3 p-0 pt-4">
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
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t-0 bg-transparent px-0 pt-5 pb-5">
            <div className="flex w-full items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                className="w-2/5 justify-center"
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

              <Button
                type="button"
                className="w-3/5 justify-center"
                disabled={!canRespond || isMutating}
                onClick={acceptInvite}
              >
                {acceptMutation.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <CheckIcon data-icon="inline-start" />
                )}
                {isLoggedIn
                  ? t("teamInvite.accept")
                  : t("teamInvite.loginRequired")}
              </Button>
            </div>

            <div className="w-full">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center"
                onClick={() => navigate(redirectTo, { replace: true })}
              >
                <ArrowRightIcon data-icon="inline-start" />
                {t("teamInvite.continue")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

function InviteSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-5 w-3/5" />
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
    <div className="rounded-lg bg-muted/45 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t("teamInvite.badge")}
          </span>
          <span className="truncate text-lg font-semibold">
            {invite.team_name}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {invite.team_key}
          </span>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {invite.role_name || "-"}
        </Badge>
      </div>

      <dl className="mt-4 grid gap-2 border-t border-border/60 pt-3 text-sm">
        <SummaryItem
          label={t("teamInvite.inviter")}
          value={invite.inviter_name}
        />
        <SummaryItem
          label={t("teamInvite.expiresAt")}
          value={formatDateTime(invite.expires_at, locale)}
        />
      </dl>
    </div>
  )
}

function SummaryItem({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{value || "-"}</dd>
    </div>
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
