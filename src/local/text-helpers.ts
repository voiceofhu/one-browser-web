import { textMessagesByLocale } from "@/local/catalogs"
import { DEFAULT_LOCALE, type Locale } from "@/local/constants"
import { normalizeLocale } from "@/local/runtime"

export function translateText(
  locale: Locale | string | null | undefined,
  text: string
) {
  const normalizedLocale = normalizeLocale(locale)

  if (normalizedLocale === DEFAULT_LOCALE) {
    return textMessagesByLocale[DEFAULT_LOCALE][text] ?? text
  }

  return textMessagesByLocale[normalizedLocale][text] ?? text
}

export function formatResourceActionText(
  locale: Locale | string | null | undefined,
  action: "create" | "delete" | "edit" | "save" | "bulkDelete",
  noun: string
) {
  const normalizedLocale = normalizeLocale(locale)
  const translatedNoun = translateText(normalizedLocale, noun)

  if (normalizedLocale === "en-US") {
    switch (action) {
      case "create":
        return `Create ${translatedNoun}`
      case "delete":
        return `Delete ${translatedNoun}`
      case "edit":
        return `Edit ${translatedNoun}`
      case "save":
        return `Save ${translatedNoun}`
      case "bulkDelete":
        return `Bulk delete ${translatedNoun}`
    }
  }

  switch (action) {
    case "create":
      return `新增${noun}`
    case "delete":
      return `删除${noun}`
    case "edit":
      return `编辑${noun}`
    case "save":
      return `保存${noun}`
    case "bulkDelete":
      return `批量删除${noun}`
  }
}

export function formatResourceSearchPlaceholder(
  locale: Locale | string | null | undefined,
  noun: string
) {
  const normalizedLocale = normalizeLocale(locale)
  return normalizedLocale === "en-US"
    ? `Search ${translateText(normalizedLocale, noun).toLowerCase()}...`
    : `搜索${noun}...`
}

export function formatResourceEmptyText(
  locale: Locale | string | null | undefined,
  noun: string
) {
  const normalizedLocale = normalizeLocale(locale)
  const translatedNoun = translateText(normalizedLocale, noun)

  if (normalizedLocale === "en-US") {
    return {
      title: `No ${translatedNoun.toLowerCase()} yet`,
      description: `There are no ${translatedNoun.toLowerCase()} records yet. Create one to get started.`,
    }
  }

  return {
    title: `暂无${noun}`,
    description: `还没有任何${noun}，快来新增一个${noun}吧。`,
  }
}
