import { enUSAdminExtraMessages } from "@/local/en-US/admin-extra"
import { zhCNAdminExtraMessages } from "@/local/zh-CN/admin-extra"
import { normalizeLocale, type Locale } from "@/lib/i18n"
import { translateText } from "@/lib/i18n-text"

const adminExtraMessagesByLocale = {
  "zh-CN": zhCNAdminExtraMessages,
  "en-US": enUSAdminExtraMessages,
} satisfies Record<Locale, Record<string, string>>

export function translateAdminText(
  locale: Locale | string | null | undefined,
  text: string
) {
  const normalizedLocale = normalizeLocale(locale)

  return (
    adminExtraMessagesByLocale[normalizedLocale][text] ??
    translateText(normalizedLocale, text)
  )
}
