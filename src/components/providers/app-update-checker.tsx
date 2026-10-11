import { UpdateAvailableNotice } from '@/components/update-available-notice';
import { reloadForUpdate, startAppUpdateCheck } from '@/lib/app-update';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import * as React from 'react';

import {
  DESKTOP_APP_DOWNLOAD_URL,
  type DesktopAppUpdate,
  findDesktopAppUpdate,
} from './desktop-app-update';

export function AppUpdateChecker() {
  const [pageUpdateAvailable, setPageUpdateAvailable] = React.useState(false);
  const [desktopUpdate, setDesktopUpdate] =
    React.useState<DesktopAppUpdate | null>(null);
  const desktopCheckInFlight = React.useRef(false);

  React.useEffect(
    () => startAppUpdateCheck(() => setPageUpdateAvailable(true)),
    [],
  );

  const requestDesktopCheck = React.useCallback(async (source: string) => {
    if (
      !import.meta.env.PROD ||
      !isTauriRuntime() ||
      desktopCheckInFlight.current
    ) {
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

  React.useEffect(() => {
    if (!import.meta.env.PROD || !isTauriRuntime()) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestDesktopCheck('visibilitychange');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const mountCheck = window.setTimeout(() => {
      void requestDesktopCheck('mount');
    }, 0);

    return () => {
      window.clearTimeout(mountCheck);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [requestDesktopCheck]);

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

  return (
    <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:w-full">
      <UpdateAvailableNotice
        open={pageUpdateAvailable}
        onOpenChange={setPageUpdateAvailable}
        onUpdate={reloadForUpdate}
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
