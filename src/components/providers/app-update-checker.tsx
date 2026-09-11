import { UpdateAvailableNotice } from '@/components/update-available-notice';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import * as React from 'react';

import {
  DESKTOP_APP_DOWNLOAD_URL,
  type DesktopAppUpdate,
  findDesktopAppUpdate,
} from './desktop-app-update';

const APP_UPDATE_CHECKER_WORKER_URL = '/app-update-checker.worker.js';

type AppUpdateCheckerWorkerMessage = {
  type: 'baseline' | 'unchanged' | 'changed' | 'unavailable' | 'error';
  message?: string;
};

export function AppUpdateChecker() {
  const [pageUpdateAvailable, setPageUpdateAvailable] = React.useState(false);
  const [desktopUpdate, setDesktopUpdate] =
    React.useState<DesktopAppUpdate | null>(null);
  const desktopCheckInFlight = React.useRef(false);

  React.useEffect(() => {
    if (
      !import.meta.env.PROD ||
      typeof window === 'undefined' ||
      typeof Worker === 'undefined' ||
      !isHttpProtocol(window.location.protocol)
    ) {
      return;
    }

    let worker: Worker;

    try {
      worker = new Worker(
        `${APP_UPDATE_CHECKER_WORKER_URL}?build=${encodeURIComponent(__APP_BUILD_ID__)}`,
        {
          name: 'app-update-checker',
          type: 'module',
        },
      );
    } catch (error) {
      console.warn('App update checker worker failed to start.', error);
      return;
    }

    const requestCheck = (source: string) => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      worker.postMessage({
        type: 'check',
        source,
        url: new URL(
          '',
          new URL(import.meta.env.BASE_URL, window.location.origin),
        ).toString(),
      });
    };

    const handleWorkerMessage = (
      event: MessageEvent<AppUpdateCheckerWorkerMessage>,
    ) => {
      const message = event.data;
      if (!message) {
        return;
      }

      if (message.type === 'changed') {
        setPageUpdateAvailable(true);
        return;
      }

      if (message.type === 'error') {
        console.debug('App update check failed.', message.message);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestCheck('visibilitychange');
      }
    };

    worker.addEventListener('message', handleWorkerMessage);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const onOnline = () => requestCheck('online');
    window.addEventListener('online', onOnline);
    const interval = window.setInterval(() => requestCheck('interval'), 60_000);
    requestCheck('mount');

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', onOnline);
      worker.removeEventListener('message', handleWorkerMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      worker.terminate();
    };
  }, []);

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
        onUpdate={reloadWithTimestamp}
      />
      <UpdateAvailableNotice
        open={desktopUpdate !== null}
        onOpenChange={(open) => {
          if (!open) setDesktopUpdate(null);
        }}
        onUpdate={openDesktopDownloadPage}
        title="客户端有更新"
        description={
          desktopUpdate
            ? `v${desktopUpdate.currentVersion} → v${desktopUpdate.latestVersion}，下载安装后生效。`
            : undefined
        }
        updateLabel="下载客户端"
        updatingLabel="正在打开…"
        resetUpdatingAfterUpdate
      />
    </div>
  );
}

function reloadWithTimestamp() {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('t', Date.now().toString());
  window.location.replace(nextUrl.toString());
}

function isHttpProtocol(protocol: string) {
  return protocol === 'http:' || protocol === 'https:';
}
