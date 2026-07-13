import * as React from "react"
import { NavLink } from "react-router"

import { useTranslation } from "@/components/providers/language-context"
import { NavMain } from "@/layout/components/nav-main"
import { NavUser } from "@/layout/components/nav-user"
import { getRouteIcon } from "@/layout/components/route-icons"
import { localizedPath } from "@/local"
import type { AuthPermissions, CurrentUser } from "@/types/admin"
import {
  getAuthorizedRouteGroups,
  getAuthorizedRouteIconValues,
} from "@/router/access"
import { APP_ROUTE_BY_ID, type AppRouteId } from "@/router/routes"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  activeRoute: AppRouteId
  currentUser?: CurrentUser
  authPermissions?: AuthPermissions
  onLogout?: () => void
}

export function AppSidebar({
  activeRoute,
  currentUser,
  authPermissions,
  onLogout,
  ...props
}: AppSidebarProps) {
  const { locale, t } = useTranslation()
  const routeIconValues = getAuthorizedRouteIconValues(authPermissions)
  const navGroups = getAuthorizedRouteGroups(authPermissions).map((group) => ({
    label: group.title,
    showLabel: group.showLabel,
    items: group.routes.map(({ routeId, title }) => {
      const route = APP_ROUTE_BY_ID[routeId]
      return {
        title,
        url: localizedPath(locale, route.path),
        icon: getRouteIcon(routeIconValues.get(route.id), route.id),
      }
    }),
  }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <NavLink to={localizedPath(locale, "/index")}>
                <img
                  src="/pwa-512x512.png"
                  alt=""
                  className="size-6 rounded-md"
                />
                <span className="text-base font-semibold">
                  {t("brand.name")}
                </span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          groups={navGroups}
          activeUrl={localizedPath(locale, APP_ROUTE_BY_ID[activeRoute].path)}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
