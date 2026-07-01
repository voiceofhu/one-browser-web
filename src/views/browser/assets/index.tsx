"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Column, ColumnDef } from "@tanstack/react-table"
import {
  CheckCircle2Icon,
  CopyIcon,
  MoreHorizontalIcon,
  StarIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteBrowserAsset,
  listBrowserAssets,
  setCurrentBrowserAsset,
} from "@/api/browser"
import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialogActionButton,
  AlertDialogCancelButton,
} from "@/components/ui/dialog-action-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useAuthPermissions } from "@/hooks/use-auth"
import { hasPermission } from "@/lib/auth-permissions"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { browserQueryKeys } from "@/lib/query-keys"
import type {
  BrowserAssetListParams,
  BrowserAssetResource,
} from "@/types/browser"
import {
  delay,
  useDebouncedValue,
} from "@/views/system/_components/resource/manager-utils"
import {
  ResourceTable,
  ResourceTableColumnHeader,
} from "@/views/system/_components/resource/table"
import { showResourceError } from "@/views/system/_components/resource/toast"
import { ResourceToolbarActions } from "@/views/system/_components/resource/toolbar-actions"

import { BrowserAssetUploadDialog } from "./upload-dialog"

type CurrentFilter = "all" | "current"
type BulkDeleteState = {
  records: BrowserAssetResource[]
  clearSelection: () => void
}

const CURRENT_FILTERS = [
  { label: "全部", value: "all" },
  { label: "当前版本", value: "current" },
] as const

export default function BrowserAssetsPage() {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [currentFilter, setCurrentFilter] = React.useState<CurrentFilter>("all")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [deleteRecord, setDeleteRecord] =
    React.useState<BrowserAssetResource | null>(null)
  const [bulkDeleteState, setBulkDeleteState] =
    React.useState<BulkDeleteState | null>(null)
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false)
  const params = React.useMemo<BrowserAssetListParams>(
    () => ({
      page: pageIndex + 1,
      page_size: pageSize,
      keyword: debouncedSearch || undefined,
      current: currentFilter === "current" ? true : undefined,
    }),
    [currentFilter, debouncedSearch, pageIndex, pageSize]
  )
  const query = useQuery({
    queryKey: [...browserQueryKeys.assets, params],
    queryFn: () => listBrowserAssets(params),
    placeholderData: (previousData) => previousData,
  })
  const canUpload = hasPermission(authPermissions.data, "browser:asset:upload")
  const canSetCurrent = hasPermission(
    authPermissions.data,
    "browser:asset:current"
  )
  const canDelete = hasPermission(authPermissions.data, "browser:asset:delete")
  const setCurrentMutation = useMutation({
    mutationFn: (record: BrowserAssetResource) =>
      setCurrentBrowserAsset(record.asset_id),
    onSuccess: async (asset) => {
      await queryClient.invalidateQueries({ queryKey: browserQueryKeys.assets })
      toast.success("当前版本已更新", {
        description: `${asset.platform} / ${asset.arch}`,
      })
    },
    onError: showResourceError,
  })
  const deleteMutation = useMutation({
    mutationFn: (record: BrowserAssetResource) => {
      if (record.is_current) {
        throw new Error("当前版本不允许删除")
      }

      return deleteBrowserAsset(record.asset_id)
    },
    onSuccess: async (_, record) => {
      await queryClient.invalidateQueries({ queryKey: browserQueryKeys.assets })
      toast.success("安装包已删除", {
        description: assetDisplayName(record),
      })
      setDeleteRecord(null)
    },
    onError: showResourceError,
  })
  const bulkDeleteMutation = useMutation({
    mutationFn: async (records: BrowserAssetResource[]) => {
      const deletableRecords = records.filter((record) => !record.is_current)

      if (deletableRecords.length === 0) {
        throw new Error("没有可删除的安装包")
      }

      await Promise.all(
        deletableRecords.map((record) => deleteBrowserAsset(record.asset_id))
      )
      return deletableRecords.length
    },
    onSuccess: async (count) => {
      setPageIndex(0)
      await queryClient.invalidateQueries({ queryKey: browserQueryKeys.assets })
      toast.success("安装包已删除", {
        description: `已删除 ${count} 个安装包`,
      })
      bulkDeleteState?.clearSelection()
      setBulkDeleteState(null)
    },
    onError: showResourceError,
  })
  const columns = React.useMemo<ColumnDef<BrowserAssetResource>[]>(
    () => [
      {
        accessorKey: "file_name",
        header: ({ column }) => tableHeader(column, "安装包"),
        cell: ({ row }) => <AssetNameCell record={row.original} />,
        meta: { label: "安装包", cellClassName: "min-w-64 max-w-80" },
      },
      {
        id: "target",
        header: ({ column }) => tableHeader(column, "目标"),
        cell: ({ row }) => <TargetCell record={row.original} />,
        meta: { label: "目标", cellClassName: "w-36" },
      },
      {
        accessorKey: "file_size",
        header: ({ column }) => tableHeader(column, "文件大小"),
        cell: ({ row }) => formatBytes(row.original.file_size),
        meta: { label: "文件大小", cellClassName: "w-28" },
      },
      {
        accessorKey: "is_current",
        header: ({ column }) => tableHeader(column, "状态"),
        cell: ({ row }) => <CurrentBadge active={row.original.is_current} />,
        meta: { label: "状态", cellClassName: "w-28" },
      },
      {
        accessorKey: "updated_at",
        header: ({ column }) => tableHeader(column, "最近更新"),
        cell: ({ row }) => (
          <TimeCell
            value={row.original.updated_at || row.original.created_at}
          />
        ),
        meta: { label: "最近更新", cellClassName: "w-36" },
      },
    ],
    []
  )
  const hasActiveFilters = search.trim().length > 0 || currentFilter !== "all"

  async function handleRefresh() {
    setIsManualRefreshing(true)
    try {
      const [result] = await Promise.all([query.refetch(), delay(600)])
      if (result.isError) {
        showResourceError(result.error)
      }
    } finally {
      setIsManualRefreshing(false)
    }
  }

  function handleUploaded(asset: BrowserAssetResource) {
    void queryClient.invalidateQueries({ queryKey: browserQueryKeys.assets })
    toast.success("安装包上传完成", {
      description: `${asset.platform} / ${asset.arch}`,
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <div className="min-h-0 flex-1">
        <ResourceTable
          data={query.data?.list ?? []}
          columns={columns}
          columnVisibilityResetKey="browser-assets"
          totalRows={query.data?.total ?? 0}
          pageIndex={pageIndex}
          pageSize={pageSize}
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPageIndex(0)
          }}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(value) => {
            setPageSize(value)
            setPageIndex(0)
          }}
          searchPlaceholder="搜索文件名、版本、平台、对象路径"
          emptyTitle="暂无安装包"
          emptyDescription="上传浏览器安装包后，客户端会读取当前版本下载地址。"
          isFiltered={hasActiveFilters}
          getRowId={(record) => String(record.asset_id)}
          getRowCanSelect={(record) => !record.is_current}
          onBulkDelete={
            canDelete
              ? (records, clearSelection) =>
                  setBulkDeleteState({ records, clearSelection })
              : undefined
          }
          isBulkDeleting={bulkDeleteMutation.isPending}
          density="compact"
          selectionResetKey={`${currentFilter}:${debouncedSearch}`}
          toolbarLeading={
            <AnimatedSegmentedTabs
              label="安装包状态"
              options={CURRENT_FILTERS}
              value={currentFilter}
              onValueChange={(value) => {
                setCurrentFilter(value)
                setPageIndex(0)
              }}
            />
          }
          toolbarActions={
            <ResourceToolbarActions
              isRefreshing={isManualRefreshing}
              onRefresh={handleRefresh}
              onCreate={canUpload ? () => setUploadOpen(true) : undefined}
            />
          }
          renderRowActions={(record) => (
            <AssetRowActions
              record={record}
              canSetCurrent={canSetCurrent}
              canDelete={canDelete}
              isSettingCurrent={setCurrentMutation.isPending}
              onCopyUrl={() => void copyDownloadUrl(record)}
              onSetCurrent={() => setCurrentMutation.mutate(record)}
              onDelete={() => handleDeleteRequest(record)}
            />
          )}
          isLoading={query.isLoading}
          isFetching={query.isFetching}
          error={query.error}
        />
      </div>

      <BrowserAssetUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={handleUploaded}
      />

      <AlertDialog
        open={Boolean(deleteRecord)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteRecord(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <TriangleAlertIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>删除安装包</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除{" "}
              {deleteRecord ? assetDisplayName(deleteRecord) : "该安装包"}
              ？删除后不会移除 OneFile 对象，只会移除后台资产记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton disabled={deleteMutation.isPending}>
              取消
            </AlertDialogCancelButton>
            <AlertDialogActionButton
              variant="destructive"
              disabled={deleteMutation.isPending || deleteRecord?.is_current}
              loading={deleteMutation.isPending}
              loadingText="删除中"
              onClick={(event) => {
                event.preventDefault()
                if (deleteRecord) {
                  deleteMutation.mutate(deleteRecord)
                }
              }}
            >
              删除
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(bulkDeleteState)}
        onOpenChange={(open) => {
          if (!open && !bulkDeleteMutation.isPending) {
            setBulkDeleteState(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>批量删除安装包</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除选中的 {bulkDeleteState?.records.length ?? 0}{" "}
              个安装包？当前版本不会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton disabled={bulkDeleteMutation.isPending}>
              取消
            </AlertDialogCancelButton>
            <AlertDialogActionButton
              variant="destructive"
              disabled={bulkDeleteMutation.isPending}
              loading={bulkDeleteMutation.isPending}
              loadingText="删除中"
              onClick={(event) => {
                event.preventDefault()
                if (bulkDeleteState) {
                  bulkDeleteMutation.mutate(bulkDeleteState.records)
                }
              }}
            >
              批量删除
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  function handleDeleteRequest(record: BrowserAssetResource) {
    if (record.is_current) {
      toast.error("当前版本不允许删除")
      return
    }

    setDeleteRecord(record)
  }

  async function copyDownloadUrl(record: BrowserAssetResource) {
    try {
      await navigator.clipboard.writeText(record.download_url)
      toast.success("下载 URL 已复制")
    } catch {
      toast.error("复制失败")
    }
  }
}

function AssetNameCell({ record }: { record: BrowserAssetResource }) {
  const title = assetDisplayName(record)

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex min-w-0 items-center gap-2">
        {record.is_current ? (
          <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
        ) : null}
        <OverflowTooltipText text={title} className="font-medium" />
      </div>
      <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        <OverflowTooltipText text={record.object_key || record.download_url} />
      </div>
    </div>
  )
}

function assetDisplayName(record: BrowserAssetResource) {
  return record.version
    ? `${record.version} (${record.platform} / ${record.arch})`
    : `${record.platform} / ${record.arch}`
}

function AssetRowActions({
  record,
  canSetCurrent,
  canDelete,
  isSettingCurrent,
  onCopyUrl,
  onSetCurrent,
  onDelete,
}: {
  record: BrowserAssetResource
  canSetCurrent: boolean
  canDelete: boolean
  isSettingCurrent: boolean
  onCopyUrl: () => void
  onSetCurrent: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className="size-7">
          <MoreHorizontalIcon />
          <span className="sr-only">安装包操作</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onCopyUrl}>
            <CopyIcon />
            复制 URL
          </DropdownMenuItem>
          {canSetCurrent ? (
            <DropdownMenuItem
              disabled={record.is_current || isSettingCurrent}
              onSelect={onSetCurrent}
            >
              {isSettingCurrent ? <Spinner /> : <StarIcon />}
              设为当前
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={record.is_current}
              onSelect={onDelete}
            >
              <Trash2Icon />
              删除
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TargetCell({ record }: { record: BrowserAssetResource }) {
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline">{record.platform}</Badge>
      <Badge variant="outline">{record.arch}</Badge>
    </div>
  )
}

function CurrentBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "outline"}>
      {active ? "当前版本" : "历史版本"}
    </Badge>
  )
}

function TimeCell({ value }: { value?: string | null }) {
  return (
    <span className="block truncate" title={formatAbsoluteDateTime(value, "-")}>
      {formatRelativeTime(value, "-")}
    </span>
  )
}

function tableHeader<TData, TValue>(
  column: Column<TData, TValue>,
  title: string
) {
  return <ResourceTableColumnHeader column={column} title={title} />
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B"
  }

  const units = ["B", "KiB", "MiB", "GiB", "TiB"] as const
  let size = value
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}
