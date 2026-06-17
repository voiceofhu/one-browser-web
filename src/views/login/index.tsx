import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Navigate, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { LoginForm } from "@/components/login-form"
import { consumeAuthExpiredNotice, isUnauthorizedError } from "@/lib/request"
import { getCurrentUser } from "@/api/auth"
import { authQueryKeys, useLoginMutation } from "@/hooks/use-auth"

function normalizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard"
  }

  if (value.startsWith("/login")) {
    return "/dashboard"
  }

  return value
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = normalizeRedirect(searchParams.get("redirect"))
  const loginMutation = useLoginMutation()
  const currentUser = useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
    retry: (failureCount, error) =>
      isUnauthorizedError(error) ? false : failureCount < 3,
  })

  useEffect(() => {
    if (consumeAuthExpiredNotice()) {
      toast.warning("登录状态已失效", {
        description: "请重新登录后继续操作。",
      })
    }
  }, [])

  if (currentUser.isSuccess) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <LoginForm
        className="w-full max-w-sm"
        isSubmitting={loginMutation.isPending}
        error={loginMutation.error}
        onSubmit={async (values) => {
          await loginMutation.mutateAsync(values)
          navigate(redirectTo, { replace: true })
        }}
      />
    </main>
  )
}
