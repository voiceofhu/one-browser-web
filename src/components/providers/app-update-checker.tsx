import { UpdateNotice } from '@/components/ui/update-notice';
import {
  isUpdateSnoozed,
  snoozeUpdateForToday,
  startAppUpdateCheck,
} from '@/lib/app-update';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import {
  hasAppUpdate,
  useAppUpdateStatus,
  useCheckAppUpdateOnShow,
  useInstallAppUpdate,
} from '@/lib/desktop/app-updater';
import { onDesktopForeground } from '@/lib/desktop/foreground';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

import {
  DESKTOP_APP_DOWNLOAD_URL,
  type DesktopAppUpdate,
  findDesktopAppUpdate,
} from './desktop-app-update';

export function AppUpdateChecker() {
  const [pageUpdateAvailable, setPageUpdateAvailable] = React.useState(false);
  // Apps with the in-app updater download in the background, then one click
  // installs and restarts; older apps get the download page.
  const native = useAppUpdateStatus();
  const nativeUpdate = native.data;
  const install = useInstallAppUpdate();
  const [dismissed, setDismissed] = React.useState<string | null>(null);
  // a failed install remounts the notice so its button is usable again
  const [attempt, setAttempt] = React.useState(0);
  useCheckAppUpdateOnShow(native.isSuccess);
  const [desktopUpdate, setDesktopUpdate] =
    React.useState<DesktopAppUpdate | null>(null);
  const desktopCheckInFlight = React.useRef(false);

  React.useEffect(() => {
    // Checks keep running while snoozed, so the notice returns on the first
    // check after midnight.
    const start = () =>
      startAppUpdateCheck(() => {
        if (!isUpdateSnoozed()) setPageUpdateAvailable(true);
      });
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
      setAttempt((n) => n + 1);
    }
  }

  async function installNativeUpdate() {
    try {
      await install.mutateAsync();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败');
      setAttempt((n) => n + 1);
    }
  }

  const nativeVersion = nativeUpdate?.version ?? null;
  // Clicked while the update still had to download: stays up through it.
  const showNative =
    (hasAppUpdate(nativeUpdate) || install.isPending) &&
    nativeVersion !== null &&
    dismissed !== nativeVersion;

  // One notice at a time: the app update wins, then the download page for
  // older apps, then a new deploy of these pages.
  if (showNative) {
    return (
      <UpdateNotice
        key={`native-${attempt}`}
        open
        onLater={() => setDismissed(nativeVersion)}
        onUpdate={() => void installNativeUpdate()}
        labels={{
          title: `新版本 v${nativeVersion} 已就绪`,
          description:
            '会先关闭正在运行的浏览器环境，更新后自动重新打开 One Browser。',
          action: '立即更新',
          updating:
            nativeUpdate?.state === 'installing' ? '正在安装…' : '正在下载…',
          later: '稍后提醒',
        }}
      />
    );
  }

  if (desktopUpdate !== null) {
    return (
      <UpdateNotice
        key={`desktop-${attempt}`}
        open
        onLater={() => setDesktopUpdate(null)}
        onUpdate={() => void openDesktopDownloadPage()}
        labels={{
          title: `新版本 v${desktopUpdate.latestVersion} 已发布`,
          description: '点击更新，下载安装后即可使用新版本。',
          action: '立即更新',
          updating: '正在打开…',
          later: '稍后提醒',
        }}
      />
    );
  }

  return (
    <UpdateNotice
      open={pageUpdateAvailable}
      onLater={() => {
        snoozeUpdateForToday();
        setPageUpdateAvailable(false);
      }}
      labels={{
        title: '新版本已发布',
        description: '点击更新，刷新页面后即可使用新版本。',
        action: '立即更新',
        updating: '正在更新…',
        later: '稍后提醒',
      }}
    />
  );
}
