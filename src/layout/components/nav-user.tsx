import * as React from "react"
import { NavLink } from "react-router"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { CurrentUser } from "@/types/admin"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  CircleUserRoundIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  LogOutIcon,
} from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { localizedPath } from "@/local"
import { cn } from "@/lib/utils"

export function NavUser({
  user,
  onLogout,
}: {
  user?: CurrentUser
  onLogout?: () => void
}) {
  const { isMobile } = useSidebar()
  const { locale, t } = useTranslation()
  const [hoverOpen, setHoverOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const displayName = user?.nick_name || user?.user_name || t("nav.guestName")
  const email = user?.email || t("nav.loginRequired")
  const userName = user?.user_name || t("nav.loginRequired")
  const avatar = user?.avatar || ""
  const fallback = (displayName || "OB").slice(0, 2).toUpperCase()
  const downloadUrl = localizedPath(locale, "/")

  return (
    <SidebarMenu className="gap-2">
      <SidebarMenuItem>
        <SidebarDownloadClientCard
          href={downloadUrl}
          title={t("nav.downloadClient")}
          description={t("nav.downloadClientDescription")}
        />
      </SidebarMenuItem>
      <SidebarMenuItem>
        <DropdownMenu
          open={menuOpen}
          onOpenChange={(open) => {
            setMenuOpen(open)
            if (open) {
              setHoverOpen(false)
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <HoverCard
                open={menuOpen ? false : hoverOpen}
                openDelay={120}
                closeDelay={120}
                onOpenChange={setHoverOpen}
              >
                <HoverCardTrigger asChild>
                  <span className="inline-flex shrink-0">
                    <UserAvatar
                      avatar={avatar}
                      displayName={displayName}
                      fallback={fallback}
                    />
                  </span>
                </HoverCardTrigger>
                <HoverCardContent
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={8}
                  className="w-64 p-3"
                >
                  <UserInfoCard
                    avatar={avatar}
                    displayName={displayName}
                    fallback={fallback}
                    userName={userName}
                    size="lg"
                  />
                </HoverCardContent>
              </HoverCard>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup className="flex flex-col gap-2 p-1">
              <UserInfoCard
                avatar={avatar}
                displayName={displayName}
                fallback={fallback}
                userName={userName}
                className="px-1 py-1.5"
              />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <NavLink to={localizedPath(locale, "/account/profile")}>
                  <CircleUserRoundIcon />
                  {t("nav.accountSettings")}
                </NavLink>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLogout}>
              <LogOutIcon />
              {t("nav.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function SidebarDownloadClientCard({
  description,
  href,
  title,
}: {
  description: string
  href: string
  title: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className={cn(
        "group/download flex h-11 items-center gap-2 rounded-md px-2.5 text-sidebar-foreground outline-hidden transition-[background-color,color,box-shadow] duration-150 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-border),0_8px_20px_-16px_var(--sidebar-ring)] focus-visible:ring-2 focus-visible:ring-sidebar-ring [&_svg]:size-4 [&_svg]:shrink-0",
        "group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-[background-color,color,box-shadow,transform] duration-150 group-hover/download:-translate-y-px group-hover/download:bg-primary group-hover/download:text-primary-foreground group-hover/download:shadow-sm group-hover/download:shadow-primary/20 group-focus-visible/download:bg-primary group-focus-visible/download:text-primary-foreground">
        <DownloadIcon />
      </span>
      <span className="grid min-w-0 flex-1 gap-1 text-left leading-none group-data-[collapsible=icon]:hidden">
        <span className="truncate text-[0.8125rem] leading-none font-medium transition-colors duration-150">
          {title}
        </span>
        <span className="truncate text-[0.6875rem] leading-none text-sidebar-foreground/60 transition-colors duration-150 group-hover/download:text-sidebar-accent-foreground/70 group-focus-visible/download:text-sidebar-accent-foreground/70">
          {description}
        </span>
      </span>
      <ExternalLinkIcon className="text-sidebar-foreground/50 opacity-0 transition-[color,opacity,transform] duration-150 group-hover/download:translate-x-0.5 group-hover/download:text-sidebar-accent-foreground/70 group-hover/download:opacity-100 group-focus-visible/download:translate-x-0.5 group-focus-visible/download:text-sidebar-accent-foreground/70 group-focus-visible/download:opacity-100 group-data-[collapsible=icon]:hidden" />
    </a>
  )
}

function UserAvatar({
  avatar,
  displayName,
  fallback,
  size = "default",
}: {
  avatar: string
  displayName: string
  fallback: string
  size?: "default" | "lg"
}) {
  return (
    <Avatar className="rounded-full" size={size}>
      <AvatarImage src={avatar} alt={displayName} className="rounded-full" />
      <AvatarFallback className="rounded-full">{fallback}</AvatarFallback>
    </Avatar>
  )
}

function UserInfoCard({
  avatar,
  className,
  displayName,
  fallback,
  size = "default",
  userName,
}: {
  avatar: string
  className?: string
  displayName: string
  fallback: string
  size?: "default" | "lg"
  userName: string
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <UserAvatar
        avatar={avatar}
        displayName={displayName}
        fallback={fallback}
        size={size}
      />
      <div className="grid min-w-0 flex-1 text-left leading-tight">
        <span className="truncate text-sm font-medium">{displayName}</span>
        <span className="truncate text-xs text-muted-foreground">
          {userName}
        </span>
      </div>
    </div>
  )
}
