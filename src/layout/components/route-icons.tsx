import type * as React from "react"
import { UserRoundIcon } from "lucide-react"

import { findMenuIconOption } from "@/views/system/_components/resource/menu-icons"
import type { AppRouteId } from "@/router/routes"

const fallbackRouteIcons: Partial<Record<AppRouteId, React.ReactNode>> = {
  account: <UserRoundIcon />,
}

export function getRouteIcon(
  iconValue: string | null | undefined,
  routeId: AppRouteId
) {
  if (iconValue !== undefined) {
    const option = findMenuIconOption(iconValue)
    if (!option) {
      return null
    }

    return <option.Icon />
  }

  return fallbackRouteIcons[routeId] ?? null
}
