"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarClockIcon, InfoIcon } from "lucide-react"

import { getJob } from "@/api/monitor/jobs"
import { useTranslation } from "@/components/providers/language-context"
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
  getJobConcurrentLabel,
  getJobInvokeTargetLabel,
  getJobMisfirePolicyLabel,
  getJobStatusLabel,
  translateJobScheduleError,
  translateMonitorJob,
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
  const { locale } = useTranslation()
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
            {detail?.job_name ??
              translateMonitorJob(locale, "job.detail.fallbackTitle")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {translateMonitorJob(locale, "job.detail.description")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-4 px-5 py-4">
          {detail ? (
            <>
              <section className="rounded-lg bg-muted/40 p-4">
                <div className="mb-3 flex items-center gap-2 font-medium">
                  <InfoIcon className="size-4 text-muted-foreground" />
                  {translateMonitorJob(locale, "job.detail.basicInfo")}
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <DetailItem
                    label={translateMonitorJob(
                      locale,
                      "job.detail.invokeTarget"
                    )}
                  >
                    {getJobInvokeTargetLabel(locale, detail.invoke_target)}
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(
                      locale,
                      "job.detail.cronExpression"
                    )}
                  >
                    {detail.cron_expression || "-"}
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(locale, "job.detail.status")}
                  >
                    <Badge
                      variant={detail.status === "0" ? "default" : "secondary"}
                    >
                      {getJobStatusLabel(locale, detail.status)}
                    </Badge>
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(
                      locale,
                      "job.detail.misfirePolicy"
                    )}
                  >
                    {getJobMisfirePolicyLabel(locale, detail.misfire_policy)}
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(locale, "job.detail.concurrent")}
                  >
                    {getJobConcurrentLabel(locale, detail.concurrent)}
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(locale, "job.detail.createdAt")}
                    title={formatAbsoluteDateTime(detail.created_at, "-")}
                  >
                    {formatRelativeTime(detail.created_at, "-")}
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(locale, "job.detail.remark")}
                    className="md:col-span-2"
                  >
                    {detail.remark || "-"}
                  </DetailItem>
                </div>
              </section>

              <section className="rounded-lg bg-muted/40 p-4">
                <div className="mb-3 flex items-center gap-2 font-medium">
                  <CalendarClockIcon className="size-4 text-muted-foreground" />
                  {translateMonitorJob(locale, "job.detail.nextRuns")}
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
                    {translateJobScheduleError(locale, preview.message)}
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
