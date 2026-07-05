import {
  ArrowRightIcon,
  CheckIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react"
import type { ComponentProps } from "react"
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
import {
  localizedPath,
  localizedPublicPath,
  type Locale,
  type LocaleMessageKey,
} from "@/local"
import type { TeamInvite } from "@/types/admin"
import { InteractiveGridBackground } from "@/views/login/interactive-grid-background"

const DEFAULT_TEAM_REDIRECT = "/browser/team"
const TEAM_INVITE_STATUS_LABELS = {
  accepted: "teamInvite.status.accepted",
  cancelled: "teamInvite.status.cancelled",
  declined: "teamInvite.status.declined",
  expired: "teamInvite.status.expired",
  pending: "teamInvite.status.pending",
} as const satisfies Record<TeamInvite["status"], LocaleMessageKey>

type BadgeVariant = ComponentProps<typeof Badge>["variant"]

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
  const status = invite?.status ?? "pending"
  const canRespond = Boolean(token && invite && status === "pending")
  const isMutating = acceptMutation.isPending || declineMutation.isPending

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
          <CardHeader className="gap-3 px-8 pt-8 text-center">
            <div className="flex justify-center">
              <Badge variant={statusBadgeVariant(status)}>
                {statusLabel(status, t)}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-normal">
              {t("teamInvite.title")}
            </CardTitle>
            <CardDescription className="text-base leading-7">
              {t("teamInvite.description")}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5 px-8">
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

          <CardFooter className="flex flex-col gap-2 bg-transparent px-8 pb-8 sm:flex-row">
            {inviteQuery.isError ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1"
                onClick={() => inviteQuery.refetch()}
              >
                <RefreshCwIcon data-icon="inline-start" />
                {t("teamInvite.retry")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1"
                onClick={() => navigate(redirectTo, { replace: true })}
              >
                <ArrowRightIcon data-icon="inline-start" />
                {t("teamInvite.continue")}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
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
              className="w-full sm:flex-1"
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
    <div className="flex flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-1 text-center">
        <span className="text-sm text-muted-foreground">
          {t("teamInvite.badge")}
        </span>
        <span className="truncate text-xl font-semibold">
          {invite.team_name}
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {invite.team_key}
        </span>
      </div>
      <Separator />
      <dl className="grid gap-3 text-sm">
        <SummaryItem
          label={t("teamInvite.inviter")}
          value={invite.inviter_name}
        />
        <SummaryItem label={t("teamInvite.role")} value={invite.role_name} />
        <SummaryItem label={t("teamInvite.email")} value={invite.email} />
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
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3">
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

function statusLabel(
  status: TeamInvite["status"],
  t: ReturnType<typeof useTranslation>["t"]
) {
  return t(TEAM_INVITE_STATUS_LABELS[status])
}

function statusBadgeVariant(status: TeamInvite["status"]): BadgeVariant {
  if (status === "pending") {
    return "default"
  }
  if (status === "accepted") {
    return "secondary"
  }
  if (status === "expired" || status === "cancelled") {
    return "destructive"
  }
  return "outline"
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
