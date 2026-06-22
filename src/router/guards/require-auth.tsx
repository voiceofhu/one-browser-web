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
import { isUnauthorizedError } from "@/lib/request"
import { useAuthPermissions, useCurrentUser } from "@/hooks/use-auth"
import { getFirstAuthorizedPath, isAuthorizedPath } from "@/router/access"

export function RequireAuth({ children }: React.PropsWithChildren) {
  const location = useLocation()
  const currentUser = useCurrentUser()
  const authPermissions = useAuthPermissions()
  const isAuthRefreshing = currentUser.isFetching || authPermissions.isFetching

  function retryAuthState() {
    void currentUser.refetch()
    void authPermissions.refetch()
  }

  if (currentUser.isLoading || authPermissions.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
        <Spinner />
      </div>
    )
  }

  if (
    isUnauthorizedError(currentUser.error) ||
    isUnauthorizedError(authPermissions.error)
  ) {
    const redirect = `${location.pathname}${location.search}${location.hash}`

    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    )
  }

  if (currentUser.isError || authPermissions.isError) {
    const error = currentUser.error ?? authPermissions.error

    return (
      <AuthStateError
        title="无法验证登录状态"
        description="暂时无法连接后台服务，请确认服务已启动或网络连接正常。"
        detail={getErrorMessage(error)}
        actionLabel="重新验证"
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
          title="没有可访问菜单"
          description="当前账号没有分配任何可访问的菜单，请联系管理员调整角色权限。"
        />
      )
    }

    return <Navigate to={target} replace />
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "请确认后端服务可用后重试。"
}
