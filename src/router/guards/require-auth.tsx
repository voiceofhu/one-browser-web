import { useQuery } from "@tanstack/react-query"
import { Navigate, useLocation } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { isUnauthorizedError } from "@/lib/request"
import { getCurrentUser } from "@/api/auth"
import { authQueryKeys } from "@/lib/query-keys"

export function RequireAuth({ children }: React.PropsWithChildren) {
  const location = useLocation()
  const currentUser = useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
    retry: (failureCount, error) =>
      isUnauthorizedError(error) ? false : failureCount < 3,
  })

  if (currentUser.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
        <Spinner />
      </div>
    )
  }

  if (isUnauthorizedError(currentUser.error)) {
    const redirect = `${location.pathname}${location.search}${location.hash}`

    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    )
  }

  if (currentUser.isError) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>无法验证登录状态</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>{getErrorMessage(currentUser.error)}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => currentUser.refetch()}
              disabled={currentUser.isFetching}
            >
              {currentUser.isFetching ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              重试
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return children
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "请确认后端服务可用后重试。"
}
