import * as React from "react"
import { NavLink, useLocation, useNavigate } from "react-router"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { CurrentUser } from "@/types/admin"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ThemeModeToggle } from "@/components/theme/theme-mode-toggle"
import {
  CircleUserRoundIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  LanguagesIcon,
  LogOutIcon,
} from "lucide-react"

import { useLanguage } from "@/components/providers/language-context"
import {
  LOCALE_OPTIONS,
  localizedPath,
  normalizeLocale,
  withLocaleInPath,
} from "@/local"
import { cn } from "@/lib/utils"

export function NavUser({
  user,
  onLogout,
}: {
  user?: CurrentUser
  onLogout?: () => void
}) {
  const { isMobile } = useSidebar()
  const { locale, setLocale, t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const displayName = user?.nick_name || user?.user_name || t("nav.guestName")
  const email = user?.email || t("nav.loginRequired")
  const avatar = user?.avatar || ""
  const fallback = (displayName || "OB").slice(0, 2).toUpperCase()
  const downloadUrl = localizedPath(locale, "/")

  function handleLocaleChange(value: string) {
    const nextLocale = normalizeLocale(value)
    setLocale(nextLocale)

    const nextPathname = withLocaleInPath(location.pathname, nextLocale)
    if (nextPathname !== location.pathname) {
      navigate(`${nextPathname}${location.search}${location.hash}`)
    }
  }

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
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                avatar={avatar}
                displayName={displayName}
                fallback={fallback}
              />
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
            className="min-w-64"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal text-foreground">
              <UserInfoCard
                displayName={displayName}
                email={email}
                className="px-2 py-1.5"
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
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("nav.preferences")}</DropdownMenuLabel>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <span>{t("nav.theme")}</span>
                <ThemeModeToggle
                  className="ml-auto"
                  label={t("nav.theme")}
                  labels={{
                    "theme.system": t("theme.system"),
                    "theme.light": t("theme.light"),
                    "theme.dark": t("theme.dark"),
                  }}
                />
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <LanguagesIcon />
                  <span>{t("nav.language")}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="min-w-40">
                  <DropdownMenuRadioGroup
                    value={locale}
                    onValueChange={handleLocaleChange}
                  >
                    {LOCALE_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.value}
                        value={option.value}
                      >
                        {t(option.labelKey)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                <LogOutIcon />
                {t("nav.logout")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
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
  className,
  displayName,
  email,
}: {
  className?: string
  displayName: string
  email: string
}) {
  return (
    <div className={cn("grid min-w-0 text-left leading-tight", className)}>
      <span className="truncate text-sm font-medium" title={displayName}>
        {displayName}
      </span>
      <span className="truncate text-xs text-muted-foreground" title={email}>
        {email}
      </span>
    </div>
  )
}
