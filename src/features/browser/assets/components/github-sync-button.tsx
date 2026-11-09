import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toBrowserErrorMessage } from '@/features/browser/errors';
import { GithubIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { syncBrowserAssetsFromGithub } from '../api/client';
import type { BrowserAssetGithubSyncResult } from '../types';

function syncSummary(result: BrowserAssetGithubSyncResult) {
  const parts = [
    `新增 ${result.created}`,
    `更新 ${result.updated}`,
    `设为当前 ${result.made_current}`,
  ];
  if (result.skipped) {
    parts.push(`跳过 ${result.skipped}`);
  }
  return `${result.releases} 个 Release：${parts.join('，')}`;
}

export function BrowserAssetGithubSyncButton({
  onSynced,
}: {
  onSynced: () => unknown | Promise<unknown>;
}) {
  const syncMutation = useMutation({
    mutationFn: syncBrowserAssetsFromGithub,
    onError: (error) => toast.error(toBrowserErrorMessage(error)),
    onSuccess: async (result) => {
      await onSynced();
      toast.success('GitHub 同步完成', { description: syncSummary(result) });
    },
  });

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={syncMutation.isPending}
      onClick={() => syncMutation.mutate()}
    >
      {syncMutation.isPending ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <HugeiconsIcon
          icon={GithubIcon}
          strokeWidth={2}
          data-icon="inline-start"
        />
      )}
      {syncMutation.isPending ? '同步中' : '从 GitHub 同步'}
    </Button>
  );
}
