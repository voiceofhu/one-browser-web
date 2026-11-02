import { UpdateAvailableNotice } from '@/components/update-available-notice';
import { reloadForUpdate, startAppUpdateCheck } from '@/lib/app-update';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import {
  hasAppUpdate,
  useAppUpdateStatus,
  useCheckAppUpdateOnShow,
  useInstallAppUpdate,
} from '@/lib/desktop/app-updater';
import { onDesktopForeground } from '@/lib/desktop/foreground';
import * as React from 'react';
import { toast } from 'sonner';

import {
  DESKTOP_APP_DOWNLOAD_URL,
  type DesktopAppUpdate,
  findDesktopAppUpdate,
} from './desktop-app-update';

export function AppUpdateChecker() {
  const [pageUpdateAvailable, setPageUpdateAvailable] = React.useState(false);
  // Apps with the in-app updater download, verify, install and restart;
  // older apps get the download page.
  const native = useAppUpdateStatus();
  const nativeUpdate = native.data;
  const install = useInstallAppUpdate();
  const [dismissed, setDismissed] = React.useState<string | null>(null);
  useCheckAppUpdateOnShow(native.isSuccess);
  const [desktopUpdate, setDesktopUpdate] =
    React.useState<DesktopAppUpdate | null>(null);
  const desktopCheckInFlight = React.useRef(false);

  React.useEffect(() => {
    const start = () => startAppUpdateCheck(() => setPageUpdateAvailable(true));
    let stop = start();
    const stopForeground = isTauriRuntime()
      ? onDesktopForeground(() => {
          stop();
          stop = start();
        })
      : () => {};
    return () => {
      stopForeground();
      stop();
    };
  }, []);

  const requestDesktopCheck = React.useCallback(async (source: string) => {
    if (desktopCheckInFlight.current) {
      return;
    }

    desktopCheckInFlight.current = true;
    try {
      const update = await findDesktopAppUpdate();
      setDesktopUpdate(update);
    } catch (error) {
      console.debug(`Desktop app update check failed (${source}).`, error);
    } finally {
      desktopCheckInFlight.current = false;
    }
  }, []);

  const legacy = native.isError;
  React.useEffect(() => {
    if (!legacy) {
      return;
    }

    const stopForeground = onDesktopForeground(() => {
      void requestDesktopCheck('foreground');
    });
    const mountCheck = window.setTimeout(() => {
      void requestDesktopCheck('mount');
    }, 0);

    return () => {
      window.clearTimeout(mountCheck);
      stopForeground();
    };
  }, [legacy, requestDesktopCheck]);

  async function openDesktopDownloadPage() {
    try {
      await desktopInvoke('open_external_url', {
        request: { url: DESKTOP_APP_DOWNLOAD_URL },
      });
      setDesktopUpdate(null);
    } catch (error) {
      console.warn('Failed to open the desktop app download page.', error);
    }
  }

  async function installNativeUpdate() {
    try {
      await install.mutateAsync();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败');
    }
  }

  const nativeVersion = nativeUpdate?.version ?? null;
  const showNative =
    hasAppUpdate(nativeUpdate) &&
    nativeVersion !== null &&
    dismissed !== nativeVersion;

  return (
    <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:w-full">
      <UpdateAvailableNotice
        open={pageUpdateAvailable}
        onOpenChange={setPageUpdateAvailable}
        onUpdate={reloadForUpdate}
      />
      <UpdateAvailableNotice
        open={showNative}
        onOpenChange={(open) => {
          if (!open) setDismissed(nativeVersion);
        }}
        onUpdate={installNativeUpdate}
        currentVersion={nativeUpdate?.current}
        latestVersion={nativeVersion ?? undefined}
        description="会先关闭正在运行的浏览器环境，再安装并重新打开 One Browser。"
        updateLabel="下载并重启"
        updatingLabel={
          nativeUpdate?.state === 'installing' ? '正在安装…' : '正在下载…'
        }
        resetUpdatingAfterUpdate
      />
      <UpdateAvailableNotice
        open={desktopUpdate !== null}
        onOpenChange={(open) => {
          if (!open) setDesktopUpdate(null);
        }}
        onUpdate={openDesktopDownloadPage}
        currentVersion={desktopUpdate?.currentVersion}
        latestVersion={desktopUpdate?.latestVersion}
        description="点击更新，下载安装后即可使用新版本。"
        updatingLabel="正在打开…"
        resetUpdatingAfterUpdate
      />
    </div>
  );
}
