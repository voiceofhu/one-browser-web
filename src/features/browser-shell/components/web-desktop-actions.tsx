import { DialogActionButton } from '@/components/ui/dialog-action-button';
import {
  ResponsiveDialogClose,
  ResponsiveDialogFooter,
} from '@/components/responsive-dialog';
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { AppDownloadCard } from '@/features/app-download/download-card';
import {
  consumeDownloadPrompt,
  isDownloadPromptRequested,
  subscribeDownloadPrompt,
} from '@/features/app-download/session';
import { isTauriRuntime } from '@/lib/desktop';
import { launchDesktopApp } from '@/lib/desktop/app-gate';
import { usePathname } from '@/router/compat';
import { Download01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';

export function WebDesktopActions() {
  const [downloadOpen, setDownloadOpen] = React.useState(false);
  const pathname = usePathname();

  const downloadRequested = React.useSyncExternalStore(
    subscribeDownloadPrompt,
    isDownloadPromptRequested,
    () => false,
  );
  const showDownloadPrompt = pathname === '/dashboard' && downloadRequested;

  function handleDownloadOpenChange(open: boolean) {
    setDownloadOpen(open);
    if (!open) consumeDownloadPrompt();
  }

  if (isTauriRuntime()) return null;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="用当前账号打开桌面客户端"
            className="h-11 gap-2 text-[0.8125rem] md:h-8"
            onClick={() => void launchDesktopApp()}
          >
            <img src="/pwa-512x512.png" alt="" className="size-4 rounded-sm" />
            <span className="truncate">打开桌面客户端</span>
          </SidebarMenuButton>
          <SidebarMenuAction
            aria-label="下载桌面客户端"
            title="下载桌面客户端"
            className="top-1! size-9 md:size-6"
            onClick={() => setDownloadOpen(true)}
          >
            <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu>

      <ResponsiveDialog
        open={downloadOpen || showDownloadPrompt}
        onOpenChange={handleDownloadOpenChange}
      >
        <ResponsiveDialogContent className="sm:max-w-2xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>下载桌面客户端</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              自动推荐当前系统，也可以手动选择其他安装包。
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <AppDownloadCard className="ring-0" showHeader={false} />
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <DialogActionButton action="cancel" type="button">
                关闭
              </DialogActionButton>
            </ResponsiveDialogClose>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
