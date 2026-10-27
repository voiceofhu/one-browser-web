import { browserQueryKeys } from '@/features/browser/cache/query-keys';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import type { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { listRemoteEnvironments } from '../environments/api';
import { remoteEnvironmentQueryKeys } from '../environments/query-keys';
import {
  parseRemoteEnvironmentProfileId,
  remoteEnvironmentProfileId,
} from '../environments/runtime-profile-id';
import { openRemoteEnvironmentLocally } from '../environments/runtime';
import { openProfile } from './api';
import {
  toastBrowserOpenError,
  toastBrowserOpenSuccess,
} from './open-progress-toast';

const trayOpenRequestEvent = 'tray-open-environment';
const TRAY_ENVIRONMENT_LIMIT = 30;
const TRAY_SYNC_INTERVAL_MS = 60_000;
const TRAY_SYNC_DEBOUNCE_MS = 1_000;

type TrayEnvironment = {
  profileId: string;
  name: string;
  environmentNo: string | null;
};

/**
 * Keeps the desktop tray's environment list current and runs the open flow
 * when the user picks 打开环境 there (remote opens need the backend lease).
 */
export function useTrayEnvironments(queryClient: QueryClient) {
  useEffect(() => {
    if (!isTauriRuntime()) return;

    let disposed = false;
    let debounce: ReturnType<typeof setTimeout> | undefined;

    async function sync() {
      const environments = await loadTrayEnvironments();
      if (disposed) return;
      try {
        await desktopInvoke('sync_tray_environments', {
          request: { environments },
        });
      } catch (error) {
        console.warn('[tray] failed to sync environments', error);
      }
    }

    function scheduleSync() {
      clearTimeout(debounce);
      debounce = setTimeout(() => void sync(), TRAY_SYNC_DEBOUNCE_MS);
    }

    // Environment edits, renames and list refreshes all land in this cache.
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'success' &&
        event.query.queryKey[0] === remoteEnvironmentQueryKeys.environments()[0]
      ) {
        scheduleSync();
      }
    });

    async function handleOpenRequest(event: Event) {
      const profileId = (event as CustomEvent<{ profileId?: unknown }>).detail
        ?.profileId;
      if (typeof profileId !== 'string' || !profileId) return;
      try {
        const environmentId = parseRemoteEnvironmentProfileId(profileId);
        if (environmentId) {
          await openRemoteEnvironmentLocally(environmentId);
        } else {
          await openProfile({ profileId });
        }
        toastBrowserOpenSuccess();
      } catch (error) {
        toastBrowserOpenError(error);
      } finally {
        void queryClient.invalidateQueries({
          queryKey: remoteEnvironmentQueryKeys.environments(),
        });
        void queryClient.invalidateQueries({
          queryKey: browserQueryKeys.runtime(),
        });
      }
    }

    window.addEventListener(trayOpenRequestEvent, handleOpenRequest);
    void sync();
    const interval = setInterval(() => void sync(), TRAY_SYNC_INTERVAL_MS);

    return () => {
      disposed = true;
      clearTimeout(debounce);
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener(trayOpenRequestEvent, handleOpenRequest);
    };
  }, [queryClient]);
}

async function loadTrayEnvironments(): Promise<TrayEnvironment[]> {
  try {
    const page = await listRemoteEnvironments({
      page: 1,
      page_size: TRAY_ENVIRONMENT_LIMIT,
    });
    return page.list
      .filter((environment) => environment.status === '0')
      .map((environment) => ({
        profileId: remoteEnvironmentProfileId(environment),
        name: environment.name,
        environmentNo: environment.environment_no,
      }));
  } catch {
    // Signed out or offline: the tray still shows running environments.
    return [];
  }
}
