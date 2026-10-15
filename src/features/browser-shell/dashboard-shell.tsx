import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DesktopAppGateProvider } from '@/lib/desktop/app-gate';
import { isTauriRuntime } from '@/lib/desktop';
import { useDesktopPlatform } from '@/lib/desktop/use-desktop-platform';
import * as React from 'react';

import { AppFooter } from './components/app-footer';
import { AppSidebar } from './components/app-sidebar';
import { SiteHeader } from './components/site-header';
import { BrowserShellProvider } from './browser-shell-context';

export { useBrowserShell } from './browser-shell-context';

export function DashboardShell({ children }: React.PropsWithChildren) {
  const platform = useDesktopPlatform();
  const isMobile = useIsMobile();
  const showSiteHeader = isTauriRuntime() && platform === 'macos';

  return (
    <BrowserShellProvider>
      <DesktopAppGateProvider>
        <SidebarProvider
          className="bg-muted h-dvh min-w-0 flex-col"
          style={
            {
              '--sidebar-width': '11.25rem',
              '--header-height': '2rem',
            } as React.CSSProperties
          }
        >
          <div
            className={cn(
              'bg-muted flex min-h-0 flex-1 flex-col overflow-hidden',
              showSiteHeader
                ? 'border-border/70 rounded-[var(--app-radius)] border shadow-none'
                : 'rounded-none border-0 shadow-none',
            )}
          >
            {showSiteHeader ? <SiteHeader /> : null}
            <header className="bg-sidebar flex shrink-0 items-center gap-2 border-b px-2 pt-[env(safe-area-inset-top)] md:hidden">
              <SidebarTrigger className="size-11" aria-label="打开导航菜单" />
              <span className="text-sm font-semibold">One Browser</span>
            </header>
            <div className="flex min-h-0 min-w-0 flex-1">
              <AppSidebar
                collapsible={isMobile ? 'offcanvas' : 'none'}
                className="bg-sidebar shrink-0 border-r"
              />
              <SidebarInset className="bg-muted min-w-0 rounded-none shadow-none md:m-0 md:peer-data-[variant=inset]:m-0">
                <div
                  data-slot="app-content"
                  className="app-content-container flex min-h-0 w-full flex-1 flex-col"
                >
                  {children}
                </div>
              </SidebarInset>
            </div>
            <AppFooter />
          </div>
        </SidebarProvider>
      </DesktopAppGateProvider>
    </BrowserShellProvider>
  );
}
