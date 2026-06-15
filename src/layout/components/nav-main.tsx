import { NavLink } from "react-router"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type NavMainItem = {
  title: string
  url: string
  icon?: React.ReactNode
}

export type NavMainGroup = {
  label: string
  showLabel?: boolean
  items: NavMainItem[]
}

export function NavMain({
  groups,
  activeUrl,
}: {
  groups: NavMainGroup[]
  activeUrl?: string
}) {
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          {group.showLabel === false ? null : (
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={item.url === activeUrl}
                  >
                    <NavLink to={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
