import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TablePagination } from '@/components/table-pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { copyTextToClipboard } from '@/lib/clipboard';
import {
  Alert01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  MultiplicationSignIcon,
  StarIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import type { BrowserAssetResource } from '../types';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export function BrowserAssetsPagination({
  pageIndex,
  pageSize,
  totalRows,
  isUpdating,
  onPageIndexChange,
  onPageSizeChange,
}: {
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  isUpdating: boolean;
  onPageIndexChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
}) {
  return (
    <TablePagination
      currentPage={pageIndex + 1}
      pageSize={pageSize}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      total={totalRows}
      isUpdating={isUpdating}
      onPageChange={(page) => onPageIndexChange(page - 1)}
      onPageSizeChange={onPageSizeChange}
    />
  );
}

export function AssetBulkActions({
  selectedCount,
  isDeleting,
  onClear,
  onDelete,
}: {
  selectedCount: number;
  isDeleting: boolean;
  onClear: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-12 flex justify-center px-4 md:left-(--sidebar-width)">
      <div className="bg-popover text-popover-foreground pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-lg border p-2 shadow-lg">
        <Badge
          variant="outline"
          className="bg-muted/40 h-6 rounded-md px-2.5 text-xs"
        >
          <span className="font-semibold tabular-nums">{selectedCount}</span>
          <span className="text-muted-foreground">已选</span>
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="清除选择"
          disabled={isDeleting}
          onClick={onClear}
        >
          <HugeiconsIcon icon={MultiplicationSignIcon} strokeWidth={2} />
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isDeleting}
          onClick={onDelete}
        >
          {isDeleting ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <HugeiconsIcon
              icon={Delete02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
          )}
          {isDeleting ? '删除中' : '批量删除'}
        </Button>
      </div>
    </div>
  );
}

export function AssetNameCell({ record }: { record: BrowserAssetResource }) {
  const title = assetDisplayName(record);

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex min-w-0 items-center gap-2">
        {record.is_current ? (
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            strokeWidth={2}
            className="text-primary size-4 shrink-0"
          />
        ) : null}
        <span
          className="block max-w-full min-w-0 truncate font-medium"
          title={title}
        >
          {title}
        </span>
      </div>
      <span
        className="text-muted-foreground block max-w-80 min-w-0 truncate text-xs"
        title={record.object_key || record.download_url}
      >
        {record.object_key || record.download_url}
      </span>
    </div>
  );
}

export function TargetCell({ record }: { record: BrowserAssetResource }) {
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline">{record.platform}</Badge>
      <Badge variant="outline">{record.arch}</Badge>
    </div>
  );
}

const UPLOAD_MODE_LABELS: Record<string, string> = {
  direct: '直传',
  multipart: '分片上传',
  github_release: 'GitHub Release',
};

export function UploadModeBadge({
  mode,
}: {
  mode: BrowserAssetResource['upload_mode'];
}) {
  return <Badge variant="outline">{UPLOAD_MODE_LABELS[mode] ?? mode}</Badge>;
}

export function CurrentBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'default' : 'outline'}>
      {active ? '当前版本' : '历史版本'}
    </Badge>
  );
}

export function AssetActionsMenu({
  record,
  canSetCurrent,
  canDelete,
  isBusy,
  onSetCurrent,
  onDelete,
}: {
  record: BrowserAssetResource;
  canSetCurrent: boolean;
  canDelete: boolean;
  isBusy: boolean;
  onSetCurrent: (record: BrowserAssetResource) => void;
  onDelete: (record: BrowserAssetResource) => void;
}) {
  async function copyDownloadUrl() {
    try {
      await copyTextToClipboard(record.download_url);
      toast.success('下载 URL 已复制');
    } catch {
      toast.error('复制失败');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="打开安装包操作"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => void copyDownloadUrl()}>
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
            复制 URL
          </DropdownMenuItem>
          {canSetCurrent ? (
            <DropdownMenuItem
              disabled={record.is_current || isBusy}
              onSelect={() => onSetCurrent(record)}
            >
              <HugeiconsIcon icon={StarIcon} strokeWidth={2} />
              设为当前
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={record.is_current || isBusy}
              onSelect={() => onDelete(record)}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              删除
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AssetState({
  icon,
  title,
  description,
  onRetry,
}: {
  icon: typeof Alert01Icon;
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <Empty className="min-h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onRetry ? (
        <EmptyContent>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            重新加载
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

export function assetDisplayName(record: BrowserAssetResource) {
  return record.version
    ? `${record.version} (${record.platform} / ${record.arch})`
    : `${record.platform} / ${record.arch}`;
}
