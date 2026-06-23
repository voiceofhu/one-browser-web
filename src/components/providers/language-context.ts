import * as React from "react"

import type { I18nKey, I18nValues, Locale } from "@/lib/i18n"

export type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: I18nKey, values?: I18nValues) => string
}

export const LanguageContext =
  React.createContext<LanguageContextValue | null>(null)

export function useLanguage() {
  const context = React.useContext(LanguageContext)

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }

  return context
}

export function useTranslation() {
  const { locale, t } = useLanguage()
  return { locale, t }
}
