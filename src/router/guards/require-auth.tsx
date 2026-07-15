import { Navigate, useLocation } from "react-router"
import { RefreshCwIcon, ShieldAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useLanguage } from "@/components/providers/language-context"
import { localizedPath, localizedPublicPath } from "@/local"
import { hasAuthTokens } from "@/lib/auth-tokens"
import { isUnauthorizedError } from "@/lib/request"
import { useAuthPermissions, useCurrentUser } from "@/hooks/use-auth"
import { getFirstAuthorizedPath, isAuthorizedPath } from "@/router/access"
import { RouteLoading } from "@/router/route-loading"

export function RequireAuth({ children }: React.PropsWithChildren) {
  const location = useLocation()
  const { locale, t } = useLanguage()
  const hasSession = hasAuthTokens()
  const currentUser = useCurrentUser({ enabled: hasSession })
  const authPermissions = useAuthPermissions({ enabled: hasSession })
  const isAuthRefreshing = currentUser.isFetching || authPermissions.isFetching
  const loginRedirect = `${location.pathname}${location.search}${location.hash}`

  function retryAuthState() {
    void currentUser.refetch()
    void authPermissions.refetch()
  }

  if (!hasSession) {
    return (
      <Navigate
        to={`${localizedPublicPath(locale, "login")}?redirect=${encodeURIComponent(loginRedirect)}`}
        replace
      />
    )
  }

  if (currentUser.isLoading || authPermissions.isLoading) {
    return <RouteLoading />
  }

  if (
    isUnauthorizedError(currentUser.error) ||
    isUnauthorizedError(authPermissions.error)
  ) {
    return (
      <Navigate
        to={`${localizedPublicPath(locale, "login")}?redirect=${encodeURIComponent(loginRedirect)}`}
        replace
      />
    )
  }

  if (currentUser.isError || authPermissions.isError) {
    const error = currentUser.error ?? authPermissions.error

    return (
      <AuthStateError
        title={t("auth.state.verifyTitle")}
        description={t("auth.state.verifyDescription")}
        detail={getErrorMessage(error, t("auth.state.backendUnavailable"))}
        actionLabel={t("auth.state.retry")}
        pending={isAuthRefreshing}
        onAction={retryAuthState}
      />
    )
  }

  if (!isAuthorizedPath(authPermissions.data, location.pathname)) {
    const target = getFirstAuthorizedPath(authPermissions.data)
    if (!target) {
      return (
        <AuthStateError
          title={t("auth.state.noMenuTitle")}
          description={t("auth.state.noMenuDescription")}
        />
      )
    }

    return <Navigate to={localizedPath(locale, target)} replace />
  }

  return children
}

function AuthStateError({
  title,
  description,
  detail,
  actionLabel,
  pending,
  onAction,
}: {
  title: string
  description: string
  detail?: string
  actionLabel?: string
  pending?: boolean
  onAction?: () => void
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Empty className="max-w-lg border bg-card p-8 shadow-none sm:p-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlertIcon />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {detail ? (
            <div className="w-full rounded-lg bg-muted px-3 py-2 text-left text-xs text-muted-foreground">
              {detail}
            </div>
          ) : null}
          {onAction && actionLabel ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAction}
              disabled={pending}
            >
              {pending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RefreshCwIcon data-icon="inline-start" />
              )}
              {actionLabel}
            </Button>
          ) : null}
        </EmptyContent>
      </Empty>
    </main>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
