"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LogOutIcon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import {
  forceLogoutOnlineUser,
  listOnlineUsers,
} from "@/api/monitor/online-users"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuthPermissions } from "@/hooks/use-auth"
import { hasPermission } from "@/lib/auth-permissions"
import { monitorQueryKeys } from "@/lib/query-keys"
import type { OnlineUserListParams, OnlineUserResource } from "@/types/admin"
import {
  delay,
  useDebouncedValue,
} from "@/views/system/_components/resource/manager-utils"
import { ResourceTable } from "@/views/system/_components/resource/table"
import {
  showResourceError,
  showResourceRefreshSuccess,
} from "@/views/system/_components/resource/toast"
import { ResourceToolbarActions } from "@/views/system/_components/resource/toolbar-actions"

import { onlineUserColumns } from "./columns"

export default function OnlineUsersPage() {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false)
  const [forceLogoutRecord, setForceLogoutRecord] =
    React.useState<OnlineUserResource | null>(null)
  const params = React.useMemo<OnlineUserListParams>(
    () => ({
      page: pageIndex + 1,
      page_size: pageSize,
      keyword: debouncedSearch || undefined,
    }),
    [debouncedSearch, pageIndex, pageSize]
  )
  const listQueryKey = React.useMemo(
    () => [...monitorQueryKeys.onlineUsers, params] as const,
    [params]
  )
  const query = useQuery({
    queryKey: listQueryKey,
    queryFn: () => listOnlineUsers(params),
    placeholderData: (previousData) => previousData,
  })
  const records = React.useMemo(
    () => query.data?.list ?? [],
    [query.data?.list]
  )
  const forceLogoutMutation = useMutation({
    mutationFn: (record: OnlineUserResource) =>
      forceLogoutOnlineUser(record.token_id),
    onSuccess: async (_, record) => {
      await queryClient.invalidateQueries({
        queryKey: monitorQueryKeys.onlineUsers,
      })
      toast.success(`${record.user_name} 已强制下线`, {
        description: "该会话令牌已从 Redis 中删除。",
      })
      setForceLogoutRecord(null)
    },
    onError: showResourceError,
  })
  const canForceLogout = hasPermission(
    authPermissions.data,
    "monitor:online:forceLogout"
  )
  const hasActiveFilters = search.trim().length > 0

  async function handleRefresh() {
    setIsManualRefreshing(true)
    try {
      const [result] = await Promise.all([query.refetch(), delay(1_000)])
      if (result.isError) {
        showResourceError(result.error)
        return
      }
      showResourceRefreshSuccess("在线用户")
    } catch (error) {
      showResourceError(error)
    } finally {
      setIsManualRefreshing(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ResourceTable
        data={records}
        columns={onlineUserColumns}
        columnVisibilityResetKey="online-users"
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
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        error={query.error}
        searchPlaceholder="搜索账号、IP、浏览器、系统..."
        emptyTitle="暂无在线用户"
        emptyDescription="当前没有可显示的登录会话。"
        isFiltered={hasActiveFilters}
        getRowId={(row, index) => row.token_id || String(index)}
        selectionResetKey={debouncedSearch}
        toolbarActions={
          <ResourceToolbarActions
            isRefreshing={isManualRefreshing}
            onRefresh={handleRefresh}
          />
        }
        renderRowActions={
          canForceLogout
            ? (record) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`强退 ${record.user_name}`}
                  onClick={() => setForceLogoutRecord(record)}
                >
                  <LogOutIcon />
                </Button>
              )
            : undefined
        }
      />

      <AlertDialog
        open={Boolean(forceLogoutRecord)}
        onOpenChange={(open) => {
          if (!open && !forceLogoutMutation.isPending) {
            setForceLogoutRecord(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <TriangleAlertIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>强制用户下线</AlertDialogTitle>
            <AlertDialogDescription>
              确认强制“{forceLogoutRecord?.user_name ?? ""}
              ”下线吗？该操作会立即删除当前会话令牌。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={forceLogoutMutation.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={forceLogoutMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                if (forceLogoutRecord) {
                  forceLogoutMutation.mutate(forceLogoutRecord)
                }
              }}
            >
              {forceLogoutMutation.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              强制下线
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
