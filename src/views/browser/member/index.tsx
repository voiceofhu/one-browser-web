"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Column, ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { listBrowserMembers, setBrowserMemberStatus } from "@/api/browser"
import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useAuthPermissions } from "@/hooks/use-auth"
import { hasTeamPermission } from "@/lib/auth-permissions"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { browserQueryKeys } from "@/lib/query-keys"
import type {
  BrowserListParams,
  BrowserMemberResource,
  BrowserStatusFlag,
} from "@/types/browser"
import { useDebouncedValue } from "@/views/system/_components/resource/manager-utils"
import {
  ResourceTable,
  ResourceTableColumnHeader,
} from "@/views/system/_components/resource/table"
import { showResourceError } from "@/views/system/_components/resource/toast"

type MemberStatusFilter = "all" | "0" | "1"

const MEMBER_FILTERS = [
  { label: "全部", value: "all" },
  { label: "启用", value: "0" },
  { label: "停用", value: "1" },
] as const

export default function BrowserMemberPage() {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const canChangeMemberStatus = React.useCallback(
    (teamId: number) =>
      hasTeamPermission(authPermissions.data, teamId, "browser:member:status"),
    [authPermissions.data]
  )
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
  const statusMutation = useMutation({
    mutationFn: ({
      memberId,
      teamId,
      status,
    }: {
      memberId: number
      teamId: number
      status: BrowserStatusFlag
    }) => setBrowserMemberStatus(memberId, teamId, status),
    onSuccess: async (_member, variables) => {
      await queryClient.invalidateQueries({
        queryKey: browserQueryKeys.members,
      })
      toast.success(variables.status === "0" ? "成员已启用" : "成员已停用")
    },
    onError: showResourceError,
  })
  const toggleMemberStatus = React.useCallback(
    (record: BrowserMemberResource, status: BrowserStatusFlag) => {
      if (!canChangeMemberStatus(record.team_id)) {
        return
      }

      statusMutation.mutate({
        memberId: record.member_id,
        teamId: record.team_id,
        status,
      })
    },
    [canChangeMemberStatus, statusMutation]
  )
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
        header: ({ column }) => tableHeader(column, "联系方式"),
        cell: ({ row }) => <MemberContactCell record={row.original} />,
        meta: { label: "联系方式", cellClassName: "min-w-52 max-w-72" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => tableHeader(column, "状态"),
        cell: ({ row }) => (
          <StatusSwitchCell
            label="成员状态"
            status={row.original.status}
            disabled={
              !canChangeMemberStatus(row.original.team_id) ||
              statusMutation.isPending
            }
            onChange={(status) => toggleMemberStatus(row.original, status)}
          />
        ),
        meta: { label: "状态", cellClassName: "w-20" },
      },
      {
        id: "role_names",
        header: ({ column }) => tableHeader(column, "角色"),
        cell: ({ row }) => <RoleNamesCell values={row.original.role_names} />,
        meta: { label: "角色", cellClassName: "min-w-40 max-w-56" },
      },
      {
        accessorKey: "environment_count",
        header: ({ column }) => tableHeader(column, "环境"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.environment_count} 个
          </span>
        ),
        meta: { label: "环境", cellClassName: "w-24" },
      },
      {
        accessorKey: "last_active_at",
        header: ({ column }) => tableHeader(column, "最近活跃"),
        cell: ({ row }) => (
          <LastActiveCell
            value={row.original.last_active_at || row.original.updated_at}
          />
        ),
        meta: { label: "最近活跃", cellClassName: "w-36" },
      },
      {
        id: "actions",
        header: ({ column }) => tableHeader(column, "操作"),
        cell: () => <span className="text-muted-foreground">-</span>,
        meta: { label: "操作", cellClassName: "w-20 text-right" },
      },
    ],
    [canChangeMemberStatus, statusMutation.isPending, toggleMemberStatus]
  )
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all"

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
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

function MemberContactCell({ record }: { record: BrowserMemberResource }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <OverflowTooltipText text={record.email || "-"} />
      <OverflowTooltipText
        text={record.phone_number || record.team_name || "-"}
        className="text-xs text-muted-foreground"
      />
    </div>
  )
}

function RoleNamesCell({ values }: { values: string[] }) {
  const roleNames = values.length ? values : ["成员"]

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {roleNames.slice(0, 3).map((role) => (
        <Badge key={role} variant={memberRoleBadgeVariant(role)}>
          {role}
        </Badge>
      ))}
      {roleNames.length > 3 ? (
        <Badge variant="secondary">+{roleNames.length - 3}</Badge>
      ) : null}
    </div>
  )
}

function memberRoleBadgeVariant(
  value: string
): React.ComponentProps<typeof Badge>["variant"] {
  if (value === "Owner" || value === "所有者" || value === "团队管理员") {
    return "default"
  }

  if (value === "成员") {
    return "secondary"
  }

  return "outline"
}

function StatusSwitchCell({
  label,
  status,
  disabled,
  onChange,
}: {
  label: string
  status: BrowserStatusFlag
  disabled: boolean
  onChange: (status: BrowserStatusFlag) => void
}) {
  const checked = status === "0"

  return (
    <Switch
      size="sm"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onCheckedChange={(nextChecked) => onChange(nextChecked ? "0" : "1")}
    />
  )
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

function tableHeader<TData, TValue>(
  column: Column<TData, TValue>,
  title: string
) {
  return <ResourceTableColumnHeader column={column} title={title} />
}
