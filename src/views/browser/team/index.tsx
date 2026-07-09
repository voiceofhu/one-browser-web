"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Column, ColumnDef } from "@tanstack/react-table"
import {
  LaptopIcon,
  MoreHorizontalIcon,
  RouteIcon,
  UserMinusIcon,
  UsersRoundIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  leaveBrowserTeam,
  listBrowserTeams,
  setBrowserTeamStatus,
} from "@/api/browser"
import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  AlertDialogActionButton,
  AlertDialogCancelButton,
} from "@/components/ui/dialog-action-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { useAuthPermissions } from "@/hooks/use-auth"
import { hasPermission } from "@/lib/auth-permissions"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { browserQueryKeys } from "@/lib/query-keys"
import type {
  BrowserListParams,
  BrowserStatusFlag,
  BrowserTeamResource,
} from "@/types/browser"
import { useDebouncedValue } from "@/views/system/_components/resource/manager-utils"
import {
  ResourceTable,
  ResourceTableColumnHeader,
} from "@/views/system/_components/resource/table"
import { showResourceError } from "@/views/system/_components/resource/toast"

type TeamStatusFilter = "all" | "0" | "1"

const TEAM_FILTERS = [
  { label: "全部", value: "all" },
  { label: "启用", value: "0" },
  { label: "停用", value: "1" },
] as const

export default function BrowserTeamPage() {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const canChangeTeamStatus = hasPermission(
    authPermissions.data,
    "browser:team:status"
  )
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] =
    React.useState<TeamStatusFilter>("all")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [leaveTarget, setLeaveTarget] =
    React.useState<BrowserTeamResource | null>(null)
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
  const leaveMutation = useMutation({
    mutationFn: (record: BrowserTeamResource) =>
      leaveBrowserTeam(record.team_id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: browserQueryKeys.teams })
      toast.success("已退出团队")
      setLeaveTarget(null)
    },
    onError: showResourceError,
  })
  const statusMutation = useMutation({
    mutationFn: ({
      teamId,
      status,
    }: {
      teamId: number
      status: BrowserStatusFlag
    }) => setBrowserTeamStatus(teamId, status),
    onSuccess: async (_team, variables) => {
      await queryClient.invalidateQueries({ queryKey: browserQueryKeys.teams })
      toast.success(variables.status === "0" ? "团队已启用" : "团队已停用")
    },
    onError: showResourceError,
  })
  const toggleTeamStatus = React.useCallback(
    (record: BrowserTeamResource, status: BrowserStatusFlag) => {
      if (!canChangeTeamStatus) {
        return
      }

      statusMutation.mutate({ teamId: record.team_id, status })
    },
    [canChangeTeamStatus, statusMutation]
  )
  const columns = React.useMemo<ColumnDef<BrowserTeamResource>[]>(
    () => [
      {
        accessorKey: "team_name",
        header: ({ column }) => tableHeader(column, "团队"),
        cell: ({ row }) => <TeamNameCell record={row.original} />,
        meta: { label: "团队", cellClassName: "min-w-56 max-w-72" },
      },
      {
        accessorKey: "owner_name",
        header: ({ column }) => tableHeader(column, "Owner"),
        cell: ({ row }) => <TeamOwnerCell record={row.original} />,
        meta: { label: "Owner", cellClassName: "min-w-44 max-w-60" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => tableHeader(column, "状态"),
        cell: ({ row }) => (
          <StatusSwitchCell
            label="团队状态"
            status={row.original.status}
            disabled={!canChangeTeamStatus || statusMutation.isPending}
            onChange={(status) => toggleTeamStatus(row.original, status)}
          />
        ),
        meta: { label: "状态", cellClassName: "w-20" },
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
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <TeamActionsMenu
            record={row.original}
            isLeaving={leaveMutation.isPending}
            onLeave={setLeaveTarget}
          />
        ),
        meta: { label: "操作", cellClassName: "w-12 text-right" },
      },
    ],
    [
      canChangeTeamStatus,
      leaveMutation.isPending,
      statusMutation.isPending,
      toggleTeamStatus,
    ]
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

      <AlertDialog
        open={Boolean(leaveTarget)}
        onOpenChange={(open) => {
          if (!open && !leaveMutation.isPending) {
            setLeaveTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <UserMinusIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>退出团队</AlertDialogTitle>
            <AlertDialogDescription>
              退出后将不再看到该团队的环境、代理和成员数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton disabled={leaveMutation.isPending}>
              取消
            </AlertDialogCancelButton>
            <AlertDialogActionButton
              variant="destructive"
              disabled={leaveMutation.isPending || !leaveTarget?.can_leave}
              loading={leaveMutation.isPending}
              loadingText="退出中"
              onClick={(event) => {
                event.preventDefault()
                if (!leaveTarget?.can_leave) {
                  return
                }
                leaveMutation.mutate(leaveTarget)
              }}
            >
              退出
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TeamActionsMenu({
  record,
  isLeaving,
  onLeave,
}: {
  record: BrowserTeamResource
  isLeaving: boolean
  onLeave: (record: BrowserTeamResource) => void
}) {
  const leaveDisabledReason = isLeaving
    ? "正在退出，请稍候"
    : !record.can_leave
      ? "自己的团队不能退出"
      : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className="size-7">
          <MoreHorizontalIcon />
          <span className="sr-only">团队操作</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            title={leaveDisabledReason}
            aria-disabled={Boolean(leaveDisabledReason)}
            className={
              leaveDisabledReason
                ? "cursor-not-allowed opacity-50 focus:bg-transparent focus:text-destructive"
                : undefined
            }
            onSelect={(event) => {
              if (leaveDisabledReason) {
                event.preventDefault()
                return
              }
              onLeave(record)
            }}
          >
            <UserMinusIcon />
            退出团队
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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

function TeamOwnerCell({ record }: { record: BrowserTeamResource }) {
  const ownerName = record.owner_name?.trim() || "-"

  return (
    <div className="min-w-0">
      {ownerName === "-" ? (
        <span className="block truncate text-muted-foreground">{ownerName}</span>
      ) : (
        <OverflowTooltipText text={ownerName} className="font-medium" />
      )}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <ResourceStat
          Icon={UsersRoundIcon}
          value={record.member_count ?? 0}
          label="Members"
        />
        <ResourceStat
          Icon={LaptopIcon}
          value={record.environment_count ?? 0}
          label="Environments"
        />
        <ResourceStat
          Icon={RouteIcon}
          value={record.proxy_count ?? 0}
          label="Proxies"
        />
      </div>
    </div>
  )
}

function ResourceStat({
  Icon,
  value,
  label,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  value: number
  label: string
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-1"
      aria-label={`${label}: ${value}`}
      title={`${label}: ${value}`}
    >
      <Icon
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground/80"
      />
      <span className="tabular-nums">{value}</span>
    </div>
  )
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

function TimeCell({ value }: { value?: string | null }) {
  return (
    <span className="block truncate" title={formatAbsoluteDateTime(value, "-")}>
      {formatRelativeTime(value, "-")}
    </span>
  )
}

function tableHeader<TData, TValue>(
  column: Column<TData, TValue>,
  title: string
) {
  return <ResourceTableColumnHeader column={column} title={title} />
}
