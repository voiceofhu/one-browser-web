"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { FileTextIcon } from "lucide-react"

import { listJobLogs } from "@/api/monitor/jobs"
import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { monitorQueryKeys } from "@/lib/query-keys"
import type { JobListParams, JobLogResource, JobResource } from "@/types/admin"
import { useDebouncedValue } from "@/views/system/_components/resource/manager-utils"
import { ResourceStatusFilterTabs } from "@/views/system/_components/resource/status-filter-tabs"
import type { ResourceStatusFilterValue } from "@/views/system/_components/resource/status-filter-tabs"
import { ResourceTable } from "@/views/system/_components/resource/table"

import { jobLogColumns } from "./columns"
import { JobRunDetailDialog } from "./job-run-detail-dialog"

type JobLogDialogProps = {
  open: boolean
  record: JobResource | null
  onOpenChange: (open: boolean) => void
}

const LOG_STATUS_FILTERS = [
  { label: "全部", value: "all" },
  { label: "成功", value: "0" },
  { label: "失败", value: "1" },
] as const

export function JobLogDialog({
  open,
  record,
  onOpenChange,
}: JobLogDialogProps) {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] =
    React.useState<ResourceStatusFilterValue>("all")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [detailRecord, setDetailRecord] = React.useState<JobLogResource | null>(
    null
  )
  const params = React.useMemo<JobListParams>(
    () => ({
      page: pageIndex + 1,
      page_size: pageSize,
      keyword: debouncedSearch || record?.job_name || undefined,
      job_group: record?.job_group,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [debouncedSearch, pageIndex, pageSize, record, statusFilter]
  )
  const queryKey = React.useMemo(
    () =>
      [...monitorQueryKeys.jobLogs, record?.job_id ?? "all", params] as const,
    [params, record?.job_id]
  )
  const query = useQuery({
    queryKey,
    queryFn: () => listJobLogs(params),
    enabled: open,
    placeholderData: (previousData) => previousData,
  })
  const records = React.useMemo(
    () => query.data?.list ?? [],
    [query.data?.list]
  )
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all"

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSearch("")
      setStatusFilter("all")
      setPageIndex(0)
      setDetailRecord(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="max-h-[88svh] p-0 sm:max-w-5xl">
        <ResponsiveDialogHeader className="border-b px-5 py-3 text-left">
          <ResponsiveDialogTitle>
            {record ? `${record.job_name} 执行记录` : "执行记录"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            查看定时任务最近执行结果，每一条记录对应一次 run。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="max-h-[72svh] min-h-[360px] overflow-hidden p-0">
          <ResourceTable
            data={records}
            columns={jobLogColumns}
            columnVisibilityResetKey={record?.job_id ?? "job-logs"}
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
                label="调度日志状态筛选"
                options={LOG_STATUS_FILTERS}
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setPageIndex(0)
                }}
              />
            }
            isLoading={query.isLoading}
            isFetching={query.isFetching}
            error={query.error}
            searchPlaceholder="搜索任务、调用目标、执行消息..."
            emptyTitle="暂无执行记录"
            emptyDescription="当前任务还没有执行记录。"
            isFiltered={hasActiveFilters}
            getRowId={(row, index) => String(row.job_log_id || index)}
            selectionResetKey={`${record?.job_id ?? "all"}:${statusFilter}:${debouncedSearch}`}
            renderRowActions={(row) => (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                onClick={() => setDetailRecord(row)}
              >
                <FileTextIcon />
                <span className="sr-only">查看执行记录详情</span>
              </Button>
            )}
          />
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
      <JobRunDetailDialog
        open={Boolean(detailRecord)}
        record={detailRecord}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDetailRecord(null)
          }
        }}
      />
    </ResponsiveDialog>
  )
}
