import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { logout, prepareWebLoginUrl } from '@/features/auth/api';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { useAuth } from '@/features/auth/auth-gate';
import {
  hasAnyTeamPermission,
  hasPermission,
} from '@/features/auth/permissions';
import type { AuthRoute } from '@/features/auth/types';
import { cn } from '@/lib/utils';
import { http } from '@/lib/http';
import {
  ArrowRight01Icon,
  DashboardBrowsingIcon,
  DashboardSquare01Icon,
  PackageOpenIcon,
  Route02Icon,
  UserGroupIcon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { usePathname, useRouter } from '@/router/compat';
import { resolveRouteIcon } from '@/features/browser-shell/route-icons';

import { AppNavUser } from './app-nav-user';
import { AppTeamSwitcher } from './app-team-switcher';
import { WebDesktopActions } from './web-desktop-actions';

type NavItem = {
  href: string;
  icon: typeof DashboardBrowsingIcon;
  title: string;
};

type NavGroup = {
  id: number;
  items: NavItem[];
  title?: string;
};

const navItemByAuthPath: Record<string, Omit<NavItem, 'title'>> = {
  '/index': {
    href: '/dashboard',
    icon: DashboardSquare01Icon,
  },
  '/dashboard': {
    href: '/dashboard',
    icon: DashboardSquare01Icon,
  },
  '/browser/environment': {
    href: '/environments',
    icon: DashboardBrowsingIcon,
  },
  '/browser/proxy': {
    href: '/proxies',
    icon: Route02Icon,
  },
  '/browser/team': {
    href: '/teams',
    icon: UserGroupIcon,
  },
  '/browser/member': {
    href: '/members',
    icon: UserMultipleIcon,
  },
  '/browser/assets': {
    href: '/versions',
    icon: PackageOpenIcon,
  },
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  React.useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { access, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const navGroups = React.useMemo(
    () => buildNavGroups(access.routes),
    [access.routes],
  );
  const showTeamShortcuts =
    hasPermission(access, 'browser:team:list') ||
    hasAnyTeamPermission(access, 'browser:team:list');

  async function handleLogout(switchAccount = false) {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      const loginUrl = switchAccount
        ? await prepareWebLoginUrl('/dashboard')
        : undefined;
      try {
        await logout();
      } finally {
        if (isTauriRuntime()) {
          http.updateTokens(null);
          await queryClient.cancelQueries();
          queryClient.clear();
          router.replace('/login');
        }
      }
      if (isTauriRuntime()) {
        if (loginUrl) {
          await desktopInvoke('open_external_url', {
            request: { url: loginUrl },
          });
        }
      } else {
        http.updateTokens(null);
        await queryClient.cancelQueries();
        queryClient.clear();
        window.location.replace(loginUrl ?? '/login');
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '账号操作失败，请重试',
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {isMobile ? (
        <div className="flex shrink-0 items-center justify-between border-b px-3 pt-[env(safe-area-inset-top)]">
          <span className="text-sm font-semibold">导航菜单</span>
          <SidebarTrigger className="size-11" aria-label="关闭导航菜单" />
        </div>
      ) : null}
      {showTeamShortcuts ? (
        <SidebarHeader>
          <AppTeamSwitcher access={access} />
        </SidebarHeader>
      ) : null}
      <SidebarContent className="py-0.5">
        {navGroups.map((group) => (
          <SidebarNavGroup key={group.id} group={group} pathname={pathname} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <WebDesktopActions />
        <AppNavUser
          user={user}
          isLoggingOut={isLoggingOut}
          onLogout={() => void handleLogout()}
          onSwitchAccount={() => void handleLogout(true)}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarNavGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const items = (
    <SidebarGroupContent>
      <SidebarMenu className="gap-0.5">
        {group.items.map((item) => (
          <SidebarNavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  );

  if (!group.title) {
    return <SidebarGroup className="py-0.5">{items}</SidebarGroup>;
  }

  return (
    <Collapsible className="group/collapsible" defaultOpen>
      <SidebarGroup className="py-0.5">
        <SidebarGroupLabel asChild className="h-6">
          <CollapsibleTrigger className="w-full cursor-pointer justify-between gap-2 text-left">
            <span className="min-w-0 flex-1 truncate text-left">
              {group.title}
            </span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>{items}</CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function SidebarNavItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const active = isActivePath(pathname, item.href);
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        size="sm"
        className={cn(
          'h-11 gap-1.5 md:h-7 [&_svg]:size-3.5',
          active &&
            'bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/15 hover:text-sidebar-primary font-medium',
        )}
        tooltip={item.title}
      >
        <Link
          to={item.href}
          aria-current={active ? 'page' : undefined}
          onClick={() => setOpenMobile(false)}
        >
          <HugeiconsIcon
            icon={item.icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          <span className="truncate">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function buildNavGroups(routes: AuthRoute[] | undefined): NavGroup[] {
  const seenPaths = new Set<string>();

  return (routes ?? []).flatMap((route) => {
    const items = collectNavItems(route, seenPaths);
    if (!items.length) {
      return [];
    }

    return [
      {
        id: route.id,
        items,
        ...(route.menu_type === 'M' ? { title: route.meta.title } : {}),
      },
    ];
  });
}

function collectNavItems(route: AuthRoute, seenPaths: Set<string>): NavItem[] {
  const items: NavItem[] = [];
  if (route.menu_type === 'C') {
    const configuredItem = navItemByAuthPath[route.path];
    const item = {
      href: configuredItem?.href ?? route.path,
      icon: resolveRouteIcon(
        route.meta.icon,
        configuredItem?.icon ?? DashboardBrowsingIcon,
      ),
    };
    if (!route.hidden && !seenPaths.has(route.path)) {
      seenPaths.add(route.path);
      items.push({
        ...item,
        title: route.meta.title,
      });
    }
  }

  route.children?.forEach((child) => {
    items.push(...collectNavItems(child, seenPaths));
  });

  return items;
}
