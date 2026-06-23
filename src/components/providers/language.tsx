"use client"

import * as React from "react"

import { LanguageContext } from "@/components/providers/language-context"
import {
  applyDocumentLocale,
  getLocaleFromPathname,
  getStoredLocale,
  persistLocale,
  translate,
  type I18nKey,
  type I18nValues,
  type Locale,
} from "@/lib/i18n"

export function LanguageProvider({ children }: React.PropsWithChildren) {
  const [locale, setLocaleState] = React.useState<Locale>(() => {
    if (typeof window !== "undefined") {
      return (
        getLocaleFromPathname(window.location.pathname) ?? getStoredLocale()
      )
    }

    return getStoredLocale()
  })

  React.useEffect(() => {
    applyDocumentLocale(locale)
    persistLocale(locale)
  }, [locale])

  const setLocale = React.useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
  }, [])

  const t = React.useCallback(
    (key: I18nKey, values?: I18nValues) => translate(locale, key, values),
    [locale]
  )

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
