import { LockKeyholeIcon, UserRoundIcon } from "lucide-react"

import { type AnimatedSegmentedTabsOption } from "@/components/ui/animated-segmented-tabs"
import { translateAdminText } from "@/local"
import type { Locale } from "@/local"

export type AccountTab = "profile" | "password"

export function getAccountTabOptions(
  locale: Locale
): readonly AnimatedSegmentedTabsOption<AccountTab>[] {
  return [
    {
      label: (
        <>
          <UserRoundIcon data-icon="inline-start" />
          {translateAdminText(locale, "个人信息")}
        </>
      ),
      value: "profile",
    },
    {
      label: (
        <>
          <LockKeyholeIcon data-icon="inline-start" />
          {translateAdminText(locale, "修改密码")}
        </>
      ),
      value: "password",
    },
  ]
}
