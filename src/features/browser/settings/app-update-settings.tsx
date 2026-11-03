import { Button } from '@/components/ui/button';
import { SweepShine } from '@/components/ui/sweep-shine';
import {
  appUpdateKey,
  checkAppUpdate,
  updateProgress,
  useAppUpdateStatus,
  useInstallAppUpdate,
} from '@/lib/desktop/app-updater';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

import { SettingsGroup, SettingsRow } from './settings-group';

/**
 * 客户端 → 应用更新: 「检查更新」 checks now (the shell also checks on its own and
 * the window when it comes back to the foreground); a found version downloads
 * in the background, then 「立即更新」 installs and restarts. Hidden on apps
 * released before the in-app updater.
 */
export function AppUpdateSettings() {
  const qc = useQueryClient();
  const { data: s } = useAppUpdateStatus();
  const install = useInstallAppUpdate();
  const check = useMutation({
    mutationFn: checkAppUpdate,
    onSuccess: (next) => qc.setQueryData(appUpdateKey, next),
  });

  if (!s) return null;
  const checking = check.isPending || s.state === 'checking';
  const busy = s.state === 'downloading' || s.state === 'installing';
  const canInstall =
    (s.state === 'available' && !s.blocked) || s.state === 'ready';

  let status: ReactNode = s.checkedAt ? '已是最新版本' : '尚未检查';
  let failed = false;
  if (checking) status = <SweepShine>正在检查…</SweepShine>;
  else if (s.state === 'downloading')
    status = (
      <SweepShine>
        <span>正在下载</span> <span>v{s.version}</span>{' '}
        <span>{updateProgress(s)}</span>
      </SweepShine>
    );
  else if (s.state === 'installing')
    status = <SweepShine>正在关闭浏览器环境并安装…</SweepShine>;
  else if (s.state === 'ready') {
    failed = Boolean(s.error);
    status = s.error ?? (
      <>
        <span>v{s.version}</span>{' '}
        <span>已下载，会先关闭正在运行的浏览器环境</span>
      </>
    );
  } else if (s.state === 'available') {
    // A failed download or install keeps the update, with its error.
    failed = Boolean(s.error);
    status = s.blocked ?? s.error ?? (
      <>
        <span>发现新版本</span> <span>v{s.version}</span>
        {canInstall ? (
          <>
            <span>，</span>
            <span>会先关闭正在运行的浏览器环境</span>
          </>
        ) : null}
      </>
    );
  } else if (s.state === 'error' || check.isError) {
    failed = true;
    status = '检查更新失败，请稍后重试';
  }

  return (
    <SettingsGroup title="应用更新">
      <SettingsRow
        label={`版本 v${s.current}`}
        description={
          <span className={failed ? 'text-destructive' : undefined}>
            {status}
          </span>
        }
      >
        {canInstall || s.state === 'installing' ? (
          <Button
            type="button"
            size="sm"
            className="min-w-24 px-2.5 text-[12px] font-medium"
            disabled={busy || install.isPending}
            onClick={() =>
              install
                .mutateAsync()
                .catch((error: unknown) =>
                  toast.error(
                    error instanceof Error ? error.message : '更新失败',
                  ),
                )
            }
          >
            立即更新
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-24 px-2.5 text-[12px] font-medium"
            disabled={checking || busy}
            onClick={() => check.mutate()}
          >
            检查更新
          </Button>
        )}
      </SettingsRow>
    </SettingsGroup>
  );
}
