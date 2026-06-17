"use client"

/* eslint-disable react-refresh/only-export-components */
import { format } from "date-fns"
import { zhCN } from "date-fns/locale/zh-CN"
import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import type {
  LoginLogResource,
  LogStatusFlag,
  OperationLogResource,
} from "@/types/admin"
import { ResourceTableColumnHeader } from "@/views/system/_components/resource/table"

const LOG_STATUS_LABELS = {
  "0": "成功",
  "1": "失败",
} as const

const BUSINESS_TYPE_LABELS: Record<number, string> = {
  0: "其他",
  1: "新增",
  2: "修改",
  3: "删除",
}

export const operationLogColumns: ColumnDef<OperationLogResource>[] = [
  textColumn("title", "操作模块", "min-w-48 max-w-80"),
  {
    accessorKey: "business_type",
    header: ({ column }) => tableHeader(column, "业务类型"),
    cell: ({ row }) => (
      <Badge variant="outline">
        {BUSINESS_TYPE_LABELS[row.original.business_type] ??
          row.original.business_type}
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
  textColumn("error_msg", "错误信息", "max-w-64", "-"),
  textColumn("oper_param", "请求参数", "max-w-80", "-"),
  textColumn("json_result", "返回结果", "max-w-64", "-"),
]

export const loginLogColumns: ColumnDef<LoginLogResource>[] = [
  textColumn("user_name", "登录账号", "w-40"),
  textColumn("ip_addr", "登录地址", "w-40"),
  textColumn("login_location", "登录地点", "w-40", "-"),
  textColumn("browser", "浏览器", "min-w-56 max-w-80", "-"),
  textColumn("os", "操作系统", "w-40", "-"),
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
  emptyText = "无"
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

function LogStatusBadge({ status }: { status: LogStatusFlag }) {
  return (
    <Badge variant={status === "0" ? "secondary" : "destructive"}>
      {LOG_STATUS_LABELS[status]}
    </Badge>
  )
}

function TextCell({
  value,
  emptyText = "无",
}: {
  value: unknown
  emptyText?: string
}) {
  const text = value == null || value === "" ? emptyText : String(value)

  return <span className="block truncate">{text}</span>
}

function DateTimeCell({ value }: { value: string }) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return <span>{value}</span>
  }

  return (
    <span title={date.toISOString()}>
      {format(date, "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
    </span>
  )
}
