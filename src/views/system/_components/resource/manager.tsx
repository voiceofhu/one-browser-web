"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  EditIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserRoundCheckIcon,
} from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import type { DashboardResourceConfig } from "./configs"
import type { ResourceFormValues } from "./form"
import { ResourceEditorDialog } from "./editor-dialog"
import { ResourceTable } from "./table"
import {
  showResourceCreateSuccess,
  showResourceDeleteSuccess,
  showResourceError,
  showResourceRefreshSuccess,
  showResourceUpdateSuccess,
} from "./toast"
import {
  ResetPasswordDialog,
  RoleAssignmentDialog,
} from "./user-action-dialogs"

type ResourceManagerProps<TData> = {
  config: DashboardResourceConfig<TData>
}

type EditorState<TData> =
  | { mode: "create"; record?: undefined }
  | { mode: "edit"; record: TData }

export function ResourceManager<TData>({
  config,
}: ResourceManagerProps<TData>) {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const params = React.useMemo(
    () => ({
      page: pageIndex + 1,
      page_size: pageSize,
      keyword: debouncedSearch || undefined,
    }),
    [debouncedSearch, pageIndex, pageSize]
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
  const [editor, setEditor] = React.useState<EditorState<TData> | null>(null)
  const [deletingRecord, setDeletingRecord] = React.useState<TData | null>(null)
  const [resettingRecord, setResettingRecord] = React.useState<TData | null>(
    null
  )
  const [assigningRoleRecord, setAssigningRoleRecord] =
    React.useState<TData | null>(null)
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false)

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

  const editorValues = React.useMemo(
    () =>
      editor?.mode === "edit"
        ? config.getEditValues(editor.record)
        : config.getDefaultValues(),
    [config, editor]
  )
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const editorMode = editor?.mode ?? "create"

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
        data={query.data?.items ?? []}
        columns={config.columns}
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
        searchPlaceholder={`搜索${config.noun}...`}
        emptyTitle={`暂无${config.noun}`}
        emptyDescription={`后台还没有返回${config.noun}记录。`}
        getRowId={(row, index) => String(config.getId(row) || index)}
        toolbarActions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isManualRefreshing}
            >
              <RefreshCwIcon
                data-icon="inline-start"
                className={cn(isManualRefreshing && "animate-spin")}
              />
              刷新
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditor({ mode: "create" })
              }}
            >
              <PlusIcon data-icon="inline-start" />
              新增
            </Button>
          </>
        }
        renderRowActions={(record) => {
          const isProtected = config.isProtected?.(record) === true

          return (
            <RowActions
              noun={config.noun}
              onEdit={
                isProtected
                  ? undefined
                  : () => setEditor({ mode: "edit", record })
              }
              onDelete={
                isProtected ? undefined : () => setDeletingRecord(record)
              }
              onResetPassword={
                config.userActions
                  ? () => setResettingRecord(record)
                  : undefined
              }
              onAssignRoles={
                config.userActions && !isProtected
                  ? () => setAssigningRoleRecord(record)
                  : undefined
              }
            />
          )
        }}
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
          if (!open && !deleteMutation.isPending) {
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
            <AlertDialogCancel disabled={deleteMutation.isPending}>
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

function delay(duration: number) {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeoutId)
  }, [delay, value])

  return debouncedValue
}

function RowActions({
  noun,
  onEdit,
  onDelete,
  onResetPassword,
  onAssignRoles,
}: {
  noun: string
  onEdit?: () => void
  onDelete?: () => void
  onResetPassword?: () => void
  onAssignRoles?: () => void
}) {
  return (
    <div className="flex items-center gap-0.5 whitespace-nowrap">
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-primary"
          onClick={onEdit}
        >
          <EditIcon />
          编辑
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2Icon />
          删除
        </Button>
      ) : null}
      {onResetPassword || onAssignRoles ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7"
            >
              <MoreHorizontalIcon />
              <span className="sr-only">{noun}更多操作</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuGroup>
              {onResetPassword ? (
                <DropdownMenuItem onSelect={onResetPassword}>
                  <KeyRoundIcon />
                  重置密码
                </DropdownMenuItem>
              ) : null}
              {onAssignRoles ? (
                <DropdownMenuItem onSelect={onAssignRoles}>
                  <UserRoundCheckIcon />
                  重新分配角色
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
