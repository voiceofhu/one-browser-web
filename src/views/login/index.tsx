import { useEffect } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { LoginForm } from "@/components/login-form"
import { useTranslation } from "@/components/providers/language-context"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import { isLoginPath } from "@/local"
import { consumeAuthExpiredNotice } from "@/lib/request"
import { useCurrentUser, useLoginMutation } from "@/hooks/use-auth"
import { InteractiveGridBackground } from "./interactive-grid-background"

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
        <LoginForm
          className="w-full max-w-sm"
          isSubmitting={loginMutation.isPending}
          error={loginMutation.error}
          onSubmit={async (values) => {
            await loginMutation.mutateAsync(values)
            navigate(redirectTo, { replace: true })
          }}
        />
      </section>
    </main>
  )
}
