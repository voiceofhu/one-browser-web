import { enUSLegal } from "@/local/en-US/legal"
import { enUSMessages } from "@/local/en-US/messages"
import { enUSTextMessages } from "@/local/en-US/text"
import { zhCNLegal } from "@/local/zh-CN/legal"
import { zhCNMessages, type LocaleMessageKey } from "@/local/zh-CN/messages"
import { zhCNTextMessages } from "@/local/zh-CN/text"
import type { Locale } from "@/lib/i18n"
import type { LegalContentCollection } from "@/local/types"

export { enUSMessages, enUSTextMessages, zhCNMessages, zhCNTextMessages }
export type {
  LegalContentCollection,
  LegalDocumentContent,
  LegalSection,
} from "@/local/types"
export type { LocaleMessageKey } from "@/local/zh-CN/messages"

export const messagesByLocale = {
  "zh-CN": zhCNMessages,
  "en-US": enUSMessages,
} satisfies Record<Locale, Record<LocaleMessageKey, string>>

export const textMessagesByLocale = {
  "zh-CN": zhCNTextMessages,
  "en-US": enUSTextMessages,
} satisfies Record<Locale, Record<string, string>>

export const legalByLocale = {
  "zh-CN": zhCNLegal,
  "en-US": enUSLegal,
} satisfies Record<Locale, LegalContentCollection>
