"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2Icon, TriangleAlertIcon } from "lucide-react"

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
import { Spinner } from "@/components/ui/spinner"
import { useAuthPermissions } from "@/hooks/use-auth"
import { hasPermission } from "@/lib/auth-permissions"

import type { DashboardResourceConfig } from "./configs"
import type { ResourceFormValues } from "./form"
import { ResourceEditorDialog } from "./editor-dialog"
import { delay, useDebouncedValue } from "./manager-utils"
import { useResourceReorder } from "./reorder"
import { RowActions } from "./row-actions"
import {
  ResourceStatusFilterTabs,
  type ResourceStatusFilterValue,
} from "./status-filter-tabs"
import { ResourceTable } from "./table"
import {
  showResourceCreateSuccess,
  showResourceBulkDeleteSuccess,
  showResourceDeleteSuccess,
  showResourceError,
  showResourceRefreshSuccess,
  showResourceUpdateSuccess,
} from "./toast"
import { ResourceToolbarActions } from "./toolbar-actions"
import { buildResourceTree, getResourceTreeSubRows } from "./tree"
import {
  ResetPasswordDialog,
  RoleAssignmentDialog,
} from "./user-action-dialogs"

type ResourceManagerProps<TData> = {
  config: DashboardResourceConfig<TData>
  renderInlineRowActions?: (record: TData) => React.ReactNode
}

type EditorState<TData> =
  | { mode: "create"; values?: ResourceFormValues; record?: undefined }
  | { mode: "edit"; record: TData }

type BulkDeleteState<TData> = {
  records: TData[]
  clearSelection: () => void
}

export function ResourceManager<TData>({
  config,
  renderInlineRowActions,
}: ResourceManagerProps<TData>) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] =
    React.useState<ResourceStatusFilterValue>("all")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const treeConfig = config.tree
  const queryPageIndex = treeConfig ? 0 : pageIndex
  const queryPageSize = treeConfig?.pageSize ?? pageSize
  const params = React.useMemo(
    () => ({
      page: queryPageIndex + 1,
      page_size: queryPageSize,
      keyword: debouncedSearch || undefined,
      status:
        config.statusFilters && statusFilter !== "all"
          ? statusFilter
          : undefined,
    }),
    [
      config.statusFilters,
      debouncedSearch,
      queryPageIndex,
      queryPageSize,
      statusFilter,
    ]
  )
  const listQueryKey = React.useMemo(
    () => [...config.queryKey, params] as const,
    [config.queryKey, params]
  )
  const query = useQuery({
    queryKey: listQueryKey,
    queryFn: () => config.list(params),
    placeholderData: (previousData) => previousData,
  })
  const records = React.useMemo(
    () => query.data?.items ?? [],
    [query.data?.items]
  )
  const tableData = React.useMemo(
    () =>
      treeConfig
        ? buildResourceTree(records, config.getId, treeConfig)
        : records,
    [config.getId, records, treeConfig]
  )
  const tableTotalRows = treeConfig ? records.length : (query.data?.total ?? 0)
  const tablePageSize = treeConfig ? Math.max(records.length, 1) : pageSize
  const [editor, setEditor] = React.useState<EditorState<TData> | null>(null)
  const [deletingRecord, setDeletingRecord] = React.useState<TData | null>(null)
  const [bulkDeletingState, setBulkDeletingState] =
    React.useState<BulkDeleteState<TData> | null>(null)
  const [resettingRecord, setResettingRecord] = React.useState<TData | null>(
    null
  )
  const [assigningRoleRecord, setAssigningRoleRecord] =
    React.useState<TData | null>(null)
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false)
  const allowDeleteDialogCloseRef = React.useRef(false)
  const allowBulkDeleteDialogCloseRef = React.useRef(false)

  const createMutation = useMutation({
    mutationFn: (values: ResourceFormValues) => config.create(values),
    onSuccess: async () => {
      setPageIndex(0)
      await queryClient.invalidateQueries({ queryKey: config.queryKey })
      showResourceCreateSuccess(config.noun)
      setEditor(null)
    },
    onError: showResourceError,
  })
  const updateMutation = useMutation({
    mutationFn: ({
      record,
      values,
    }: {
      record: TData
      values: ResourceFormValues
    }) => config.update(record, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: config.queryKey })
      showResourceUpdateSuccess(config.noun)
      setEditor(null)
    },
    onError: showResourceError,
  })
  const deleteMutation = useMutation({
    mutationFn: (record: TData) => config.remove(record),
    onSuccess: async () => {
      setPageIndex(0)
      await queryClient.invalidateQueries({ queryKey: config.queryKey })
      showResourceDeleteSuccess(config.noun)
      setDeletingRecord(null)
    },
    onError: showResourceError,
  })
  const bulkDeleteMutation = useMutation({
    mutationFn: async (records: TData[]) => {
      const removableRecords = records.filter(
        (record) => config.isProtected?.(record) !== true
      )

      if (removableRecords.length === 0) {
        throw new Error("没有可删除的记录")
      }

      await Promise.all(removableRecords.map((record) => config.remove(record)))
      return removableRecords.length
    },
    onSuccess: async (count) => {
      setPageIndex(0)
      await queryClient.invalidateQueries({ queryKey: config.queryKey })
      showResourceBulkDeleteSuccess(config.noun, count)
      bulkDeletingState?.clearSelection()
      setBulkDeletingState(null)
    },
    onError: showResourceError,
  })
  const resetPasswordMutation = useMutation({
    mutationFn: async ({
      record,
      password,
    }: {
      record: TData
      password: string
    }) => {
      if (!config.userActions) {
        throw new Error("当前资源不支持重置密码")
      }
      await config.userActions.resetPassword(record, password)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: config.queryKey })
      showResourceUpdateSuccess("用户密码")
      setResettingRecord(null)
    },
  })
  const assignRolesMutation = useMutation({
    mutationFn: async ({
      record,
      roleIds,
    }: {
      record: TData
      roleIds: number[]
    }) => {
      if (!config.userActions) {
        throw new Error("当前资源不支持分配角色")
      }
      await config.userActions.setRoleIds(record, roleIds)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: config.queryKey })
      showResourceUpdateSuccess("用户角色")
      setAssigningRoleRecord(null)
    },
  })
  const reorderMutation = useResourceReorder(config)

  const editorValues = React.useMemo(() => {
    if (editor?.mode === "edit") {
      return config.getEditValues(editor.record)
    }

    if (editor?.mode === "create" && editor.values) {
      return editor.values
    }

    return config.getDefaultValues()
  }, [config, editor])
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const editorMode = editor?.mode ?? "create"
  const hasActiveFilters =
    search.trim().length > 0 ||
    Boolean(config.statusFilters && statusFilter !== "all")
  const actionPermissions = config.permissions
  const canCreate = hasPermission(
    authPermissions.data,
    actionPermissions?.create
  )
  const canUpdate = hasPermission(
    authPermissions.data,
    actionPermissions?.update
  )
  const canDelete = hasPermission(
    authPermissions.data,
    actionPermissions?.delete
  )
  const canCreateChild =
    Boolean(config.getChildCreateValues) &&
    hasPermission(
      authPermissions.data,
      actionPermissions?.createChild ?? actionPermissions?.create
    )
  const canReorder = hasPermission(
    authPermissions.data,
    actionPermissions?.reorder
  )
  const canResetPassword =
    Boolean(config.userActions) &&
    hasPermission(authPermissions.data, actionPermissions?.resetPassword)
  const canAssignRoles =
    Boolean(config.userActions) &&
    hasPermission(authPermissions.data, actionPermissions?.assignRoles)
  const canShowRowActions = Boolean(
    renderInlineRowActions ||
    canUpdate ||
    canDelete ||
    canCreateChild ||
    canResetPassword ||
    canAssignRoles
  )

  function handleCreate(values?: ResourceFormValues) {
    setEditor(values ? { mode: "create", values } : { mode: "create" })
  }

  async function handleRefresh() {
    setIsManualRefreshing(true)
    try {
      const [result] = await Promise.all([query.refetch(), delay(1_000)])
      if (result.isError) {
        showResourceError(result.error)
        return
      }
      showResourceRefreshSuccess(config.noun)
    } catch (error) {
      showResourceError(error)
    } finally {
      setIsManualRefreshing(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <ResourceTable
        data={tableData}
        columns={config.columns}
        defaultColumnVisibility={config.defaultColumnVisibility}
        columnVisibilityResetKey={config.noun}
        totalRows={tableTotalRows}
        pageIndex={treeConfig ? 0 : pageIndex}
        pageSize={tablePageSize}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPageIndex(0)
        }}
        onPageIndexChange={treeConfig ? () => undefined : setPageIndex}
        onPageSizeChange={(value) => {
          if (treeConfig) {
            return
          }
          setPageSize(value)
          setPageIndex(0)
        }}
        toolbarLeading={
          config.statusFilters ? (
            <ResourceStatusFilterTabs
              label={`${config.noun}状态筛选`}
              options={config.statusFilters}
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPageIndex(0)
              }}
            />
          ) : null
        }
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        error={query.error}
        searchPlaceholder={`搜索${config.noun}...`}
        emptyTitle={`暂无${config.noun}`}
        emptyDescription={`还没有任何${config.noun}，快来新增一个${config.noun}吧。`}
        emptyActionLabel={canCreate ? `新增${config.noun}` : undefined}
        onEmptyAction={canCreate ? handleCreate : undefined}
        isFiltered={hasActiveFilters}
        getRowId={(row, index) => String(config.getId(row) || index)}
        getSubRows={treeConfig ? getResourceTreeSubRows : undefined}
        treeColumnId={treeConfig?.columnId}
        getRowCanSelect={(row) =>
          canDelete && config.isProtected?.(row) !== true
        }
        onBulkDelete={
          canDelete
            ? (records, clearSelection) =>
                setBulkDeletingState({ records, clearSelection })
            : undefined
        }
        isBulkDeleting={bulkDeleteMutation.isPending}
        isRowReordering={reorderMutation.isPending}
        onRowReorder={
          config.reorder && canReorder
            ? (payload) => reorderMutation.mutate(payload)
            : undefined
        }
        selectionResetKey={`${statusFilter}:${debouncedSearch}`}
        showPaginationControls={!treeConfig}
        toolbarActions={
          <ResourceToolbarActions
            isRefreshing={isManualRefreshing}
            onRefresh={handleRefresh}
            onCreate={canCreate ? handleCreate : undefined}
          />
        }
        renderRowActions={
          canShowRowActions
            ? (record) => {
                const isProtected = config.isProtected?.(record) === true
                const childCreateValues =
                  config.getChildCreateValues?.(record) ?? null

                return (
                  <div className="flex items-center justify-end gap-1">
                    {renderInlineRowActions?.(record)}
                    <RowActions
                      noun={config.noun}
                      onEdit={
                        canUpdate && !isProtected
                          ? () => setEditor({ mode: "edit", record })
                          : undefined
                      }
                      onDelete={
                        canDelete && !isProtected
                          ? () => setDeletingRecord(record)
                          : undefined
                      }
                      onCreateChild={
                        canCreateChild && childCreateValues && !isProtected
                          ? () => handleCreate(childCreateValues)
                          : undefined
                      }
                      onResetPassword={
                        config.userActions && canResetPassword
                          ? () => setResettingRecord(record)
                          : undefined
                      }
                      onAssignRoles={
                        config.userActions && canAssignRoles && !isProtected
                          ? () => setAssigningRoleRecord(record)
                          : undefined
                      }
                    />
                  </div>
                )
              }
            : undefined
        }
      />

      <ResourceEditorDialog
        open={Boolean(editor)}
        mode={editorMode}
        noun={config.noun}
        fields={config.fields}
        schema={config.schema(editorMode)}
        values={editorValues}
        recordId={
          editor?.mode === "edit" ? config.getId(editor.record) : undefined
        }
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setEditor(null)
          }
        }}
        onSubmit={async (values) => {
          if (editor?.mode === "edit") {
            await updateMutation.mutateAsync({ record: editor.record, values })
            return
          }

          await createMutation.mutateAsync(values)
        }}
      />

      <AlertDialog
        open={Boolean(deletingRecord)}
        onOpenChange={(open) => {
          if (open) {
            allowDeleteDialogCloseRef.current = false
            return
          }

          if (!deleteMutation.isPending && allowDeleteDialogCloseRef.current) {
            allowDeleteDialogCloseRef.current = false
            setDeletingRecord(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <TriangleAlertIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>删除{config.noun}</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除“{deletingRecord ? config.getName(deletingRecord) : ""}
              ”吗？ 该操作会提交到后台，删除后需要通过后端数据恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              onClick={() => {
                allowDeleteDialogCloseRef.current = true
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                if (deletingRecord) {
                  deleteMutation.mutate(deletingRecord)
                }
              }}
            >
              {deleteMutation.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(bulkDeletingState)}
        onOpenChange={(open) => {
          if (open) {
            allowBulkDeleteDialogCloseRef.current = false
            return
          }

          if (
            !bulkDeleteMutation.isPending &&
            allowBulkDeleteDialogCloseRef.current
          ) {
            allowBulkDeleteDialogCloseRef.current = false
            setBulkDeletingState(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>批量删除{config.noun}</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除已选中的 {bulkDeletingState?.records.length ?? 0} 条
              {config.noun}吗？受保护的记录不会被提交删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={bulkDeleteMutation.isPending}
              onClick={() => {
                allowBulkDeleteDialogCloseRef.current = true
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={bulkDeleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                if (bulkDeletingState) {
                  bulkDeleteMutation.mutate(bulkDeletingState.records)
                }
              }}
            >
              {bulkDeleteMutation.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              批量删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {config.userActions ? (
        <>
          <ResetPasswordDialog
            key={`reset-password-${
              resettingRecord ? config.getId(resettingRecord) : "empty"
            }`}
            open={Boolean(resettingRecord)}
            record={resettingRecord}
            getName={config.getName}
            isSubmitting={resetPasswordMutation.isPending}
            onOpenChange={(open) => {
              if (!open && !resetPasswordMutation.isPending) {
                setResettingRecord(null)
              }
            }}
            onSubmit={(record, password) =>
              resetPasswordMutation.mutateAsync({ record, password })
            }
          />
          <RoleAssignmentDialog
            key={`assign-role-${
              assigningRoleRecord ? config.getId(assigningRoleRecord) : "empty"
            }`}
            open={Boolean(assigningRoleRecord)}
            record={assigningRoleRecord}
            getName={config.getName}
            getRoleIds={config.userActions.getRoleIds}
            isSubmitting={assignRolesMutation.isPending}
            onOpenChange={(open) => {
              if (!open && !assignRolesMutation.isPending) {
                setAssigningRoleRecord(null)
              }
            }}
            onSubmit={(record, roleIds) =>
              assignRolesMutation.mutateAsync({ record, roleIds })
            }
          />
        </>
      ) : null}
    </div>
  )
}
