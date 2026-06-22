import type * as React from "react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { NotificationDrawer } from "@/layout/components/notification-drawer"

type SiteHeaderProps = {
  children: React.ReactNode
}

export function SiteHeader({ children }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center overflow-visible border-b bg-muted transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex h-full w-full min-w-0 items-center overflow-visible px-3 lg:px-4">
        <SidebarTrigger className="mr-2 -ml-1" />
        <div className="h-full w-px shrink-0 bg-border" aria-hidden="true" />
        <div className="h-full min-w-0 flex-1">{children}</div>
        <div className="ml-2 flex h-full shrink-0 items-center gap-1.5 overflow-visible">
          <NotificationDrawer />
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  )
}
