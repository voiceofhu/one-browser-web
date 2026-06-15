import * as React from "react"
import { NavLink } from "react-router"

import { NavMain } from "@/layout/components/nav-main"
import { NavUser } from "@/layout/components/nav-user"
import type { CurrentUser } from "@/types/admin"
import {
  APP_ROUTE_BY_ID,
  APP_ROUTE_GROUPS,
  type AppRouteId,
} from "@/router/routes"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  BookOpenTextIcon,
  Building2Icon,
  DatabaseIcon,
  FileBadgeIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  MenuIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  activeRoute: AppRouteId
  currentUser?: CurrentUser
  onLogout?: () => void
}

const routeIcons: Record<AppRouteId, React.ReactNode> = {
  overview: <LayoutDashboardIcon />,
  users: <UsersIcon />,
  roles: <ShieldIcon />,
  menus: <MenuIcon />,
  depts: <Building2Icon />,
  posts: <FileBadgeIcon />,
  "dict-types": <BookOpenTextIcon />,
  "dict-data": <DatabaseIcon />,
  health: <HeartPulseIcon />,
}

export function AppSidebar({
  activeRoute,
  currentUser,
  onLogout,
  ...props
}: AppSidebarProps) {
  const navGroups = APP_ROUTE_GROUPS.map((group) => ({
    label: group.label,
    showLabel: group.routes[0] === "overview" ? false : undefined,
    items: group.routes.map((routeId) => {
      const route = APP_ROUTE_BY_ID[routeId]
      return {
        title: route.label,
        url: route.path,
        icon: routeIcons[route.id],
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
              <NavLink to="/index">
                <img
                  src="/pwa-512x512.png"
                  alt=""
                  className="size-6 rounded-md"
                />
                <span className="text-base font-semibold">One Browser</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          groups={navGroups}
          activeUrl={APP_ROUTE_BY_ID[activeRoute].path}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
