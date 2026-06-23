import { monitorMessages as enUSMonitorMessages } from "@/local/en-US/monitor"
import { monitorMessages as zhCNMonitorMessages } from "@/local/zh-CN/monitor"
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type I18nValues,
  type Locale,
} from "@/lib/i18n"

const monitorMessagesByLocale: Record<Locale, Record<string, string>> = {
  "zh-CN": zhCNMonitorMessages,
  "en-US": enUSMonitorMessages,
}

export function monitorText(
  locale: Locale | string | null | undefined,
  key: string,
  values?: I18nValues
) {
  const normalizedLocale = normalizeLocale(locale)
  const message =
    monitorMessagesByLocale[normalizedLocale][key] ??
    monitorMessagesByLocale[DEFAULT_LOCALE][key] ??
    key

  if (!values) {
    return message
  }

  return message.replace(/\{(\w+)\}/g, (placeholder, name) => {
    const value = values[name]
    return value === undefined ? placeholder : String(value)
  })
}
