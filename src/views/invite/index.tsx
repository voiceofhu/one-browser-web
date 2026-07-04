import {
  ArrowRightIcon,
  CheckCircle2Icon,
  LogInIcon,
  RefreshCwIcon,
} from "lucide-react"
import { useEffect, useRef } from "react"
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router"
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
import { Spinner } from "@/components/ui/spinner"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import { hasAuthTokens } from "@/lib/auth-tokens"
import { HttpError } from "@/lib/request"
import { localizedPath, localizedPublicPath, type Locale } from "@/local"
import {
  useBindReferralMutation,
  useJoinTeamInviteMutation,
  useReferralCodeCheckQuery,
  useTeamInviteQuery,
} from "@/hooks/use-auth"
import type { BindReferralResult } from "@/api/auth"
import { InteractiveGridBackground } from "@/views/login/interactive-grid-background"

const DEFAULT_TEAM_REDIRECT = "/browser/team"
type TranslationFn = ReturnType<typeof useTranslation>["t"]

export default function InvitePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { locale, t } = useTranslation()
  const aff = searchParams.get("aff")?.trim() ?? ""
  const teamCode = searchParams.get("team")?.trim() || ""
  const isTeamInvite = Boolean(aff && teamCode)
  const isDefaultInvite = Boolean(aff && !isTeamInvite)
  const isMissingInvite = !isTeamInvite && !isDefaultInvite
  const teamLookup = {
    code: isTeamInvite ? aff : "",
    team_code: isTeamInvite ? teamCode : "",
  }
  const redirectTo = normalizeRedirect(searchParams.get("redirect"), locale)
  const teamInviteQuery = useTeamInviteQuery(teamLookup)
  const userInviteQuery = useReferralCodeCheckQuery(isDefaultInvite ? aff : "")
  const joinMutation = useJoinTeamInviteMutation()
  const bindMutation = useBindReferralMutation()
  const autoBindRef = useRef("")
  const isLoggedIn = hasAuthTokens()
  const currentInvitePath = `${location.pathname}${location.search}${location.hash}`
  const loginPath = `${localizedPublicPath(locale, "login")}?redirect=${encodeURIComponent(currentInvitePath)}`
  const isLoading =
    (isTeamInvite && teamInviteQuery.isLoading) ||
    (isDefaultInvite && userInviteQuery.isLoading)
  const loadError = isMissingInvite
    ? new Error(t("invite.missingToken"))
    : isTeamInvite
      ? teamInviteQuery.error
      : userInviteQuery.error
  const checkResult = userInviteQuery.data

  useEffect(() => {
    if (
      !isDefaultInvite ||
      !isLoggedIn ||
      !checkResult?.valid ||
      bindMutation.isPending ||
      autoBindRef.current === aff
    ) {
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
        },
      }
    )
  }, [
    aff,
    bindMutation,
    checkResult?.valid,
    isDefaultInvite,
    isLoggedIn,
    navigate,
    redirectTo,
    t,
  ])

  async function joinInvite() {
    if (!isTeamInvite) {
      return
    }

    const team = await joinMutation.mutateAsync(teamLookup)
    toast.success(t("invite.joinSuccess"), {
      description: t("invite.joinSuccessDescription", {
        team: team.team_name,
      }),
    })
    navigate(redirectTo, { replace: true })
  }

  function bindInvite() {
    if (!isDefaultInvite || !checkResult?.valid) {
      return
    }

    bindMutation.mutate(
      { aff, bound_method: "login" },
      {
        onSuccess: (result) => handleBindResult(result, t, navigate, redirectTo),
        onError: (error) =>
          toast.error(getErrorMessage(error, t("invite.bindFailed"))),
      }
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
        <Card className="w-full max-w-lg border-border/80 bg-card/95">
          <CardHeader className="gap-2 px-8 pt-8 text-center">
            <CardTitle className="text-2xl font-semibold tracking-normal">
              {isTeamInvite ? t("invite.title") : t("invite.defaultTitle")}
            </CardTitle>
            <CardDescription className="text-base leading-7">
              {isTeamInvite
                ? t("invite.description")
                : t("invite.defaultDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-8">
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

            {isTeamInvite && teamInviteQuery.data ? (
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="min-w-0 text-center">
                  <div className="truncate text-lg font-semibold">
                    {teamInviteQuery.data.team_name}
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">
                    {teamInviteQuery.data.team_key}
                  </div>
                </div>
              </div>
            ) : null}

            {isDefaultInvite && checkResult ? (
              <DefaultInviteState
                code={checkResult.code ?? aff}
                message={
                  checkResult.valid
                    ? t("invite.defaultReady")
                    : checkResult.message ?? t("invite.invalidDefault")
                }
                valid={checkResult.valid}
              />
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 bg-transparent px-8 pb-8 sm:flex-row">
            {isTeamInvite ? (
              <Button
                type="button"
                className="w-full sm:flex-1"
                disabled={
                  !teamInviteQuery.data || joinMutation.isPending || isLoading
                }
                onClick={joinInvite}
              >
                {joinMutation.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <ArrowRightIcon data-icon="inline-start" />
                )}
                {t("invite.join")}
              </Button>
            ) : isLoggedIn ? (
              <Button
                type="button"
                className="w-full sm:flex-1"
                disabled={
                  !checkResult?.valid || bindMutation.isPending || isLoading
                }
                onClick={bindInvite}
              >
                {bindMutation.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <CheckCircle2Icon data-icon="inline-start" />
                )}
                {t("invite.bind")}
              </Button>
            ) : (
              <Button asChild type="button" className="w-full sm:flex-1">
                <Link to={loginPath}>
                  <LogInIcon data-icon="inline-start" />
                  {t("invite.loginAndBind")}
                </Link>
              </Button>
            )}

            <Button
              asChild
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
            >
              <Link to={isLoggedIn ? redirectTo : loginPath}>
                {isLoggedIn ? (
                  <ArrowRightIcon data-icon="inline-start" />
                ) : (
                  <LogInIcon data-icon="inline-start" />
                )}
                {isLoggedIn ? t("invite.continue") : t("invite.login")}
              </Link>
            </Button>
          </CardFooter>
          {loadError ? (
            <CardFooter className="bg-transparent px-8 pb-8">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isTeamInvite) {
                    void teamInviteQuery.refetch()
                  } else {
                    void userInviteQuery.refetch()
                  }
                }}
                disabled={
                  isMissingInvite ||
                  teamInviteQuery.isFetching ||
                  userInviteQuery.isFetching
                }
              >
                {teamInviteQuery.isFetching || userInviteQuery.isFetching ? (
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

function DefaultInviteState({
  code,
  message,
  valid,
}: {
  code: string
  message: string
  valid: boolean
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="min-w-0 text-center">
        <div className="truncate text-lg font-semibold">{message}</div>
        <div className="mt-1 truncate font-mono text-sm text-muted-foreground">
          {valid ? code : "-"}
        </div>
      </div>
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
