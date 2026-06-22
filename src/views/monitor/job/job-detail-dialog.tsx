"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarClockIcon, InfoIcon } from "lucide-react"

import { getJob } from "@/api/monitor/jobs"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { monitorQueryKeys } from "@/lib/query-keys"
import type { JobResource } from "@/types/admin"

import {
  JOB_CONCURRENT_LABELS,
  JOB_INVOKE_TARGET_LABELS,
  JOB_MISFIRE_POLICY_LABELS,
  JOB_STATUS_LABELS,
} from "./constants"
import { getNextScheduleTimes } from "./schedule-preview"

type JobDetailDialogProps = {
  open: boolean
  record: JobResource | null
  onOpenChange: (open: boolean) => void
}

export function JobDetailDialog({
  open,
  record,
  onOpenChange,
}: JobDetailDialogProps) {
  const query = useQuery({
    queryKey: [...monitorQueryKeys.jobs, "detail", record?.job_id],
    queryFn: () => getJob(record!.job_id),
    enabled: open && Boolean(record),
    initialData: record ?? undefined,
  })
  const detail = query.data ?? record
  const preview = React.useMemo(
    () => getNextScheduleTimes(detail?.cron_expression ?? ""),
    [detail?.cron_expression]
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="p-0 sm:max-w-2xl">
        <ResponsiveDialogHeader className="border-b px-5 py-3 text-left">
          <ResponsiveDialogTitle>
            {detail?.job_name ?? "任务详情"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            查看定时任务配置与后续执行时间。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-4 px-5 py-4">
          {detail ? (
            <>
              <section className="rounded-lg bg-muted/40 p-4">
                <div className="mb-3 flex items-center gap-2 font-medium">
                  <InfoIcon className="size-4 text-muted-foreground" />
                  基本信息
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <DetailItem label="调用目标">
                    {JOB_INVOKE_TARGET_LABELS[detail.invoke_target] ??
                      detail.invoke_target}
                  </DetailItem>
                  <DetailItem label="执行表达式">
                    {detail.cron_expression || "-"}
                  </DetailItem>
                  <DetailItem label="状态">
                    <Badge
                      variant={detail.status === "0" ? "default" : "secondary"}
                    >
                      {JOB_STATUS_LABELS[detail.status]}
                    </Badge>
                  </DetailItem>
                  <DetailItem label="错过策略">
                    {JOB_MISFIRE_POLICY_LABELS[detail.misfire_policy]}
                  </DetailItem>
                  <DetailItem label="并发执行">
                    {JOB_CONCURRENT_LABELS[detail.concurrent]}
                  </DetailItem>
                  <DetailItem
                    label="创建时间"
                    title={formatAbsoluteDateTime(detail.created_at, "-")}
                  >
                    {formatRelativeTime(detail.created_at, "-")}
                  </DetailItem>
                  <DetailItem label="备注" className="md:col-span-2">
                    {detail.remark || "-"}
                  </DetailItem>
                </div>
              </section>

              <section className="rounded-lg bg-muted/40 p-4">
                <div className="mb-3 flex items-center gap-2 font-medium">
                  <CalendarClockIcon className="size-4 text-muted-foreground" />
                  后续执行
                </div>
                {preview.ok ? (
                  <div className="flex flex-wrap gap-2">
                    {preview.times.map((time) => (
                      <Badge key={time.toISOString()} variant="secondary">
                        {formatAbsoluteDateTime(time.toISOString(), "-")}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-destructive">
                    {preview.message}
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
              -
            </div>
          )}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function DetailItem({
  label,
  children,
  className,
  title,
}: {
  label: string
  children: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <div className={className} title={title}>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium break-words">{children}</div>
    </div>
  )
}
