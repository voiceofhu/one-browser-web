"use client"

/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from "@tanstack/react-table"

import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { Badge } from "@/components/ui/badge"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import type { OnlineUserResource } from "@/types/admin"
import { ResourceTableColumnHeader } from "@/views/system/_components/resource/table"

export const onlineUserColumns: ColumnDef<OnlineUserResource>[] = [
  textColumn("user_name", "登录账号", "w-40"),
  textColumn("ip_addr", "登录地址", "w-40"),
  textColumn("browser", "浏览器", "min-w-40 max-w-64"),
  textColumn("os", "操作系统", "min-w-36 max-w-56"),
  {
    accessorKey: "expires_in",
    header: ({ column }) => tableHeader(column, "剩余有效期"),
    cell: ({ row }) => <ExpiresInBadge seconds={row.original.expires_in} />,
    meta: { label: "剩余有效期", cellClassName: "w-36" },
  },
  {
    accessorKey: "login_at",
    header: ({ column }) => tableHeader(column, "登录时间"),
    cell: ({ row }) => <DateTimeCell value={row.original.login_at} />,
    meta: { label: "登录时间", cellClassName: "w-44" },
  },
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

function ExpiresInBadge({ seconds }: { seconds: number }) {
  const expired = seconds <= 0

  return (
    <Badge variant={expired ? "destructive" : "outline"}>
      {expired ? "已过期" : formatDuration(seconds)}
    </Badge>
  )
}

function formatDuration(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const restSeconds = totalSeconds % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
  }
  if (minutes > 0) {
    return restSeconds > 0 ? `${minutes}分钟${restSeconds}秒` : `${minutes}分钟`
  }

  return `${restSeconds}秒`
}
