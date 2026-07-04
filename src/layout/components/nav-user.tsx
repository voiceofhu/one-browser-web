import * as React from "react"
import { NavLink } from "react-router"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { CurrentUser } from "@/types/admin"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  EllipsisVerticalIcon,
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
  const avatar = user?.avatar || ""
  const fallback = (displayName || "OB").slice(0, 2).toUpperCase()

  return (
    <SidebarMenu>
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
                    email={email}
                    fallback={fallback}
                    user={user}
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
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <UserInfoCard
                avatar={avatar}
                displayName={displayName}
                email={email}
                fallback={fallback}
                user={user}
                className="px-1 py-1.5"
              />
            </DropdownMenuLabel>
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
  email,
  fallback,
  size = "default",
  user,
}: {
  avatar: string
  className?: string
  displayName: string
  email: string
  fallback: string
  size?: "default" | "lg"
  user?: CurrentUser
}) {
  const account = user?.user_name || ""
  const phone = user?.phone_number || ""
  const meta = phone ? [account, phone].filter(Boolean).join(" · ") : account

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
        <span className="truncate text-xs text-muted-foreground">{email}</span>
        {meta ? (
          <span className="mt-1 truncate text-[0.6875rem] text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </div>
    </div>
  )
}
