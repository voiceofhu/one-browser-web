import type * as React from "react"
import {
  BookOpenTextIcon,
  Building2Icon,
  CalendarClockIcon,
  ClipboardListIcon,
  FileBadgeIcon,
  FileClockIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  ServerCogIcon,
  ShieldIcon,
  UserRoundCheckIcon,
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
  notices: <MegaphoneIcon />,
  "operation-logs": <ClipboardListIcon />,
  "login-logs": <FileClockIcon />,
  health: <ServerCogIcon />,
  "online-users": <UserRoundCheckIcon />,
  jobs: <CalendarClockIcon />,
  account: <UserRoundIcon />,
}
