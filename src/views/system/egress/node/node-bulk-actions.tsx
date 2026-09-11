import { DialogActionButton } from '@/components/ui/dialog-action-button';
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  MultiplicationSignIcon,
  Upload01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation } from '@tanstack/react-query';
import * as React from 'react';
import { toast } from 'sonner';

import { batchUpgradeEgressNodes } from './api';
import type { EgressNodeResource, EgressReleaseStatus } from './types';

export function NodeBulkActions({
  nodes,
  releaseStatus,
  releaseLoading,
  onSelectionChange,
  onUpdated,
}: {
  nodes: EgressNodeResource[];
  releaseStatus?: EgressReleaseStatus;
  releaseLoading: boolean;
  onSelectionChange: (egressIds: string[]) => void;
  onUpdated: () => Promise<unknown>;
}) {
  const [open, setOpen] = React.useState(false);
  const [targetVersion, setTargetVersion] = React.useState('');
  const eligibleNodes = React.useMemo(
    () =>
      targetVersion
        ? nodes.filter((node) => canUpgradeNode(node, targetVersion))
        : [],
    [nodes, targetVersion],
  );
  const mutation = useMutation({
    mutationFn: () =>
      batchUpgradeEgressNodes(
        nodes.map((node) => node.egress_id),
        targetVersion,
      ),
    onSuccess: async (result) => {
      setOpen(false);
      await onUpdated();
      onSelectionChange(
        result.targets
          .filter((target) => target.status === 'skipped')
          .map((target) => target.egress_id),
      );
      if (result.queued === 0) {
        toast.error('没有节点进入升级队列', {
          description: result.targets.find(
            (target) => target.status === 'skipped',
          )?.message,
        });
      } else if (result.skipped === 0) {
        toast.success(`已为 ${result.queued} 个节点排队升级`);
      } else {
        toast.success(
          `已排队 ${result.queued} 个节点，跳过 ${result.skipped} 个节点`,
          {
            description: result.targets.find(
              (target) => target.status === 'skipped',
            )?.message,
          },
        );
      }
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : '批量升级失败'),
  });

  if (!nodes.length) return null;

  const openUpgrade = () => {
    setTargetVersion(releaseStatus?.latest_version ?? '');
    setOpen(true);
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-12 z-40 flex justify-center px-4 md:left-(--sidebar-width)">
        <div className="bg-popover text-popover-foreground pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-lg border p-2 shadow-lg">
          <Badge
            variant="outline"
            className="bg-muted/40 h-6 rounded-md px-2.5"
          >
            <span className="font-semibold tabular-nums">{nodes.length}</span>
            <span className="text-muted-foreground">已选</span>
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="取消选择"
            disabled={mutation.isPending}
            onClick={() => onSelectionChange([])}
          >
            <HugeiconsIcon icon={MultiplicationSignIcon} strokeWidth={2} />
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={mutation.isPending || releaseLoading || !releaseStatus}
            title={releaseStatus ? undefined : '暂时无法读取已发布版本'}
            onClick={openUpgrade}
          >
            <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} />
            批量升级
          </Button>
        </div>
      </div>

      <ResponsiveDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!mutation.isPending) setOpen(nextOpen);
        }}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>批量升级 Egress</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              在线且已安装远程升级能力的节点会进入升级队列；离线、已是目标版本或已有任务的节点会跳过。
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">已选择</span>
              <span>{nodes.length} 个节点</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">可升级</span>
              <span>{eligibleNodes.length} 个节点</span>
            </div>
            <Select
              value={targetVersion}
              onValueChange={setTargetVersion}
              disabled={mutation.isPending}
            >
              <SelectTrigger className="w-full" aria-label="目标版本">
                <SelectValue placeholder="选择目标版本" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {releaseStatus?.available_versions.map((version) => (
                    <SelectItem key={version} value={version}>
                      {version}
                      {version === releaseStatus.latest_version
                        ? '（最新）'
                        : ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <DialogActionButton
              action="cancel"
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setOpen(false)}
            >
              取消
            </DialogActionButton>
            <DialogActionButton
              action="confirm"
              type="button"
              className="min-w-24"
              disabled={mutation.isPending || eligibleNodes.length === 0}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} />
              )}
              {mutation.isPending ? '排队中' : '确认升级'}
            </DialogActionButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}

function canUpgradeNode(node: EgressNodeResource, targetVersion: string) {
  return (
    node.lifecycle === 'active' &&
    node.online &&
    node.self_upgrade &&
    node.runtime_version !== targetVersion &&
    !matchesActiveUpgrade(node.upgrade?.status)
  );
}

function matchesActiveUpgrade(status: string | undefined) {
  return status === 'pending' || status === 'accepted' || status === 'running';
}
