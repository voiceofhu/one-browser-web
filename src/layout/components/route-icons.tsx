import type * as React from "react"
import {
  BookOpenTextIcon,
  Building2Icon,
  ClipboardListIcon,
  FileBadgeIcon,
  FileClockIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  ServerCogIcon,
  ShieldIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react"

import type { AppRouteId } from "@/router/routes"

export const routeIcons: Record<AppRouteId, React.ReactNode> = {
  overview: <LayoutDashboardIcon />,
  users: <UsersIcon />,
  roles: <ShieldIcon />,
  menus: <KeyRoundIcon />,
  depts: <Building2Icon />,
  posts: <FileBadgeIcon />,
  dict: <BookOpenTextIcon />,
  "operation-logs": <ClipboardListIcon />,
  "login-logs": <FileClockIcon />,
  health: <ServerCogIcon />,
  account: <UserRoundIcon />,
}
