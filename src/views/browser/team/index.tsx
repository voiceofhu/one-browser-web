"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { Column, ColumnDef } from "@tanstack/react-table"

import { listBrowserTeams } from "@/api/browser"
import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import { Badge } from "@/components/ui/badge"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { browserQueryKeys } from "@/lib/query-keys"
import type { BrowserListParams, BrowserTeamResource } from "@/types/browser"
import { useDebouncedValue } from "@/views/system/_components/resource/manager-utils"
import {
  ResourceTable,
  ResourceTableColumnHeader,
} from "@/views/system/_components/resource/table"

type TeamStatusFilter = "all" | "0" | "1"

const TEAM_FILTERS = [
  { label: "全部", value: "all" },
  { label: "启用", value: "0" },
  { label: "停用", value: "1" },
] as const

export default function BrowserTeamPage() {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] =
    React.useState<TeamStatusFilter>("all")
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
    queryKey: [...browserQueryKeys.teams, params],
    queryFn: () => listBrowserTeams(params),
    placeholderData: (previousData) => previousData,
  })
  const columns = React.useMemo<ColumnDef<BrowserTeamResource>[]>(
    () => [
      {
        accessorKey: "team_name",
        header: ({ column }) => tableHeader(column, "团队名称"),
        cell: ({ row }) => <TeamNameCell record={row.original} />,
        meta: { label: "团队名称", cellClassName: "min-w-56 max-w-72" },
      },
      {
        accessorKey: "owner_name",
        header: ({ column }) => tableHeader(column, "负责人"),
        cell: ({ row }) => <TextCell value={row.original.owner_name} />,
        meta: { label: "负责人", cellClassName: "w-36" },
      },
      {
        accessorKey: "member_count",
        header: ({ column }) => tableHeader(column, "成员"),
        cell: ({ row }) => <CountBadge value={row.original.member_count} />,
        meta: { label: "成员", cellClassName: "w-24" },
      },
      {
        accessorKey: "environment_count",
        header: ({ column }) => tableHeader(column, "环境"),
        cell: ({ row }) => (
          <CountBadge value={row.original.environment_count} />
        ),
        meta: { label: "环境", cellClassName: "w-24" },
      },
      {
        accessorKey: "proxy_count",
        header: ({ column }) => tableHeader(column, "代理"),
        cell: ({ row }) => <CountBadge value={row.original.proxy_count} />,
        meta: { label: "代理", cellClassName: "w-24" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => tableHeader(column, "状态"),
        cell: ({ row }) => <TeamStatusBadge status={row.original.status} />,
        meta: { label: "状态", cellClassName: "w-24" },
      },
      {
        accessorKey: "updated_at",
        header: ({ column }) => tableHeader(column, "最近更新"),
        cell: ({ row }) => (
          <TimeCell
            value={row.original.updated_at || row.original.created_at}
          />
        ),
        meta: { label: "最近更新", cellClassName: "w-36" },
      },
    ],
    []
  )
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all"

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <div className="min-h-0 flex-1">
        <ResourceTable
          data={query.data?.list ?? []}
          columns={columns}
          columnVisibilityResetKey="browser-teams"
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
          searchPlaceholder="搜索团队名称、团队标识、负责人"
          emptyTitle="暂无团队"
          emptyDescription="团队创建后会显示负责人、成员数量和资源规模。"
          isFiltered={hasActiveFilters}
          getRowId={(record) => String(record.team_id)}
          density="compact"
          selectionResetKey={`${statusFilter}:${debouncedSearch}`}
          toolbarLeading={
            <AnimatedSegmentedTabs
              label="团队状态"
              options={TEAM_FILTERS}
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

function TeamNameCell({ record }: { record: BrowserTeamResource }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <OverflowTooltipText text={record.team_name} className="font-medium" />
      <OverflowTooltipText
        text={record.team_key || record.remark || "-"}
        className="text-xs text-muted-foreground"
      />
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

function CountBadge({ value }: { value?: number | null }) {
  return <Badge variant="outline">{value ?? 0} 个</Badge>
}

function TeamStatusBadge({ status }: { status?: string | null }) {
  const meta = teamStatusMeta(status)

  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

function TimeCell({ value }: { value?: string | null }) {
  return (
    <span className="block truncate" title={formatAbsoluteDateTime(value, "-")}>
      {formatRelativeTime(value, "-")}
    </span>
  )
}

function teamStatusMeta(status?: string | null): {
  label: string
  variant: React.ComponentProps<typeof Badge>["variant"]
} {
  const normalized = status?.trim().toLowerCase()

  switch (normalized) {
    case "active":
    case "enabled":
    case "0":
      return { label: "启用", variant: "default" }
    case "disabled":
    case "1":
      return { label: "停用", variant: "outline" }
    default:
      return { label: status?.trim() || "未知", variant: "outline" }
  }
}

function tableHeader<TData, TValue>(
  column: Column<TData, TValue>,
  title: string
) {
  return <ResourceTableColumnHeader column={column} title={title} />
}
