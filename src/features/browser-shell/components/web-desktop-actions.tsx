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
      <SidebarMenu className="gap-1">
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            tooltip="下载 One Browser"
            onClick={() => setDownloadOpen(true)}
          >
            <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
            </span>
            <span className="grid min-w-0 flex-1 gap-1 text-left leading-none">
              <span className="truncate text-[0.8125rem] font-medium">
                下载浏览器
              </span>
              <span className="text-muted-foreground truncate text-[0.6875rem]">
                查询最新版安装包
              </span>
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            tooltip="打开 One Browser"
            onClick={() => void launchDesktopApp()}
          >
            <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
              <img
                src="/pwa-512x512.png"
                alt=""
                className="size-5 rounded-sm"
              />
            </span>
            <span className="grid min-w-0 flex-1 gap-1 text-left leading-none">
              <span className="truncate text-[0.8125rem] font-medium">
                打开 One Browser
              </span>
              <span className="text-muted-foreground truncate text-[0.6875rem]">
                使用桌面客户端
              </span>
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <ResponsiveDialog
        open={downloadOpen || showDownloadPrompt}
        onOpenChange={handleDownloadOpenChange}
      >
        <ResponsiveDialogContent className="sm:max-w-2xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>下载浏览器</ResponsiveDialogTitle>
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
