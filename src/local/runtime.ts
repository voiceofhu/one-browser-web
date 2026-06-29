import { messagesByLocale } from "@/local/catalogs"
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  PUBLIC_LOCALE_ROUTES,
  SUPPORTED_LOCALES,
  type I18nValues,
  type Locale,
  type PublicLocaleRoute,
} from "@/local/constants"
import type { LocaleMessageKey } from "@/local/zh-CN/messages"

export type I18nKey = LocaleMessageKey

export const messages = messagesByLocale

export const LOCALE_OPTIONS: ReadonlyArray<{
  value: Locale
  labelKey: I18nKey
}> = [
  { value: "zh-CN", labelKey: "language.zhCN" },
  { value: "en-US", labelKey: "language.enUS" },
]

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.some((locale) => locale === value)
}

export function normalizeLocale(value: string | null | undefined): Locale {
  const locale = value?.trim()

  if (!locale) {
    return DEFAULT_LOCALE
  }

  if (isSupportedLocale(locale)) {
    return locale
  }

  const lowerLocale = locale.toLowerCase()
  if (lowerLocale === "en" || lowerLocale.startsWith("en-")) {
    return "en-US"
  }
  if (
    lowerLocale === "zh" ||
    lowerLocale === "cn" ||
    lowerLocale.startsWith("zh-")
  ) {
    return "zh-CN"
  }

  return DEFAULT_LOCALE
}

export function getLocaleFromPathname(pathname: string) {
  const firstSegment = splitPathname(pathname)[0]

  return firstSegment && isSupportedLocale(firstSegment) ? firstSegment : null
}

export function stripLocaleFromPathname(pathname: string) {
  const segments = splitPathname(pathname)
  const firstSegment = segments[0]
  const routeSegments =
    firstSegment && isSupportedLocale(firstSegment)
      ? segments.slice(1)
      : segments

  return routeSegments.length > 0 ? `/${routeSegments.join("/")}` : "/"
}

export function localizedPath(
  locale: Locale | string | null | undefined,
  pathname: string
) {
  const normalizedLocale = normalizeLocale(locale)
  const routePathname = stripLocaleFromPathname(pathname)

  if (routePathname === "/") {
    return `/${normalizedLocale}`
  }

  return `/${normalizedLocale}${routePathname}`
}

export function localizedPublicPath(
  locale: Locale | string | null | undefined,
  route: PublicLocaleRoute
) {
  return localizedPath(locale, `/${route}`)
}

export function withLocaleInPath(pathname: string, locale: Locale) {
  return localizedPath(locale, pathname)
}

export function withLocaleInPublicPath(pathname: string, locale: Locale) {
  const route = splitPathname(stripLocaleFromPathname(pathname))[0]
  if (!isPublicLocaleRoute(route)) {
    return pathname
  }

  return localizedPublicPath(locale, route)
}

export function isLoginPath(pathname: string) {
  const segments = splitPathname(stripLocaleFromPathname(pathname))

  return segments[0] === "login"
}

function isPublicLocaleRoute(
  value: string | undefined
): value is PublicLocaleRoute {
  return PUBLIC_LOCALE_ROUTES.some((route) => route === value)
}

function splitPathname(pathname: string) {
  return pathname.split("/").filter(Boolean)
}

export function getStoredLocale(): Locale {
  if (typeof window !== "undefined") {
    try {
      const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)
      if (storedLocale) {
        return normalizeLocale(storedLocale)
      }
    } catch {
      // Ignore storage access failures and fall back to cookie/default locale.
    }
  }

  if (typeof document !== "undefined") {
    const cookieLocale = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${LOCALE_COOKIE_NAME}=`))
      ?.slice(LOCALE_COOKIE_NAME.length + 1)

    if (cookieLocale) {
      try {
        return normalizeLocale(decodeURIComponent(cookieLocale))
      } catch {
        return normalizeLocale(cookieLocale)
      }
    }
  }

  return DEFAULT_LOCALE
}

export function persistLocale(locale: Locale) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      // Cookie persistence below keeps language choice available to requests.
    }
  }

  if (typeof document !== "undefined") {
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(
      locale
    )}; path=/; max-age=31536000; SameSite=Lax`
  }
}

export function applyDocumentLocale(locale: Locale) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale
  }
}

export function getCurrentLocale() {
  return getStoredLocale()
}

export function getAcceptLanguageHeader(locale = getCurrentLocale()) {
  return locale === "en-US" ? "en-US,en;q=0.9" : "zh-CN,zh;q=0.9"
}

export function translate(
  locale: Locale | string | null | undefined,
  key: I18nKey,
  values?: I18nValues
) {
  const normalizedLocale = normalizeLocale(locale)
  const message =
    messages[normalizedLocale][key] ?? messages[DEFAULT_LOCALE][key]

  if (!values) {
    return message
  }

  return message.replace(/\{(\w+)\}/g, (placeholder, name) => {
    const value = values[name]
    return value === undefined ? placeholder : String(value)
  })
}
