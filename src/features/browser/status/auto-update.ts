import { browserQueryKeys } from '@/features/browser/cache/query-keys';
import { isTauriRuntime } from '@/lib/desktop';
import { onDesktopForeground } from '@/lib/desktop/foreground';
import type { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  getAppStatus,
  getChromiumDownloadManifest,
  startChromiumDownload,
} from './api';
import { isNetworkUnavailable } from './network-guard';

const AUTO_UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;
// Foreground/visibility checks are cheap (one manifest request), so they only
// dedupe bursts of focus events instead of waiting for the periodic interval.
const AUTO_UPDATE_FOREGROUND_DEDUPE_MS = 60 * 1000;
const AUTO_UPDATE_STARTED_KEY = '__oneBrowserChromiumAutoUpdateStarted';

let lastAutoUpdateCheckAt = 0;
let autoUpdateCheckPromise: Promise<void> | null = null;

export function useChromiumAutoUpdate(queryClient: QueryClient) {
  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    const state = window as Window & {
      [AUTO_UPDATE_STARTED_KEY]?: boolean;
    };
    if (state[AUTO_UPDATE_STARTED_KEY]) {
      return;
    }

    state[AUTO_UPDATE_STARTED_KEY] = true;
    void runChromiumAutoUpdateCheck(queryClient, 0);
    const intervalId = window.setInterval(() => {
      void runChromiumAutoUpdateCheck(
        queryClient,
        AUTO_UPDATE_CHECK_INTERVAL_MS,
      );
    }, AUTO_UPDATE_CHECK_INTERVAL_MS);
    const stopForeground = onDesktopForeground(() => {
      void runChromiumAutoUpdateCheck(
        queryClient,
        AUTO_UPDATE_FOREGROUND_DEDUPE_MS,
      );
    });

    return () => {
      window.clearInterval(intervalId);
      stopForeground();
      state[AUTO_UPDATE_STARTED_KEY] = false;
    };
  }, [queryClient]);
}

async function runChromiumAutoUpdateCheck(
  queryClient: QueryClient,
  minIntervalMs: number,
) {
  const now = Date.now();
  if (autoUpdateCheckPromise || now - lastAutoUpdateCheckAt < minIntervalMs) {
    return;
  }

  lastAutoUpdateCheckAt = now;
  autoUpdateCheckPromise = (async () => {
    try {
      const status = await queryClient.fetchQuery({
        queryKey: browserQueryKeys.status(),
        queryFn: getAppStatus,
        staleTime: 0,
      });

      if (isNetworkUnavailable(status) || status.settings.chromiumPath) {
        return;
      }

      const manifest = await getChromiumDownloadManifest();
      // Every build installs into its own <asset>/<version> directory, so a
      // newer version never touches the binaries of running windows. Only a
      // re-install of the version in use (same version, new SHA) could, so
      // that case waits until no browser is running.
      if (
        status.runningCount > 0 &&
        isCurrentChromiumVersion(status.chromiumPath.path, manifest.version)
      ) {
        return;
      }

      await startChromiumDownload(manifest);
    } catch (error) {
      console.warn('failed to check browser update', error);
    }
  })().finally(() => {
    autoUpdateCheckPromise = null;
  });

  await autoUpdateCheckPromise;
}

function isCurrentChromiumVersion(path: string | null, version: string) {
  if (!path || !version) {
    return true;
  }

  return path.split(/[\\/]/).includes(version);
}
