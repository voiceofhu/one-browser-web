"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ClipboardListIcon,
  EditIcon,
  InfoIcon,
  MoreHorizontalIcon,
  PlayIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  createJob,
  deleteJob,
  listJobs,
  runJobOnce,
  updateJob,
  updateJobStatus,
} from "@/api/monitor/jobs"
import { useTranslation } from "@/components/providers/language-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useAuthPermissions } from "@/hooks/use-auth"
import { hasPermission } from "@/lib/auth-permissions"
import { translate, type Locale } from "@/lib/i18n"
import { translateText } from "@/lib/i18n-text"
import { monitorQueryKeys } from "@/lib/query-keys"
import type { JobListParams, JobPayload, JobResource } from "@/types/admin"
import {
  delay,
  useDebouncedValue,
} from "@/views/system/_components/resource/manager-utils"
import {
  ResourceStatusFilterTabs,
  type ResourceStatusFilterValue,
} from "@/views/system/_components/resource/status-filter-tabs"
import { ResourceTable } from "@/views/system/_components/resource/table"
import {
  showResourceError,
  showResourceRefreshSuccess,
} from "@/views/system/_components/resource/toast"
import { ResourceToolbarActions } from "@/views/system/_components/resource/toolbar-actions"

import { createJobColumns } from "./columns"
import { JobDetailDialog } from "./job-detail-dialog"
import { JobFormDialog } from "./job-form-dialog"
import { JobLogDialog } from "./job-log-dialog"

const JOB_STATUS_FILTERS = [
  { label: "全部", value: "all" },
  { label: "启用", value: "0" },
  { label: "停用", value: "1" },
] as const

export default function JobsPage() {
  const { locale, t } = useTranslation()
  const tt = (text: string) => translateText(locale, text)
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] =
    React.useState<ResourceStatusFilterValue>("all")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editRecord, setEditRecord] = React.useState<JobResource | null>(null)
  const [deleteRecord, setDeleteRecord] = React.useState<JobResource | null>(
    null
  )
  const [runRecord, setRunRecord] = React.useState<JobResource | null>(null)
  const [logRecord, setLogRecord] = React.useState<JobResource | null>(null)
  const [detailRecord, setDetailRecord] = React.useState<JobResource | null>(
    null
  )
  const params = React.useMemo<JobListParams>(
    () => ({
      page: pageIndex + 1,
      page_size: pageSize,
      keyword: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [debouncedSearch, pageIndex, pageSize, statusFilter]
  )
  const listQueryKey = React.useMemo(
    () => [...monitorQueryKeys.jobs, params] as const,
    [params]
  )
  const query = useQuery({
    queryKey: listQueryKey,
    queryFn: () => listJobs(params),
    placeholderData: (previousData) => previousData,
  })
  const records = React.useMemo(
    () => query.data?.list ?? [],
    [query.data?.list]
  )
  const canCreate = hasPermission(authPermissions.data, "monitor:job:create")
  const canUpdate = hasPermission(authPermissions.data, "monitor:job:update")
  const canDelete = hasPermission(authPermissions.data, "monitor:job:delete")
  const canRun = hasPermission(authPermissions.data, "monitor:job:run")
  const canViewLogs = hasPermission(authPermissions.data, "monitor:job:log")
  const canUpdateStatus = hasPermission(
    authPermissions.data,
    "monitor:job:status"
  )

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: monitorQueryKeys.jobs })
      toast.success(tt("定时任务已创建"))
      setIsCreateOpen(false)
    },
    onError: (error) => showResourceError(error, locale),
  })
  const updateMutation = useMutation({
    mutationFn: ({ jobId, payload }: { jobId: number; payload: JobPayload }) =>
      updateJob(jobId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: monitorQueryKeys.jobs })
      toast.success(tt("定时任务已更新"))
      setEditRecord(null)
    },
    onError: (error) => showResourceError(error, locale),
  })
  const statusMutation = useMutation({
    mutationFn: ({ jobId, status }: { jobId: number; status: "0" | "1" }) =>
      updateJobStatus(jobId, status),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: monitorQueryKeys.jobs })
      toast.success(variables.status === "0" ? tt("任务已启用") : tt("任务已停用"))
    },
    onError: (error) => showResourceError(error, locale),
  })
  const deleteMutation = useMutation({
    mutationFn: (record: JobResource) => deleteJob(record.job_id),
    onSuccess: async (_, record) => {
      await queryClient.invalidateQueries({ queryKey: monitorQueryKeys.jobs })
      toast.success(
        translate(locale, "monitor.job.deleteSuccess", {
          name: record.job_name,
        })
      )
      setDeleteRecord(null)
    },
    onError: (error) => showResourceError(error, locale),
  })
  const runMutation = useMutation({
    mutationFn: (record: JobResource) => runJobOnce(record.job_id),
    onSuccess: async (_, record) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: monitorQueryKeys.jobs }),
        queryClient.invalidateQueries({ queryKey: monitorQueryKeys.jobLogs }),
      ])
      toast.success(
        translate(locale, "monitor.job.runSuccess", {
          name: record.job_name,
        })
      )
      setRunRecord(null)
    },
    onError: (error) => showResourceError(error, locale),
  })
  const statusFilterOptions = React.useMemo(
    () =>
      JOB_STATUS_FILTERS.map((option) => ({
        ...option,
        label: translateText(locale, option.label),
      })),
    [locale]
  )
  const columns = React.useMemo(
    () =>
      createJobColumns({
        canUpdateStatus,
        isStatusPending: (record) =>
          statusMutation.isPending &&
          statusMutation.variables?.jobId === record.job_id,
        onStatusChange: (record, checked) =>
          statusMutation.mutate({
            jobId: record.job_id,
            status: checked ? "0" : "1",
          }),
      }),
    [canUpdateStatus, statusMutation]
  )
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all"

  async function handleRefresh() {
    setIsManualRefreshing(true)
    try {
      const [result] = await Promise.all([query.refetch(), delay(1_000)])
      if (result.isError) {
        showResourceError(result.error, locale)
        return
      }
      showResourceRefreshSuccess("定时任务", locale)
    } catch (error) {
      showResourceError(error, locale)
    } finally {
      setIsManualRefreshing(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ResourceTable
        data={records}
        columns={columns}
        columnVisibilityResetKey="scheduler-jobs"
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
        toolbarLeading={
          <ResourceStatusFilterTabs
            label={tt("定时任务状态筛选")}
            options={statusFilterOptions}
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              setPageIndex(0)
            }}
          />
        }
        toolbarActions={
          <ResourceToolbarActions
            isRefreshing={isManualRefreshing}
            onRefresh={handleRefresh}
            onCreate={canCreate ? () => setIsCreateOpen(true) : undefined}
          />
        }
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        error={query.error}
        searchPlaceholder={tt("搜索任务名称、调用目标、表达式...")}
        emptyTitle={tt("暂无定时任务")}
        emptyDescription={tt("当前还没有配置任何后台定时任务。")}
        emptyActionLabel={canCreate ? tt("新增任务") : undefined}
        onEmptyAction={canCreate ? () => setIsCreateOpen(true) : undefined}
        isFiltered={hasActiveFilters}
        getRowId={(row, index) => String(row.job_id || index)}
        selectionResetKey={`${statusFilter}:${debouncedSearch}`}
        renderRowActions={(record) => (
          <JobRowActions
            locale={locale}
            canRun={canRun}
            canViewLogs={canViewLogs}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onViewDetail={() => setDetailRecord(record)}
            onRun={() => setRunRecord(record)}
            onViewLogs={() => setLogRecord(record)}
            onEdit={() => setEditRecord(record)}
            onDelete={() => setDeleteRecord(record)}
          />
        )}
      />

      <JobFormDialog
        open={isCreateOpen}
        record={null}
        isSubmitting={createMutation.isPending}
        onOpenChange={(open) => {
          if (!createMutation.isPending) {
            setIsCreateOpen(open)
          }
        }}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
      <JobDetailDialog
        open={Boolean(detailRecord)}
        record={detailRecord}
        onOpenChange={(open) => {
          if (!open) {
            setDetailRecord(null)
          }
        }}
      />
      <JobFormDialog
        open={Boolean(editRecord)}
        record={editRecord}
        isSubmitting={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !updateMutation.isPending) {
            setEditRecord(null)
          }
        }}
        onSubmit={(payload) => {
          if (editRecord) {
            updateMutation.mutate({ jobId: editRecord.job_id, payload })
          }
        }}
      />
      <JobLogDialog
        open={Boolean(logRecord)}
        record={logRecord}
        onOpenChange={(open) => {
          if (!open) {
            setLogRecord(null)
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteRecord)}
        title={tt("删除定时任务")}
        description={translate(locale, "monitor.job.deleteDescription", {
          name: deleteRecord?.job_name ?? "",
        })}
        actionLabel={t("common.delete")}
        actionVariant="destructive"
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteRecord(null)
          }
        }}
        onConfirm={() => {
          if (deleteRecord) {
            deleteMutation.mutate(deleteRecord)
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(runRecord)}
        title={tt("执行定时任务")}
        description={translate(locale, "monitor.job.runDescription", {
          name: runRecord?.job_name ?? "",
        })}
        actionLabel={tt("立即执行")}
        isPending={runMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !runMutation.isPending) {
            setRunRecord(null)
          }
        }}
        onConfirm={() => {
          if (runRecord) {
            runMutation.mutate(runRecord)
          }
        }}
      />
    </div>
  )
}

function JobRowActions({
  locale,
  canRun,
  canViewLogs,
  canUpdate,
  canDelete,
  onRun,
  onViewDetail,
  onViewLogs,
  onEdit,
  onDelete,
}: {
  locale: Locale
  canRun: boolean
  canViewLogs: boolean
  canUpdate: boolean
  canDelete: boolean
  onViewDetail: () => void
  onRun: () => void
  onViewLogs: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className="size-7">
          <MoreHorizontalIcon />
          <span className="sr-only">{translateText(locale, "定时任务操作")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onViewDetail}>
            <InfoIcon />
            {translateText(locale, "详情")}
          </DropdownMenuItem>
          {canRun ? (
            <DropdownMenuItem onSelect={onRun}>
              <PlayIcon />
              {translateText(locale, "执行")}
            </DropdownMenuItem>
          ) : null}
          {canViewLogs ? (
            <DropdownMenuItem onSelect={onViewLogs}>
              <ClipboardListIcon />
              {translateText(locale, "日志")}
            </DropdownMenuItem>
          ) : null}
          {canUpdate ? (
            <DropdownMenuItem onSelect={onEdit}>
              <EditIcon />
              {translateText(locale, "编辑")}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon />
              {translateText(locale, "删除")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ConfirmDialog({
  open,
  title,
  description,
  actionLabel,
  actionVariant,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  actionLabel: string
  actionVariant?: "destructive"
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlertIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
