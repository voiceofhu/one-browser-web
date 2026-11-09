import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialogActionButton,
  AlertDialogCancelButton,
} from '@/components/ui/dialog-action-button';
import {
  BrowserDataTable,
  BrowserTableColumnVisibilityMenu,
} from '@/features/browser/components/data-table';
import {
  BrowserTableFilterTabs,
  BrowserTableRefreshButton,
  BrowserTableSearchField,
  BrowserTableToolbar,
} from '@/features/browser/components/table-toolbar';
import { toBrowserErrorMessage } from '@/features/browser/errors';
import { formatDateTimeTitle, formatDisplayDateTime } from '@/lib/date-time';
import {
  Add01Icon,
  Alert01Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ColumnDef,
  RowSelectionState,
  VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';
import { toast } from 'sonner';

import {
  deleteBrowserAsset,
  listBrowserAssets,
  setCurrentBrowserAsset,
} from '../api/client';
import { useBrowserAssetAccess } from '../hooks/use-browser-asset-access';
import { formatBytes } from '../model/upload-form';
import type { BrowserAssetListParams, BrowserAssetResource } from '../types';
import { BrowserAssetUploadDialog } from '../upload-dialog';
import {
  AssetActionsMenu,
  AssetBulkActions,
  AssetNameCell,
  AssetState,
  BrowserAssetsPagination,
  CurrentBadge,
  TargetCell,
  UploadModeBadge,
  assetDisplayName,
} from './assets-table-parts';
import { BrowserAssetGithubSyncButton } from './github-sync-button';

type CurrentFilter = 'all' | 'current';
const CURRENT_FILTERS = [
  { label: '全部', value: 'all' },
  { label: '当前版本', value: 'current' },
] as const;
const browserAssetQueryKeys = {
  all: ['browser-assets'] as const,
  list: (params: BrowserAssetListParams) =>
    [...browserAssetQueryKeys.all, 'list', params] as const,
};

export function BrowserAssetsPageContent() {
  const queryClient = useQueryClient();
  const { canDelete, canList, canSetCurrent, canUpload } =
    useBrowserAssetAccess();
  const [currentFilter, setCurrentFilter] =
    React.useState<CurrentFilter>('all');
  const [search, setSearch] = React.useState('');
  const deferredSearch = React.useDeferredValue(search.trim());
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [deleteTargets, setDeleteTargets] = React.useState<
    BrowserAssetResource[]
  >([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const params = React.useMemo<BrowserAssetListParams>(
    () => ({
      page: pageIndex + 1,
      page_size: pageSize,
      keyword: deferredSearch || undefined,
      current: currentFilter === 'current' ? true : undefined,
    }),
    [currentFilter, deferredSearch, pageIndex, pageSize],
  );
  const assetsQuery = useQuery({
    queryKey: browserAssetQueryKeys.list(params),
    queryFn: () => listBrowserAssets(params),
    enabled: canList,
    placeholderData: (previousData) => previousData,
  });
  const assets = React.useMemo(
    () => assetsQuery.data?.list ?? [],
    [assetsQuery.data?.list],
  );
  const totalAssets = assetsQuery.data?.total ?? 0;
  const selectedAssets = React.useMemo(
    () => assets.filter((asset) => rowSelection[String(asset.asset_id)]),
    [assets, rowSelection],
  );
  const setCurrentMutation = useMutation({
    mutationFn: (record: BrowserAssetResource) =>
      setCurrentBrowserAsset(record.asset_id),
    onError: (error) => toast.error(toBrowserErrorMessage(error)),
    onSuccess: async (asset) => {
      await queryClient.invalidateQueries({
        queryKey: browserAssetQueryKeys.all,
      });
      toast.success('当前版本已更新', {
        description: `${asset.platform} / ${asset.arch}`,
      });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (records: BrowserAssetResource[]) => {
      const deletable = records.filter((record) => !record.is_current);
      if (!deletable.length) {
        throw new Error('当前版本不允许删除');
      }
      await Promise.all(
        deletable.map((record) => deleteBrowserAsset(record.asset_id)),
      );
      return deletable;
    },
    onError: (error) => toast.error(toBrowserErrorMessage(error)),
    onSuccess: async (deleted) => {
      if (deleted.length > 1) {
        setPageIndex(0);
      }
      await queryClient.invalidateQueries({
        queryKey: browserAssetQueryKeys.all,
      });
      toast.success(deleted.length > 1 ? '安装包已批量删除' : '安装包已删除', {
        description:
          deleted.length > 1
            ? `已删除 ${deleted.length} 个安装包`
            : assetDisplayName(deleted[0]),
      });
      setDeleteTargets([]);
      setRowSelection({});
    },
  });
  const columns = React.useMemo<ColumnDef<BrowserAssetResource>[]>(
    () => [
      ...(canDelete
        ? [
            {
              id: 'select',
              header: ({ table }) => (
                <Checkbox
                  aria-label="选择全部安装包"
                  checked={
                    table.getIsAllRowsSelected()
                      ? true
                      : table.getIsSomeRowsSelected()
                        ? 'indeterminate'
                        : false
                  }
                  disabled={
                    deleteMutation.isPending ||
                    !table.getRowModel().rows.some((row) => row.getCanSelect())
                  }
                  onCheckedChange={(checked) =>
                    table.toggleAllRowsSelected(Boolean(checked))
                  }
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  aria-label={`选择安装包 ${row.original.file_name}`}
                  checked={row.getIsSelected()}
                  disabled={!row.getCanSelect() || deleteMutation.isPending}
                  onCheckedChange={(checked) =>
                    row.toggleSelected(Boolean(checked))
                  }
                />
              ),
              enableHiding: false,
              enableSorting: false,
              meta: {
                headerClassName: 'sticky left-0 z-30 bg-muted/95',
                cellClassName:
                  'sticky left-0 z-20 bg-card group-data-[state=selected]/row:bg-muted group-hover/row:bg-muted/50',
              },
            } satisfies ColumnDef<BrowserAssetResource>,
          ]
        : []),
      {
        accessorKey: 'file_name',
        header: '安装包',
        cell: ({ row }) => <AssetNameCell record={row.original} />,
        meta: {
          headerClassName: 'min-w-64',
          cellClassName: 'min-w-64 max-w-80',
        },
      },
      {
        id: 'target',
        header: '目标',
        cell: ({ row }) => <TargetCell record={row.original} />,
        meta: { headerClassName: 'w-36', cellClassName: 'w-36' },
      },
      {
        accessorKey: 'file_size',
        header: '文件大小',
        cell: ({ row }) => formatBytes(row.original.file_size),
        meta: { headerClassName: 'w-28', cellClassName: 'w-28' },
      },
      {
        accessorKey: 'upload_mode',
        header: '来源',
        cell: ({ row }) => <UploadModeBadge mode={row.original.upload_mode} />,
        meta: { headerClassName: 'w-32', cellClassName: 'w-32' },
      },
      {
        accessorKey: 'is_current',
        header: '状态',
        cell: ({ row }) => <CurrentBadge active={row.original.is_current} />,
        meta: { headerClassName: 'w-28', cellClassName: 'w-28' },
      },
      {
        accessorKey: 'updated_at',
        header: '最近更新',
        cell: ({ row }) => {
          const value = row.original.updated_at || row.original.created_at;
          return (
            <span
              className="text-muted-foreground block truncate"
              title={formatDateTimeTitle(value)}
            >
              {formatDisplayDateTime(value)}
            </span>
          );
        },
        meta: { headerClassName: 'w-36', cellClassName: 'w-36' },
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <AssetActionsMenu
            record={row.original}
            canSetCurrent={canSetCurrent}
            canDelete={canDelete}
            isBusy={setCurrentMutation.isPending || deleteMutation.isPending}
            onSetCurrent={(record) => setCurrentMutation.mutate(record)}
            onDelete={(record) => setDeleteTargets([record])}
          />
        ),
        enableHiding: false,
        meta: {
          headerClassName: 'w-20 border-l',
          cellClassName: 'w-20 border-l',
        },
      },
    ],
    [canDelete, canSetCurrent, deleteMutation.isPending, setCurrentMutation],
  );

  if (!canList) {
    return (
      <AssetState
        icon={Alert01Icon}
        title="没有版本管理权限"
        description="当前账号未获得浏览器安装包的查看权限。"
      />
    );
  }

  return (
    <div className="bg-background relative flex min-h-0 flex-1 flex-col">
      <BrowserTableToolbar
        filters={
          <>
            <BrowserTableFilterTabs
              label="安装包状态"
              options={CURRENT_FILTERS}
              value={currentFilter}
              onValueChange={(value) => {
                setCurrentFilter(value);
                setPageIndex(0);
                setRowSelection({});
              }}
            />
            <BrowserTableSearchField
              className="w-full max-w-xs sm:w-64"
              value={search}
              onValueChange={(value) => {
                setSearch(value);
                setPageIndex(0);
                setRowSelection({});
              }}
              placeholder="搜索文件名、版本、平台、对象路径"
              ariaLabel="搜索安装包"
            />
          </>
        }
        actions={
          <>
            <BrowserTableRefreshButton
              isRefreshing={assetsQuery.isFetching}
              onRefresh={assetsQuery.refetch}
              successMessage="版本列表已刷新"
            />
            {canUpload ? (
              <BrowserAssetGithubSyncButton
                onSynced={() =>
                  queryClient.invalidateQueries({
                    queryKey: browserAssetQueryKeys.all,
                  })
                }
              />
            ) : null}
            {canUpload ? (
              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                新增
              </Button>
            ) : null}
            <BrowserTableColumnVisibilityMenu
              columns={columns}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
            />
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto">
        {assetsQuery.isError ? (
          <AssetState
            icon={Alert01Icon}
            title="版本列表读取失败"
            description={toBrowserErrorMessage(assetsQuery.error)}
            onRetry={() => void assetsQuery.refetch()}
          />
        ) : (
          <BrowserDataTable
            data={assets}
            columns={columns}
            emptyTitle="暂无安装包"
            emptyDescription="上传或从 GitHub 同步浏览器安装包后，客户端会读取当前版本下载地址。"
            getRowId={(record) => String(record.asset_id)}
            isLoading={assetsQuery.isLoading}
            density="compact"
            enableRowSelection={(row) => !row.original.is_current}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        )}
      </div>

      <BrowserAssetsPagination
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRows={totalAssets}
        isUpdating={assetsQuery.isFetching}
        onPageIndexChange={(value) => {
          setPageIndex(value);
          setRowSelection({});
        }}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPageIndex(0);
          setRowSelection({});
        }}
      />

      {selectedAssets.length ? (
        <AssetBulkActions
          selectedCount={selectedAssets.length}
          isDeleting={deleteMutation.isPending}
          onClear={() => setRowSelection({})}
          onDelete={() => setDeleteTargets(selectedAssets)}
        />
      ) : null}

      <BrowserAssetUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={(asset) => {
          void queryClient.invalidateQueries({
            queryKey: browserAssetQueryKeys.all,
          });
          toast.success('安装包上传完成', {
            description: `${asset.platform} / ${asset.arch}`,
          });
        }}
      />

      <AlertDialog
        open={deleteTargets.length > 0}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteTargets([]);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {deleteTargets.length > 1 ? '批量删除安装包' : '删除安装包'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargets.length > 1
                ? `确认删除选中的 ${deleteTargets.length} 个安装包？`
                : `确认删除 ${deleteTargets[0] ? assetDisplayName(deleteTargets[0]) : '该安装包'}？`}
              删除后不会移除 OneFile 对象或 GitHub Release
              文件，只会移除后台资产记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton disabled={deleteMutation.isPending}>
              取消
            </AlertDialogCancelButton>
            <AlertDialogActionButton
              variant="destructive"
              disabled={deleteMutation.isPending}
              loading={deleteMutation.isPending}
              loadingText="删除中"
              onClick={(event) => {
                event.preventDefault();
                deleteMutation.mutate(deleteTargets);
              }}
            >
              删除
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
