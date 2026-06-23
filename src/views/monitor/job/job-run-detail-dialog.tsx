"use client"

import type * as React from "react"
import { CheckCircle2Icon, CircleAlertIcon } from "lucide-react"

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
import { formatAbsoluteDateTime } from "@/lib/datetime"
import type { JobLogResource } from "@/types/admin"

import {
  formatRunDuration,
  LogStatusBadge,
  parseJobRunMessage,
} from "./columns"
import {
  formatJobRunMessage,
  getJobInvokeTargetLabel,
  getJobRunTriggerLabel,
  translateMonitorJob,
} from "./constants"

type JobRunDetailDialogProps = {
  open: boolean
  record: JobLogResource | null
  onOpenChange: (open: boolean) => void
}

export function JobRunDetailDialog({
  open,
  record,
  onOpenChange,
}: JobRunDetailDialogProps) {
  const { locale } = useTranslation()
  const runMessage = record ? parseJobRunMessage(record) : null
  const success = record?.status === "0"

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="p-0 sm:max-w-3xl">
        <ResponsiveDialogHeader className="border-b px-5 py-3 text-left">
          <ResponsiveDialogTitle className="flex items-center gap-2">
            {translateMonitorJob(locale, "job.runDetail.title")}
            {record ? <LogStatusBadge status={record.status} /> : null}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {translateMonitorJob(locale, "job.runDetail.description")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-4 px-5 py-4">
          {record && runMessage ? (
            <>
              <section className="rounded-lg bg-muted/40 p-4">
                <div className="mb-3 flex items-center gap-2 font-medium">
                  {success ? (
                    <CheckCircle2Icon className="size-4 text-primary" />
                  ) : (
                    <CircleAlertIcon className="size-4 text-destructive" />
                  )}
                  {translateMonitorJob(locale, "job.runDetail.runTitle", {
                    id: record.job_log_id,
                  })}
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <DetailItem
                    label={translateMonitorJob(locale, "job.runDetail.jobName")}
                  >
                    {record.job_name}
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(locale, "job.runDetail.trigger")}
                  >
                    {getJobRunTriggerLabel(locale, runMessage.trigger)}
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(
                      locale,
                      "job.runDetail.invokeTarget"
                    )}
                  >
                    {getJobInvokeTargetLabel(locale, record.invoke_target)}
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(
                      locale,
                      "job.runDetail.duration"
                    )}
                  >
                    {formatRunDuration(record, locale)}
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(
                      locale,
                      "job.runDetail.startedAt"
                    )}
                  >
                    {formatAbsoluteDateTime(record.started_at, "-")}
                  </DetailItem>
                  <DetailItem
                    label={translateMonitorJob(locale, "job.runDetail.endedAt")}
                  >
                    {formatAbsoluteDateTime(record.ended_at, "-")}
                  </DetailItem>
                </div>
              </section>

              <section className="rounded-lg bg-muted/40 p-4">
                <div className="mb-2 font-medium">
                  {translateMonitorJob(locale, "job.runDetail.message")}
                </div>
                <div className="rounded-md bg-background px-3 py-2 text-sm">
                  {formatJobRunMessage(locale, runMessage.message)}
                </div>
              </section>

              <section className="rounded-lg bg-muted/40 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  {translateMonitorJob(locale, "job.runDetail.exception")}
                  {record.exception_info ? (
                    <Badge variant="destructive">
                      {translateMonitorJob(locale, "job.runDetail.recorded")}
                    </Badge>
                  ) : null}
                </div>
                <pre className="max-h-64 overflow-auto rounded-md bg-background px-3 py-2 text-sm whitespace-pre-wrap">
                  {record.exception_info || "-"}
                </pre>
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
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium break-words">{children || "-"}</div>
    </div>
  )
}
