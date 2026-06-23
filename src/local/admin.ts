import { enUSAdminExtraMessages } from "@/local/en-US/admin-extra"
import { zhCNAdminExtraMessages } from "@/local/zh-CN/admin-extra"
import type { Locale } from "@/local/constants"
import { normalizeLocale } from "@/local/runtime"
import { translateText } from "@/local/text-helpers"

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
