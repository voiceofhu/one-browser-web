import {
  ArrowRightIcon,
  CalendarClockIcon,
  LogInIcon,
  RefreshCwIcon,
  UsersRoundIcon,
} from "lucide-react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router"
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
import { Spinner } from "@/components/ui/spinner"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import { localizedPath, localizedPublicPath, type Locale } from "@/local"
import { HttpError } from "@/lib/request"
import { useJoinTeamInviteMutation, useTeamInviteQuery } from "@/hooks/use-auth"
import { InteractiveGridBackground } from "@/views/login/interactive-grid-background"

const DEFAULT_TEAM_REDIRECT = "/browser/team"

export default function InvitePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { locale, t } = useTranslation()
  const token = searchParams.get("token")?.trim() ?? ""
  const redirectTo = normalizeRedirect(searchParams.get("redirect"), locale)
  const inviteQuery = useTeamInviteQuery(token)
  const joinMutation = useJoinTeamInviteMutation()
  const currentInvitePath = `${location.pathname}${location.search}${location.hash}`
  const loginPath = `${localizedPublicPath(locale, "login")}?redirect=${encodeURIComponent(currentInvitePath)}`
  const isLoading = Boolean(token) && inviteQuery.isLoading
  const loadError = !token
    ? new Error(t("invite.missingToken"))
    : inviteQuery.error

  async function joinInvite() {
    if (!token) {
      return
    }

    const team = await joinMutation.mutateAsync(token)
    toast.success(t("invite.joinSuccess"), {
      description: t("invite.joinSuccessDescription", {
        team: team.team_name,
      }),
    })
    navigate(redirectTo, { replace: true })
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
        <Card className="w-full max-w-lg shadow-lg shadow-foreground/5">
          <CardHeader>
            <Badge variant="secondary" className="mb-2 w-fit">
              {t("invite.badge")}
            </Badge>
            <CardTitle className="text-2xl">{t("invite.title")}</CardTitle>
            <CardDescription>{t("invite.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isLoading ? (
              <div className="flex min-h-32 items-center justify-center">
                <Spinner />
              </div>
            ) : null}

            {loadError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {getErrorMessage(loadError, t("invite.loadFailed"))}
                </AlertDescription>
              </Alert>
            ) : null}

            {inviteQuery.data ? (
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border bg-background p-2 text-muted-foreground">
                    <UsersRoundIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold">
                      {inviteQuery.data.team_name}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {inviteQuery.data.team_key}
                    </div>
                  </div>
                </div>
                {inviteQuery.data.expires_at ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarClockIcon />
                    <span>
                      {t("invite.expiresAt", {
                        time: formatDateTime(inviteQuery.data.expires_at),
                      })}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="w-full sm:flex-1"
              disabled={!token || !inviteQuery.data || joinMutation.isPending}
              onClick={joinInvite}
            >
              {joinMutation.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <ArrowRightIcon data-icon="inline-start" />
              )}
              {t("invite.join")}
            </Button>
            <Button
              asChild
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
            >
              <Link to={loginPath}>
                <LogInIcon data-icon="inline-start" />
                {t("invite.login")}
              </Link>
            </Button>
          </CardFooter>
          {loadError ? (
            <CardFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => inviteQuery.refetch()}
                disabled={!token || inviteQuery.isFetching}
              >
                {inviteQuery.isFetching ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <RefreshCwIcon data-icon="inline-start" />
                )}
                {t("auth.state.retry")}
              </Button>
            </CardFooter>
          ) : null}
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

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : fallback
}
