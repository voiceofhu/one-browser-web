"use client"

import type * as React from "react"
import { CheckCircle2Icon, CircleAlertIcon } from "lucide-react"

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

import { JOB_INVOKE_TARGET_LABELS } from "./constants"
import {
  formatRunDuration,
  LogStatusBadge,
  parseJobRunMessage,
} from "./columns"

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
  const runMessage = record ? parseJobRunMessage(record) : null
  const success = record?.status === "0"

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="p-0 sm:max-w-3xl">
        <ResponsiveDialogHeader className="border-b px-5 py-3 text-left">
          <ResponsiveDialogTitle className="flex items-center gap-2">
            执行记录详情
            {record ? <LogStatusBadge status={record.status} /> : null}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            查看单次任务执行的输入、状态与输出结果。
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
                  Run #{record.job_log_id}
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <DetailItem label="任务名称">{record.job_name}</DetailItem>
                  <DetailItem label="触发方式">{runMessage.trigger}</DetailItem>
                  <DetailItem label="调用目标">
                    {JOB_INVOKE_TARGET_LABELS[record.invoke_target] ??
                      record.invoke_target}
                  </DetailItem>
                  <DetailItem label="耗时">
                    {formatRunDuration(record)}
                  </DetailItem>
                  <DetailItem label="开始时间">
                    {formatAbsoluteDateTime(record.started_at, "-")}
                  </DetailItem>
                  <DetailItem label="结束时间">
                    {formatAbsoluteDateTime(record.ended_at, "-")}
                  </DetailItem>
                </div>
              </section>

              <section className="rounded-lg bg-muted/40 p-4">
                <div className="mb-2 font-medium">执行消息</div>
                <div className="rounded-md bg-background px-3 py-2 text-sm">
                  {runMessage.message || "-"}
                </div>
              </section>

              <section className="rounded-lg bg-muted/40 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  异常信息
                  {record.exception_info ? (
                    <Badge variant="destructive">已记录</Badge>
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
