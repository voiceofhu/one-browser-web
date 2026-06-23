import { Link } from "react-router"

import { useTranslation } from "@/components/providers/language-context"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import type { LegalDocumentContent } from "@/local"
import { localizedPublicPath } from "@/lib/i18n"

export function LegalDocument({
  title,
  description,
  sections,
}: LegalDocumentContent) {
  const { locale, t } = useTranslation()
  const loginPath = localizedPublicPath(locale, "login")

  return (
    <main className="min-h-svh bg-muted">
      <header className="flex items-center justify-between gap-4 px-5 py-4">
        <Link to={loginPath} className="flex items-center gap-2">
          <img src="/pwa-512x512.png" alt="" className="size-8 rounded-lg" />
          <span className="text-sm font-semibold tracking-tight">
            {t("brand.name")}
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggleButton />
        </div>
      </header>

      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 md:py-16">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {t("legal.lastUpdated")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-col gap-6 rounded-xl border bg-background p-5 md:p-7">
          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-2">
              <h2 className="text-base font-semibold">{section.title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to={loginPath}>{t("legal.backToLogin")}</Link>
          </Button>
        </div>
      </article>
    </main>
  )
}
