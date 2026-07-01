"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Column, ColumnDef } from "@tanstack/react-table"
import {
  LaptopIcon,
  PlayIcon,
  PowerIcon,
  PowerOffIcon,
  SquareIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  closeBrowserEnvironment,
  listBrowserEnvironments,
  openBrowserEnvironment,
  setBrowserEnvironmentStatus,
} from "@/api/browser"
import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { browserQueryKeys } from "@/lib/query-keys"
import type {
  BrowserEnvironmentResource,
  BrowserListParams,
  BrowserStatusFlag,
} from "@/types/browser"
import { useDebouncedValue } from "@/views/system/_components/resource/manager-utils"
import {
  ResourceTable,
  ResourceTableColumnHeader,
} from "@/views/system/_components/resource/table"
import { showResourceError } from "@/views/system/_components/resource/toast"

type EnvironmentStatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "starting"
  | "stopping"
  | "error"
  | "1"

const ENVIRONMENT_FILTERS = [
  { label: "全部", value: "all" },
  { label: "运行中", value: "active" },
  { label: "可打开", value: "inactive" },
  { label: "启动中", value: "starting" },
  { label: "停止中", value: "stopping" },
  { label: "异常", value: "error" },
  { label: "已停用", value: "1" },
] as const

export default function EnvironmentPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] =
    React.useState<EnvironmentStatusFilter>("all")
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
    queryKey: [...browserQueryKeys.environments, params],
    queryFn: () => listBrowserEnvironments(params),
    placeholderData: (previousData) => previousData,
  })
  const refreshEnvironments = React.useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: browserQueryKeys.environments,
    })
  }, [queryClient])
  const openMutation = useMutation({
    mutationFn: (environmentId: number) =>
      openBrowserEnvironment(environmentId),
    onSuccess: () => {
      toast.success("环境启动中")
      refreshEnvironments()
    },
    onError: showResourceError,
  })
  const closeMutation = useMutation({
    mutationFn: (environmentId: number) =>
      closeBrowserEnvironment(environmentId),
    onSuccess: () => {
      toast.success("环境停止中")
      refreshEnvironments()
    },
    onError: showResourceError,
  })
  const statusMutation = useMutation({
    mutationFn: ({
      environmentId,
      status,
    }: {
      environmentId: number
      status: BrowserStatusFlag
    }) => setBrowserEnvironmentStatus(environmentId, status),
    onSuccess: (_record, variables) => {
      toast.success(variables.status === "0" ? "环境已启用" : "环境已停用")
      refreshEnvironments()
    },
    onError: showResourceError,
  })
  const runtimePendingId =
    openMutation.isPending && typeof openMutation.variables === "number"
      ? openMutation.variables
      : closeMutation.isPending && typeof closeMutation.variables === "number"
        ? closeMutation.variables
        : null
  const statusPendingId =
    statusMutation.isPending && statusMutation.variables
      ? statusMutation.variables.environmentId
      : null
  const columns = React.useMemo<ColumnDef<BrowserEnvironmentResource>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => tableHeader(column, "环境名称"),
        cell: ({ row }) => <EnvironmentNameCell record={row.original} />,
        meta: { label: "环境名称", cellClassName: "min-w-56 max-w-72" },
      },
      {
        accessorKey: "group_key",
        header: ({ column }) => tableHeader(column, "分组"),
        cell: ({ row }) => <TextBadge value={row.original.group_key} />,
        meta: { label: "分组", cellClassName: "w-32" },
      },
      {
        accessorKey: "proxy_name",
        header: ({ column }) => tableHeader(column, "代理"),
        cell: ({ row }) => <TextCell value={row.original.proxy_name} />,
        meta: { label: "代理", cellClassName: "min-w-44 max-w-64" },
      },
      {
        accessorKey: "runtime_status",
        header: ({ column }) => tableHeader(column, "状态"),
        cell: ({ row }) => (
          <EnvironmentStatusBadge
            runtimeStatus={row.original.runtime_status}
            status={row.original.status}
          />
        ),
        meta: { label: "状态", cellClassName: "w-32" },
      },
      {
        accessorKey: "last_open_at",
        header: ({ column }) => tableHeader(column, "最近打开"),
        cell: ({ row }) => <TimeCell value={row.original.last_open_at} />,
        meta: { label: "最近打开", cellClassName: "w-36" },
      },
      {
        accessorKey: "owner_name",
        header: ({ column }) => tableHeader(column, "负责人"),
        cell: ({ row }) => <TextCell value={row.original.owner_name} />,
        meta: { label: "负责人", cellClassName: "w-32" },
      },
      {
        id: "tags",
        header: ({ column }) => tableHeader(column, "标签"),
        cell: ({ row }) => <TagsCell values={row.original.tags} />,
        meta: { label: "标签", cellClassName: "min-w-44 max-w-64" },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <EnvironmentActionCell
            record={row.original}
            runtimePending={runtimePendingId === row.original.environment_id}
            statusPending={statusPendingId === row.original.environment_id}
            onOpen={(environmentId) => openMutation.mutate(environmentId)}
            onClose={(environmentId) => closeMutation.mutate(environmentId)}
            onStatusChange={(environmentId, status) =>
              statusMutation.mutate({ environmentId, status })
            }
          />
        ),
        meta: { label: "操作", cellClassName: "w-40 text-right" },
      },
    ],
    [
      closeMutation,
      openMutation,
      runtimePendingId,
      statusMutation,
      statusPendingId,
    ]
  )
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all"

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <div className="min-h-0 flex-1">
        <ResourceTable
          data={query.data?.list ?? []}
          columns={columns}
          columnVisibilityResetKey="browser-environments"
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
          toolbarLeading={
            <AnimatedSegmentedTabs
              label="环境状态"
              options={ENVIRONMENT_FILTERS}
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
          searchPlaceholder="搜索环境、分组、代理、负责人"
          emptyTitle="暂无环境"
          emptyDescription="环境接入后会显示分组、代理、状态和负责人。"
          isFiltered={hasActiveFilters}
          getRowId={(record) => String(record.environment_id)}
          density="compact"
          selectionResetKey={`${statusFilter}:${debouncedSearch}`}
        />
      </div>
    </div>
  )
}

function EnvironmentNameCell({
  record,
}: {
  record: BrowserEnvironmentResource
}) {
  const key =
    record.environment_key ||
    record.environment_no ||
    String(record.environment_id)

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <LaptopIcon />
      </div>
      <div className="min-w-0 flex-1">
        <OverflowTooltipText text={record.name} className="font-medium" />
        <OverflowTooltipText
          text={key}
          className="text-xs text-muted-foreground"
        />
      </div>
    </div>
  )
}

function EnvironmentStatusBadge({
  runtimeStatus,
  status,
}: {
  runtimeStatus?: string | null
  status?: string | null
}) {
  const meta = environmentStatusMeta(runtimeStatus || status)

  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

function EnvironmentActionCell({
  record,
  runtimePending,
  statusPending,
  onOpen,
  onClose,
  onStatusChange,
}: {
  record: BrowserEnvironmentResource
  runtimePending: boolean
  statusPending: boolean
  onOpen: (environmentId: number) => void
  onClose: (environmentId: number) => void
  onStatusChange: (environmentId: number, status: BrowserStatusFlag) => void
}) {
  const disabled = isEnvironmentDisabled(record.status)
  const running = isEnvironmentRunning(record.runtime_status)
  const transitioning = isEnvironmentTransitioning(record.runtime_status)
  const runtimeDisabled =
    disabled || runtimePending || statusPending || transitioning
  const statusDisabled = runtimePending || statusPending || transitioning
  const nextStatus: BrowserStatusFlag = disabled ? "0" : "1"

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={runtimeDisabled}
        onClick={() => {
          if (running) {
            onClose(record.environment_id)
            return
          }

          onOpen(record.environment_id)
        }}
      >
        {runtimePending ? (
          <Spinner data-icon="inline-start" />
        ) : running ? (
          <SquareIcon data-icon="inline-start" />
        ) : (
          <PlayIcon data-icon="inline-start" />
        )}
        {running ? "停止" : "启动"}
      </Button>
      <Button
        type="button"
        variant={disabled ? "secondary" : "outline"}
        size="sm"
        disabled={statusDisabled}
        onClick={() => onStatusChange(record.environment_id, nextStatus)}
      >
        {statusPending ? (
          <Spinner data-icon="inline-start" />
        ) : disabled ? (
          <PowerIcon data-icon="inline-start" />
        ) : (
          <PowerOffIcon data-icon="inline-start" />
        )}
        {disabled ? "启用" : "停用"}
      </Button>
    </div>
  )
}

function TagsCell({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="block truncate text-muted-foreground">-</span>
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {values.slice(0, 3).map((tag) => (
        <Badge key={tag} variant="outline">
          {tag}
        </Badge>
      ))}
      {values.length > 3 ? (
        <Badge variant="secondary">+{values.length - 3}</Badge>
      ) : null}
    </div>
  )
}

function TextBadge({ value }: { value?: string | null }) {
  const text = value?.trim()

  if (!text) {
    return <span className="block truncate text-muted-foreground">-</span>
  }

  return <Badge variant="outline">{text}</Badge>
}

function TextCell({ value }: { value?: string | null }) {
  const text = value?.trim() || "-"

  if (text === "-") {
    return <span className="block truncate text-muted-foreground">{text}</span>
  }

  return <OverflowTooltipText text={text} />
}

function TimeCell({ value }: { value?: string | null }) {
  return (
    <span className="block truncate" title={formatAbsoluteDateTime(value, "-")}>
      {formatRelativeTime(value, "-")}
    </span>
  )
}

function isEnvironmentDisabled(status?: string | null) {
  const normalized = normalizeEnvironmentStatus(status)

  return (
    normalized === "1" || normalized === "disabled" || normalized === "disable"
  )
}

function isEnvironmentRunning(status?: string | null) {
  const normalized = normalizeEnvironmentStatus(status)

  return (
    normalized === "running" ||
    normalized === "active" ||
    normalized === "online"
  )
}

function isEnvironmentTransitioning(status?: string | null) {
  const normalized = normalizeEnvironmentStatus(status)

  return (
    normalized === "starting" ||
    normalized === "opening" ||
    normalized === "stopping" ||
    normalized === "closing"
  )
}

function normalizeEnvironmentStatus(status?: string | null) {
  return status?.trim().toLowerCase() ?? ""
}

function environmentStatusMeta(status?: string | null): {
  label: string
  variant: React.ComponentProps<typeof Badge>["variant"]
} {
  const normalized = status?.trim().toLowerCase()

  switch (normalized) {
    case "running":
    case "active":
    case "opening":
    case "online":
      return { label: "运行中", variant: "default" }
    case "starting":
      return { label: "启动中", variant: "secondary" }
    case "stopping":
      return { label: "停止中", variant: "secondary" }
    case "ready":
    case "idle":
    case "inactive":
    case "available":
      return { label: "可打开", variant: "secondary" }
    case "disabled":
    case "disable":
    case "stopped":
    case "1":
      return { label: "已停用", variant: "outline" }
    case "error":
    case "failed":
      return { label: "异常", variant: "destructive" }
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
