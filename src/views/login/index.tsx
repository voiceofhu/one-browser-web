import { useEffect } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { LoginForm } from "@/components/login-form"
import { useTranslation } from "@/components/providers/language-context"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import { isLoginPath } from "@/lib/i18n"
import { consumeAuthExpiredNotice } from "@/lib/request"
import { useCurrentUser, useLoginMutation } from "@/hooks/use-auth"

function normalizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/index"
  }

  const redirectPathname = value.split(/[?#]/)[0]
  if (isLoginPath(redirectPathname)) {
    return "/index"
  }

  return value
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = normalizeRedirect(searchParams.get("redirect"))
  const loginMutation = useLoginMutation()
  const currentUser = useCurrentUser()
  const { t } = useTranslation()

  useEffect(() => {
    if (consumeAuthExpiredNotice()) {
      toast.warning(t("auth.expired.title"), {
        description: t("auth.expired.description"),
      })
    }
  }, [t])

  if (currentUser.isSuccess) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-muted p-6 pt-20 md:p-10">
      <div className="absolute top-5 left-5 flex items-center gap-2">
        <img src="/pwa-512x512.png" alt="" className="size-8 rounded-lg" />
        <span className="text-sm font-semibold tracking-tight">
          {t("brand.name")}
        </span>
      </div>
      <div className="absolute top-5 right-5 flex items-center gap-1.5">
        <LanguageSwitcher />
        <ThemeToggleButton />
      </div>
      <LoginForm
        className="w-full max-w-sm md:max-w-4xl"
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
