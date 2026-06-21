import { Navigate, useLocation } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { isUnauthorizedError } from "@/lib/request"
import { useAuthPermissions, useCurrentUser } from "@/hooks/use-auth"
import { getFirstAuthorizedPath, isAuthorizedPath } from "@/router/access"

export function RequireAuth({ children }: React.PropsWithChildren) {
  const location = useLocation()
  const currentUser = useCurrentUser()
  const authPermissions = useAuthPermissions()

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
      <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>无法验证登录状态</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>{getErrorMessage(error)}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                currentUser.refetch()
                authPermissions.refetch()
              }}
              disabled={currentUser.isFetching || authPermissions.isFetching}
            >
              {currentUser.isFetching || authPermissions.isFetching ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              重试
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  if (!isAuthorizedPath(authPermissions.data, location.pathname)) {
    const target = getFirstAuthorizedPath(authPermissions.data)
    if (!target) {
      return (
        <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>没有可访问菜单</AlertTitle>
            <AlertDescription>
              当前账号没有分配任何可访问的菜单，请联系管理员调整角色权限。
            </AlertDescription>
          </Alert>
        </main>
      )
    }

    return <Navigate to={target} replace />
  }

  return children
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "请确认后端服务可用后重试。"
}
