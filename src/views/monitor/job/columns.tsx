"use client"

/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from "@tanstack/react-table"

import { useTranslation } from "@/components/providers/language-context"
import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { translateText } from "@/lib/i18n-text"
import type { Locale } from "@/lib/i18n"
import type { JobLogResource, JobResource, LogStatusFlag } from "@/types/admin"
import { ResourceTableColumnHeader } from "@/views/system/_components/resource/table"

import {
  JOB_CONCURRENT_LABELS,
  JOB_INVOKE_TARGET_LABELS,
  JOB_MISFIRE_POLICY_LABELS,
} from "./constants"

type JobColumnsOptions = {
  canUpdateStatus: boolean
  isStatusPending: (record: JobResource) => boolean
  onStatusChange: (record: JobResource, checked: boolean) => void
}

export function createJobColumns({
  canUpdateStatus,
  isStatusPending,
  onStatusChange,
}: JobColumnsOptions): ColumnDef<JobResource>[] {
  return [
    textColumn("job_name", "任务名称", "min-w-40 max-w-56"),
    {
      accessorKey: "invoke_target",
      header: ({ column }) => tableHeader(column, "调用目标"),
      cell: ({ row }) => (
        <TranslatedTextCell
          value={
            JOB_INVOKE_TARGET_LABELS[row.original.invoke_target] ??
            row.original.invoke_target
          }
        />
      ),
      meta: { label: "调用目标", cellClassName: "min-w-44 max-w-72" },
    },
    textColumn("cron_expression", "执行表达式", "w-40"),
    {
      accessorKey: "status",
      header: ({ column }) => tableHeader(column, "状态"),
      cell: ({ row }) => {
        const record = row.original
        const enabled = record.status === "0"

        return (
          <div className="flex items-center">
            <Switch
              size="sm"
              checked={enabled}
              disabled={!canUpdateStatus || isStatusPending(record)}
              aria-label={`${record.job_name}${enabled ? "停用" : "启用"}`}
              onCheckedChange={(checked) => onStatusChange(record, checked)}
            />
          </div>
        )
      },
      meta: { label: "状态", cellClassName: "w-20" },
    },
    {
      accessorKey: "misfire_policy",
      header: ({ column }) => tableHeader(column, "错过策略"),
      cell: ({ row }) => (
        <TranslatedTextCell
          value={JOB_MISFIRE_POLICY_LABELS[row.original.misfire_policy]}
        />
      ),
      meta: { label: "错过策略", cellClassName: "w-32" },
    },
    {
      accessorKey: "concurrent",
      header: ({ column }) => tableHeader(column, "并发"),
      cell: ({ row }) => (
        <TranslatedTextCell
          value={JOB_CONCURRENT_LABELS[row.original.concurrent]}
        />
      ),
      meta: { label: "并发", cellClassName: "w-32" },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => tableHeader(column, "创建时间"),
      cell: ({ row }) => <DateTimeCell value={row.original.created_at} />,
      meta: { label: "创建时间", cellClassName: "w-40" },
    },
  ]
}

export const jobLogColumns: ColumnDef<JobLogResource>[] = [
  {
    accessorKey: "job_log_id",
    header: ({ column }) => tableHeader(column, "执行编号"),
    cell: ({ row }) => <TextCell value={`#${row.original.job_log_id}`} />,
    meta: { label: "执行编号", cellClassName: "w-28" },
  },
  textColumn("job_name", "任务名称", "min-w-40 max-w-56"),
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <LogStatusBadge status={row.original.status} />,
    meta: { label: "状态", cellClassName: "w-24" },
  },
  {
    id: "trigger",
    header: ({ column }) => tableHeader(column, "触发方式"),
    cell: ({ row }) => (
      <JobRunMessageTriggerCell record={row.original} />
    ),
    meta: { label: "触发方式", cellClassName: "w-24" },
  },
  {
    accessorKey: "invoke_target",
    header: ({ column }) => tableHeader(column, "调用目标"),
    cell: ({ row }) => (
      <TranslatedTextCell
        value={
          JOB_INVOKE_TARGET_LABELS[row.original.invoke_target] ??
          row.original.invoke_target
        }
      />
    ),
    meta: { label: "调用目标", cellClassName: "min-w-36 max-w-56" },
  },
  {
    id: "run_message",
    header: ({ column }) => tableHeader(column, "执行消息"),
    cell: ({ row }) => <JobRunMessageCell record={row.original} />,
    meta: { label: "执行消息", cellClassName: "min-w-56 max-w-96" },
  },
  {
    accessorKey: "started_at",
    header: ({ column }) => tableHeader(column, "开始时间"),
    cell: ({ row }) => <DateTimeCell value={row.original.started_at} />,
    meta: { label: "开始时间", cellClassName: "w-40" },
  },
  {
    accessorKey: "ended_at",
    header: ({ column }) => tableHeader(column, "结束时间"),
    cell: ({ row }) => <DateTimeCell value={row.original.ended_at} />,
    meta: { label: "结束时间", cellClassName: "w-40" },
  },
  {
    id: "duration",
    header: ({ column }) => tableHeader(column, "耗时"),
    cell: ({ row }) => <JobRunDurationCell record={row.original} />,
    meta: { label: "耗时", cellClassName: "w-24" },
  },
]

function textColumn<TData, TKey extends keyof TData & string>(
  key: TKey,
  label: string,
  cellClassName = "max-w-64"
): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => <TextCell value={getValue()} />,
    meta: { label, cellClassName },
  }
}

function tableHeader<TData, TValue>(
  column: Parameters<
    typeof ResourceTableColumnHeader<TData, TValue>
  >[0]["column"],
  title: string
) {
  return <ResourceTableColumnHeader column={column} title={title} />
}

function TextCell({ value }: { value: unknown }) {
  const text = value == null || value === "" ? "-" : String(value)

  if (text === "-") {
    return <span className="block truncate text-muted-foreground">{text}</span>
  }

  return <OverflowTooltipText text={text} />
}

function TranslatedTextCell({ value }: { value: unknown }) {
  const { locale } = useTranslation()
  const text = value == null || value === "" ? "-" : String(value)

  if (text === "-") {
    return <span className="block truncate text-muted-foreground">{text}</span>
  }

  return <OverflowTooltipText text={translateText(locale, text)} />
}

function DateTimeCell({ value }: { value?: string | null }) {
  return (
    <span title={formatAbsoluteDateTime(value, "-")}>
      {formatRelativeTime(value, "-")}
    </span>
  )
}

function LogStatusBadge({ status }: { status: LogStatusFlag }) {
  const { locale } = useTranslation()
  const success = status === "0"

  return (
    <Badge
      variant={success ? "default" : "destructive"}
      className={success ? "" : "bg-destructive/10"}
    >
      {translateText(locale, success ? "成功" : "失败")}
    </Badge>
  )
}

function JobRunMessageTriggerCell({ record }: { record: JobLogResource }) {
  const { locale } = useTranslation()
  return (
    <TextCell value={translateText(locale, parseJobRunMessage(record).trigger)} />
  )
}

function JobRunMessageCell({ record }: { record: JobLogResource }) {
  const { locale } = useTranslation()
  return (
    <TextCell value={formatRunMessageText(record.job_message ?? "", locale)} />
  )
}

function JobRunDurationCell({ record }: { record: JobLogResource }) {
  const { locale } = useTranslation()
  return <TextCell value={formatRunDuration(record, locale)} />
}

export function parseJobRunMessage(record: JobLogResource) {
  const text = record.job_message?.trim() ?? ""
  const [prefix, ...rest] = text.split(":")
  const message = rest.join(":").trim()

  if (prefix === "manual") {
    return { trigger: "手动", message }
  }

  if (prefix === "schedule") {
    return { trigger: "自动", message }
  }

  return { trigger: "-", message: text }
}

function formatRunMessageText(value: string, locale: Locale) {
  if (!value) {
    return "-"
  }

  const cleanupMatch = value.match(
    /^removed (\d+) job logs older than 30 days$/
  )
  if (cleanupMatch) {
    return locale === "en-US"
      ? `Removed ${cleanupMatch[1]} job logs older than 30 days`
      : `已清理 ${cleanupMatch[1]} 条 30 天前的任务日志`
  }

  const translations: Record<string, string> = {
    "noop completed": "空任务已完成",
    "readiness check passed": "健康检查通过",
    "readiness check failed": "健康检查失败",
    "job log cleanup failed": "任务日志清理失败",
    "PostgreSQL unavailable": "PostgreSQL 不可用",
    "unsupported invoke_target": "不支持的调用目标",
    "job skipped": "上一轮仍在执行，已跳过本次任务",
  }

  return translateText(locale, translations[value] ?? value)
}

export function formatRunDuration(record: JobLogResource, locale?: Locale) {
  if (!record.started_at || !record.ended_at) {
    return "-"
  }

  const started = new Date(record.started_at)
  const ended = new Date(record.ended_at)
  const duration = ended.getTime() - started.getTime()
  if (!Number.isFinite(duration) || duration < 0) {
    return "-"
  }

  if (duration < 1000) {
    return locale === "en-US" ? `${duration} ms` : `${duration} 毫秒`
  }

  return locale === "en-US"
    ? `${(duration / 1000).toFixed(1)} s`
    : `${(duration / 1000).toFixed(1)} 秒`
}

export { LogStatusBadge }
