"use client"

/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from "@tanstack/react-table"

import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { Badge } from "@/components/ui/badge"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import type {
  LoginLogSummaryResource,
  OperationLogSummaryResource,
} from "@/types/admin"
import { ResourceTableColumnHeader } from "@/views/system/_components/resource/table"
import { businessTypeLabel } from "@/views/system/log/constants"
import { LogStatusBadge } from "@/views/system/log/log-status-badge"

export const operationLogColumns: ColumnDef<OperationLogSummaryResource>[] = [
  textColumn("title", "操作模块", "min-w-48 max-w-80"),
  {
    accessorKey: "business_type",
    header: ({ column }) => tableHeader(column, "业务类型"),
    cell: ({ row }) => (
      <Badge variant="outline">
        {businessTypeLabel(row.original.business_type)}
      </Badge>
    ),
    meta: { label: "业务类型" },
  },
  textColumn("request_method", "请求方式", "w-28"),
  textColumn("oper_name", "操作人员", "w-36", "系统"),
  textColumn("oper_ip", "操作地址", "w-40"),
  textColumn("oper_url", "请求路径", "min-w-56 max-w-96"),
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <LogStatusBadge status={row.original.status} />,
    meta: { label: "状态" },
  },
  numberColumn("cost_time", "耗时(ms)", "w-28"),
  dateTimeColumn("operated_at", "操作时间"),
]

export const loginLogColumns: ColumnDef<LoginLogSummaryResource>[] = [
  textColumn("user_name", "登录账号", "w-40"),
  textColumn("ip_addr", "登录地址", "w-40"),
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <LogStatusBadge status={row.original.status} />,
    meta: { label: "状态" },
  },
  textColumn("msg", "提示消息", "min-w-48 max-w-80", "-"),
  dateTimeColumn("login_at", "登录时间"),
]

function textColumn<TData, TKey extends keyof TData & string>(
  key: TKey,
  label: string,
  cellClassName = "max-w-64",
  emptyText = "-"
): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => (
      <TextCell value={getValue()} emptyText={emptyText} />
    ),
    meta: { label, cellClassName },
  }
}

function numberColumn<TData, TKey extends keyof TData & string>(
  key: TKey,
  label: string,
  cellClassName = "w-28"
): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => <TextCell value={getValue()} />,
    meta: { label, cellClassName },
  }
}

function dateTimeColumn<
  TData extends Record<TKey, string>,
  TKey extends keyof TData & string,
>(key: TKey, label: string): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => <DateTimeCell value={getValue<string>()} />,
    meta: { label, cellClassName: "w-44" },
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

function TextCell({
  value,
  emptyText = "-",
}: {
  value: unknown
  emptyText?: string
}) {
  const isEmpty = value == null || value === ""
  const text = isEmpty ? emptyText : String(value)

  if (isEmpty) {
    return <span className="block truncate">{text}</span>
  }

  return <OverflowTooltipText text={text} />
}

function DateTimeCell({ value }: { value: string }) {
  return (
    <span title={formatAbsoluteDateTime(value)}>
      {formatRelativeTime(value)}
    </span>
  )
}
