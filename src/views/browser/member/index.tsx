"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { Column, ColumnDef } from "@tanstack/react-table"

import { listBrowserMembers } from "@/api/browser"
import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { browserQueryKeys } from "@/lib/query-keys"
import type { BrowserListParams, BrowserMemberResource } from "@/types/browser"
import { useDebouncedValue } from "@/views/system/_components/resource/manager-utils"
import {
  ResourceTable,
  ResourceTableColumnHeader,
} from "@/views/system/_components/resource/table"

type MemberStatusFilter = "all" | "active" | "disabled"

const MEMBER_FILTERS = [
  { label: "全部", value: "all" },
  { label: "活跃", value: "active" },
  { label: "停用", value: "disabled" },
] as const

export default function BrowserMemberPage() {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] =
    React.useState<MemberStatusFilter>("all")
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
    queryKey: [...browserQueryKeys.members, params],
    queryFn: () => listBrowserMembers(params),
    placeholderData: (previousData) => previousData,
  })
  const columns = React.useMemo<ColumnDef<BrowserMemberResource>[]>(
    () => [
      {
        accessorKey: "display_name",
        header: ({ column }) => tableHeader(column, "成员"),
        cell: ({ row }) => <MemberIdentityCell record={row.original} />,
        meta: { label: "成员", cellClassName: "min-w-56 max-w-72" },
      },
      {
        accessorKey: "email",
        header: ({ column }) => tableHeader(column, "账号"),
        cell: ({ row }) => <AccountCell record={row.original} />,
        meta: { label: "账号", cellClassName: "min-w-52 max-w-72" },
      },
      {
        id: "role_names",
        header: ({ column }) => tableHeader(column, "团队角色"),
        cell: ({ row }) => <RoleNamesCell values={row.original.role_names} />,
        meta: { label: "团队角色", cellClassName: "min-w-40 max-w-56" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => tableHeader(column, "状态"),
        cell: ({ row }) => <MemberStatusBadge status={row.original.status} />,
        meta: { label: "状态", cellClassName: "w-24" },
      },
      {
        accessorKey: "last_active_at",
        header: ({ column }) => tableHeader(column, "最近活跃"),
        cell: ({ row }) => (
          <LastActiveCell value={row.original.last_active_at} />
        ),
        meta: { label: "最近活跃", cellClassName: "w-36" },
      },
      {
        accessorKey: "environment_count",
        header: ({ column }) => tableHeader(column, "负责环境"),
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.environment_count} 个</Badge>
        ),
        meta: { label: "负责环境", cellClassName: "w-28" },
      },
    ],
    []
  )
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all"

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <div className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-3 lg:px-6">
        <header className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">成员管理</h1>
          <p className="text-sm text-muted-foreground">
            管理团队成员、账号绑定和团队内角色。
          </p>
        </header>
      </div>

      <div className="min-h-0 flex-1">
        <ResourceTable
          data={query.data?.list ?? []}
          columns={columns}
          columnVisibilityResetKey="browser-members"
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
          searchPlaceholder="搜索成员、账号、团队角色"
          emptyTitle="暂无成员"
          emptyDescription="成员接入后会显示账号、团队角色、状态和最近活跃时间。"
          isFiltered={hasActiveFilters}
          getRowId={(record) => String(record.member_id)}
          density="compact"
          selectionResetKey={`${statusFilter}:${debouncedSearch}`}
          toolbarLeading={
            <AnimatedSegmentedTabs
              label="成员状态"
              options={MEMBER_FILTERS}
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

function MemberIdentityCell({ record }: { record: BrowserMemberResource }) {
  const name = getMemberName(record)

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar size="sm">
        <AvatarFallback>{name.slice(0, 1) || "成"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <OverflowTooltipText text={name} className="font-medium" />
        <OverflowTooltipText
          text={record.team_name || "-"}
          className="text-xs text-muted-foreground"
        />
      </div>
    </div>
  )
}

function AccountCell({ record }: { record: BrowserMemberResource }) {
  const primary = record.email || record.user_name || "-"
  const secondary = record.email && record.user_name ? record.user_name : "-"

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <OverflowTooltipText text={primary} className="font-medium" />
      <OverflowTooltipText
        text={secondary}
        className="text-xs text-muted-foreground"
      />
    </div>
  )
}

function RoleNamesCell({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="block truncate text-muted-foreground">-</span>
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {values.slice(0, 2).map((role) => (
        <Badge
          key={role}
          variant={
            role === "所有者" || role === "团队管理员" ? "default" : "outline"
          }
        >
          {role}
        </Badge>
      ))}
      {values.length > 2 ? (
        <Badge variant="secondary">+{values.length - 2}</Badge>
      ) : null}
    </div>
  )
}

function MemberStatusBadge({ status }: { status?: string | null }) {
  const meta = memberStatusMeta(status)

  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

function LastActiveCell({ value }: { value?: string | null }) {
  return (
    <span className="block truncate" title={formatAbsoluteDateTime(value, "-")}>
      {formatRelativeTime(value, "-")}
    </span>
  )
}

function getMemberName(record: BrowserMemberResource) {
  return (
    record.display_name?.trim() ||
    record.nick_name?.trim() ||
    record.user_name?.trim() ||
    "-"
  )
}

function memberStatusMeta(status?: string | null): {
  label: string
  variant: React.ComponentProps<typeof Badge>["variant"]
} {
  const normalized = status?.trim().toLowerCase()

  switch (normalized) {
    case "active":
    case "enabled":
    case "0":
      return { label: "活跃", variant: "default" }
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
