"use client"

import { LanguagesIcon } from "lucide-react"
import { useLocation, useNavigate } from "react-router"

import { useLanguage } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LOCALE_OPTIONS,
  normalizeLocale,
  withLocaleInPublicPath,
} from "@/lib/i18n"

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  function handleLocaleChange(value: string) {
    const nextLocale = normalizeLocale(value)
    setLocale(nextLocale)

    const nextPathname = withLocaleInPublicPath(location.pathname, nextLocale)
    if (nextPathname !== location.pathname) {
      navigate(`${nextPathname}${location.search}${location.hash}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          aria-label={t("language.switch")}
          title={t("language.switch")}
          variant="outline"
          size="icon-sm"
          className="shrink-0"
        >
          <LanguagesIcon aria-hidden="true" strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="whitespace-nowrap">
            {t("language.current")}
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={handleLocaleChange}
          >
            {LOCALE_OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="whitespace-nowrap"
              >
                {t(option.labelKey)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
