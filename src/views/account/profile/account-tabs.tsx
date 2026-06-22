import { LockKeyholeIcon, UserRoundIcon } from "lucide-react"

import { type AnimatedSegmentedTabsOption } from "@/components/ui/animated-segmented-tabs"

export type AccountTab = "profile" | "password"

export const ACCOUNT_TAB_OPTIONS: readonly AnimatedSegmentedTabsOption<AccountTab>[] =
  [
    {
      label: (
        <>
          <UserRoundIcon data-icon="inline-start" />
          个人信息
        </>
      ),
      value: "profile",
    },
    {
      label: (
        <>
          <LockKeyholeIcon data-icon="inline-start" />
          修改密码
        </>
      ),
      value: "password",
    },
  ]
