"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { Column, ColumnDef } from "@tanstack/react-table"

import { listBrowserProxies } from "@/api/browser"
import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import { Badge } from "@/components/ui/badge"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { browserQueryKeys } from "@/lib/query-keys"
import type { BrowserListParams, BrowserProxyResource } from "@/types/browser"
import { useDebouncedValue } from "@/views/system/_components/resource/manager-utils"
import {
  ResourceTable,
  ResourceTableColumnHeader,
} from "@/views/system/_components/resource/table"

type ProxyStatusFilter =
  | "all"
  | "ok"
  | "checking"
  | "blocked"
  | "error"
  | "unchecked"

const PROXY_FILTERS = [
  { label: "全部", value: "all" },
  { label: "正常", value: "ok" },
  { label: "检测中", value: "checking" },
  { label: "阻断", value: "blocked" },
  { label: "异常", value: "error" },
  { label: "未检测", value: "unchecked" },
] as const

export default function BrowserProxyPage() {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] =
    React.useState<ProxyStatusFilter>("all")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const params = React.useMemo<BrowserListParams>(
    () => ({
      page: pageIndex + 1,
      page_size: pageSize,
      keyword: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [debouncedSearch, pageIndex, pageSize, statusFilter]
  )
  const query = useQuery({
    queryKey: [...browserQueryKeys.proxies, params],
    queryFn: () => listBrowserProxies(params),
    placeholderData: (previousData) => previousData,
  })
  const columns = React.useMemo<ColumnDef<BrowserProxyResource>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => tableHeader(column, "代理名称"),
        cell: ({ row }) => <ProxyNameCell record={row.original} />,
        meta: { label: "代理名称", cellClassName: "min-w-56 max-w-72" },
      },
      {
        accessorKey: "type",
        header: ({ column }) => tableHeader(column, "类型"),
        cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
        meta: { label: "类型", cellClassName: "w-28" },
      },
      {
        accessorKey: "last_check_exit_ip",
        header: ({ column }) => tableHeader(column, "出口 IP"),
        cell: ({ row }) => <TextCell value={row.original.last_check_exit_ip} />,
        meta: { label: "出口 IP", cellClassName: "w-40" },
      },
      {
        accessorKey: "last_check_status",
        header: ({ column }) => tableHeader(column, "检测状态"),
        cell: ({ row }) => <ProxyStatusCell record={row.original} />,
        meta: { label: "检测状态", cellClassName: "w-40" },
      },
      {
        id: "linked_environment_names",
        header: ({ column }) => tableHeader(column, "关联环境"),
        cell: ({ row }) => (
          <LinkedEnvironmentCell
            values={row.original.linked_environment_names}
          />
        ),
        meta: { label: "关联环境", cellClassName: "min-w-48 max-w-64" },
      },
      {
        accessorKey: "owner_name",
        header: ({ column }) => tableHeader(column, "负责人"),
        cell: ({ row }) => <TextCell value={row.original.owner_name} />,
        meta: { label: "负责人", cellClassName: "w-32" },
      },
    ],
    []
  )
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all"

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <div className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-3 lg:px-6">
        <header className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">代理管理</h1>
          <p className="text-sm text-muted-foreground">
            管理团队代理、检测出口和环境关联。
          </p>
        </header>
      </div>

      <div className="min-h-0 flex-1">
        <ResourceTable
          data={query.data?.list ?? []}
          columns={columns}
          columnVisibilityResetKey="browser-proxies"
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
          searchPlaceholder="搜索代理名称、出口 IP、负责人"
          emptyTitle="暂无代理"
          emptyDescription="代理接入后会显示出口状态、负责人和关联环境。"
          isFiltered={hasActiveFilters}
          getRowId={(record) => String(record.proxy_id)}
          density="compact"
          selectionResetKey={`${statusFilter}:${debouncedSearch}`}
          toolbarLeading={
            <AnimatedSegmentedTabs
              label="代理状态"
              options={PROXY_FILTERS}
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
        />
      </div>
    </div>
  )
}

function ProxyNameCell({ record }: { record: BrowserProxyResource }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <OverflowTooltipText text={record.name} className="font-medium" />
      <OverflowTooltipText
        text={record.remark || "-"}
        className="text-xs text-muted-foreground"
      />
    </div>
  )
}

function ProxyStatusCell({ record }: { record: BrowserProxyResource }) {
  const status = proxyStatusMeta(record.last_check_status || record.status)
  const checkedAt = record.last_check_checked_at
    ? formatRelativeTime(record.last_check_checked_at, "-")
    : "-"

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Badge variant={status.variant}>{status.label}</Badge>
      <span
        className="truncate text-xs text-muted-foreground"
        title={formatAbsoluteDateTime(record.last_check_checked_at, "-")}
      >
        {checkedAt}
      </span>
    </div>
  )
}

function LinkedEnvironmentCell({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="block truncate text-muted-foreground">-</span>
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Badge variant="outline">{values.length} 个</Badge>
      <OverflowTooltipText text={values.join("、")} />
    </div>
  )
}

function TextCell({ value }: { value?: string | null }) {
  const text = value?.trim() || "-"

  if (text === "-") {
    return <span className="block truncate text-muted-foreground">{text}</span>
  }

  return <OverflowTooltipText text={text} />
}

function proxyStatusMeta(status?: string | null): {
  label: string
  variant: React.ComponentProps<typeof Badge>["variant"]
} {
  const normalized = status?.trim().toLowerCase()

  switch (normalized) {
    case "ok":
    case "success":
    case "normal":
      return { label: "正常", variant: "default" }
    case "checking":
    case "pending":
      return { label: "检测中", variant: "secondary" }
    case "blocked":
      return { label: "阻断", variant: "destructive" }
    case "error":
    case "failed":
    case "failure":
      return { label: "异常", variant: "destructive" }
    case "unchecked":
    case "unknown":
      return { label: "未检测", variant: "outline" }
    default:
      return { label: status?.trim() || "未检测", variant: "outline" }
  }
}

function tableHeader<TData, TValue>(
  column: Column<TData, TValue>,
  title: string
) {
  return <ResourceTableColumnHeader column={column} title={title} />
}
