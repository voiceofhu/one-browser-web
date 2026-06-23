"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { FileTextIcon } from "lucide-react"

import { listJobLogs } from "@/api/monitor/jobs"
import { useTranslation } from "@/components/providers/language-context"
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
import { translateMonitorJob } from "./constants"
import { JobRunDetailDialog } from "./job-run-detail-dialog"

type JobLogDialogProps = {
  open: boolean
  record: JobResource | null
  onOpenChange: (open: boolean) => void
}

const LOG_STATUS_FILTERS = [
  { labelKey: "job.log.all", value: "all" },
  { labelKey: "job.log.success", value: "0" },
  { labelKey: "job.log.failed", value: "1" },
] as const

export function JobLogDialog({
  open,
  record,
  onOpenChange,
}: JobLogDialogProps) {
  const { locale } = useTranslation()
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
  const statusFilterOptions = React.useMemo(
    () =>
      LOG_STATUS_FILTERS.map((option) => ({
        label: translateMonitorJob(locale, option.labelKey),
        value: option.value,
      })),
    [locale]
  )

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
            {record
              ? translateMonitorJob(locale, "job.log.title", {
                  name: record.job_name,
                })
              : translateMonitorJob(locale, "job.log.fallbackTitle")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {translateMonitorJob(locale, "job.log.description")}
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
                label={translateMonitorJob(locale, "job.log.statusFilter")}
                options={statusFilterOptions}
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
            searchPlaceholder={translateMonitorJob(
              locale,
              "job.log.searchPlaceholder"
            )}
            emptyTitle={translateMonitorJob(locale, "job.log.emptyTitle")}
            emptyDescription={translateMonitorJob(
              locale,
              "job.log.emptyDescription"
            )}
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
                <span className="sr-only">
                  {translateMonitorJob(locale, "job.log.viewDetail")}
                </span>
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
