export const LOCALE_STORAGE_KEY = "one-browser:locale"
export const LOCALE_COOKIE_NAME = "one_browser_locale"
export const DEFAULT_LOCALE = "zh-CN"
export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const
export const PUBLIC_LOCALE_ROUTES = [
  "login",
  "invite",
  "terms",
  "privacy",
] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]
export type PublicLocaleRoute = (typeof PUBLIC_LOCALE_ROUTES)[number]
export type I18nValues = Record<string, number | string>
