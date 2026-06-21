import * as React from "react"
import { NavLink } from "react-router"
import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
        <NavMainGroup
          key={group.label}
          group={group}
          activeUrl={activeUrl}
        />
      ))}
    </>
  )
}

function NavMainGroup({
  group,
  activeUrl,
}: {
  group: NavMainGroup
  activeUrl?: string
}) {
  const isActiveGroup = group.items.some((item) => item.url === activeUrl)
  const [open, setOpen] = React.useState(true)

  React.useEffect(() => {
    if (isActiveGroup) {
      setOpen(true)
    }
  }, [isActiveGroup])

  if (group.showLabel === false) {
    return (
      <SidebarGroup className="py-1">
        <NavMainItems group={group} activeUrl={activeUrl} />
      </SidebarGroup>
    )
  }

  return (
    <Collapsible
      className="group/collapsible"
      open={open}
      onOpenChange={setOpen}
    >
      <SidebarGroup className="py-1">
        <SidebarGroupLabel asChild className="h-7">
          <CollapsibleTrigger className="w-full cursor-pointer justify-between gap-2 text-left">
            <span className="min-w-0 flex-1 truncate text-left">
              {group.label}
            </span>
            <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <NavMainItems group={group} activeUrl={activeUrl} />
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function NavMainItems({
  group,
  activeUrl,
}: {
  group: NavMainGroup
  activeUrl?: string
}) {
  return (
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
  )
}
