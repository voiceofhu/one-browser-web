import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { onDesktopForeground } from '@/lib/desktop/foreground';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/** The in-app updater (app/src-tauri/src/updater.rs); `update-status` events carry the same shape. */
export interface AppUpdateStatus {
  state:
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'ready'
    | 'installing'
    | 'error';
  current: string;
  version: string | null;
  notes: string | null;
  received: number;
  total: number | null;
  error: string | null;
  /** Unix seconds of the last check that got an answer. */
  checkedAt: number | null;
  /** Why this copy cannot update itself (e.g. run from the DMG). */
  blocked: string | null;
}

export const appUpdateKey = ['app-update-status'] as const;
const ACTIVE = new Set<AppUpdateStatus['state']>([
  'checking',
  'downloading',
  'installing',
]);
/** Coming back to the foreground within this long does not check again. */
const RECHECK_MS = 60_000;

/**
 * The shell's updater state: pushed as `update-status`, polled while something
 * runs. Errors on apps released before the updater (callers fall back to the
 * download page).
 */
export function useAppUpdateStatus() {
  const qc = useQueryClient();
  const enabled = import.meta.env.PROD && isTauriRuntime();
  const query = useQuery({
    queryKey: appUpdateKey,
    queryFn: () => desktopInvoke<AppUpdateStatus>('update_status'),
    enabled,
    retry: false,
    staleTime: Infinity,
    refetchInterval: (q) =>
      q.state.data && ACTIVE.has(q.state.data.state) ? 1000 : false,
  });
  useEffect(() => {
    if (!enabled) return;
    let off: (() => void) | undefined;
    let cancelled = false;
    void import('@tauri-apps/api/event')
      .then(({ listen }) =>
        listen<AppUpdateStatus>('update-status', ({ payload }) =>
          qc.setQueryData(appUpdateKey, payload),
        ),
      )
      .then((unlisten) => {
        if (cancelled) unlisten();
        else off = unlisten;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      off?.();
    };
  }, [enabled, qc]);
  return query;
}

/** Checks now; a found update downloads in the background. */
export function checkAppUpdate() {
  return desktopInvoke<AppUpdateStatus>('update_check');
}

/**
 * The shell also checks on its own (20 s after start, then every 6 h); the
 * window checks when it comes up and each time it comes back to the
 * foreground. `enabled` once the shell is known to have the updater.
 */
export function useCheckAppUpdateOnShow(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    let last = 0;
    const check = () => {
      if (Date.now() - last < RECHECK_MS) return;
      last = Date.now();
      checkAppUpdate()
        .then((s) => qc.setQueryData(appUpdateKey, s))
        .catch(() => undefined);
    };
    const mount = window.setTimeout(check, 0);
    const stop = onDesktopForeground(check);
    return () => {
      window.clearTimeout(mount);
      stop();
    };
  }, [enabled, qc]);
}

/** 立即更新: installs the downloaded update (downloading first if needed) and restarts; only failures come back. */
export function useInstallAppUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => desktopInvoke<void>('update_install'),
    onMutate: () =>
      qc.setQueryData<AppUpdateStatus>(appUpdateKey, (s) =>
        s
          ? {
              ...s,
              state: s.state === 'ready' ? 'installing' : 'downloading',
              received: 0,
              total: null,
              error: null,
            }
          : s,
      ),
    onSettled: () => qc.invalidateQueries({ queryKey: appUpdateKey }),
  });
}

/**
 * A newer version ready for one click: downloaded, or (its background download
 * failed, or an app from before background downloads) to be downloaded by that
 * click; or being installed. A background download in progress does not count.
 */
export const hasAppUpdate = (s: AppUpdateStatus | undefined) =>
  (s?.state === 'available' && !s.blocked) ||
  s?.state === 'ready' ||
  s?.state === 'installing';

/** Download progress for the status line. */
export function updateProgress(s: AppUpdateStatus): string {
  if (!s.total) return `${(s.received / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.min(100, Math.floor((s.received / s.total) * 100))}%`;
}
