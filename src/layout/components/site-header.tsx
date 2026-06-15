import { Link } from "react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { NotificationDrawer } from "@/layout/components/notification-drawer"

type SiteHeaderProps = {
  title: string
}

export function SiteHeader({ title }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="h-8 w-px shrink-0 bg-border" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                {title === "首页" ? (
                  <BreadcrumbPage>首页</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to="/">首页</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {title === "首页" ? null : (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <NotificationDrawer />
        <ThemeToggleButton />
      </div>
    </header>
  )
}
