"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LogOutIcon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import {
  forceLogoutOnlineUser,
  listOnlineUsers,
} from "@/api/monitor/online-users"
import { useTranslation } from "@/components/providers/language-context"
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
import { showResourceError } from "@/views/system/_components/resource/toast"
import { ResourceToolbarActions } from "@/views/system/_components/resource/toolbar-actions"

import { monitorText } from "../_lib/i18n"
import { createOnlineUserColumns } from "./columns"

export default function OnlineUsersPage() {
  const { locale, t } = useTranslation()
  const mt = React.useCallback(
    (key: string, values?: Record<string, number | string>) =>
      monitorText(locale, key, values),
    [locale]
  )
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
  const columns = React.useMemo(() => createOnlineUserColumns(locale), [locale])
  const forceLogoutMutation = useMutation({
    mutationFn: (record: OnlineUserResource) =>
      forceLogoutOnlineUser(record.token_id),
    onSuccess: async (_, record) => {
      await queryClient.invalidateQueries({
        queryKey: monitorQueryKeys.onlineUsers,
      })
      toast.success(
        mt("online.forceLogout.success", {
          name: record.user_name,
        }),
        {
          description: mt("online.forceLogout.tokenDeleted"),
        }
      )
      setForceLogoutRecord(null)
    },
    onError: (error) => showResourceError(error, locale),
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
        showResourceError(result.error, locale)
        return
      }
      toast.success(mt("online.refresh.success"), {
        description: mt("online.refresh.description"),
      })
    } catch (error) {
      showResourceError(error, locale)
    } finally {
      setIsManualRefreshing(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ResourceTable
        data={records}
        columns={columns}
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
        searchPlaceholder={mt("online.search.placeholder")}
        emptyTitle={mt("online.empty.title")}
        emptyDescription={mt("online.empty.description")}
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
                  aria-label={mt("online.forceLogout.aria", {
                    name: record.user_name,
                  })}
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
            <AlertDialogTitle>
              {mt("online.forceLogout.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mt("online.forceLogout.description", {
                name: forceLogoutRecord?.user_name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={forceLogoutMutation.isPending}>
              {t("common.cancel")}
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
              {mt("online.forceLogout.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
