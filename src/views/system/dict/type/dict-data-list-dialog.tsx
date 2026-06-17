"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { TriangleAlertIcon } from "lucide-react"

import { listDictData } from "@/api/system/dict"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { systemQueryKeys } from "@/lib/query-keys"
import type { DictDataResource, DictTypeResource } from "@/types/admin"
import { dictDataColumns } from "@/views/system/_components/resource/columns"
import { RESOURCE_CONFIGS } from "@/views/system/_components/resource/configs"
import { ResourceEditorDialog } from "@/views/system/_components/resource/editor-dialog"
import type {
  ResourceField,
  ResourceFormValues,
} from "@/views/system/_components/resource/form"
import {
  delay,
  useDebouncedValue,
} from "@/views/system/_components/resource/manager-utils"
import { RowActions } from "@/views/system/_components/resource/row-actions"
import { ResourceTable } from "@/views/system/_components/resource/table"
import {
  showResourceCreateSuccess,
  showResourceDeleteSuccess,
  showResourceError,
  showResourceRefreshSuccess,
  showResourceUpdateSuccess,
} from "@/views/system/_components/resource/toast"
import { ResourceToolbarActions } from "@/views/system/_components/resource/toolbar-actions"

type DictDataListDialogProps = {
  dictType: DictTypeResource | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type EditorState =
  | { mode: "create"; record?: undefined }
  | { mode: "edit"; record: DictDataResource }

const dictDataConfig = RESOURCE_CONFIGS["dict-data"]

export function DictDataListDialog({
  dictType,
  open,
  onOpenChange,
}: DictDataListDialogProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [editor, setEditor] = React.useState<EditorState | null>(null)
  const [deletingRecord, setDeletingRecord] =
    React.useState<DictDataResource | null>(null)
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false)
  const dictTypeValue = dictType?.dict_type
  const fields = React.useMemo<ResourceField[]>(
    () =>
      dictDataConfig.fields.map((field) =>
        field.name === "dict_type"
          ? { ...field, hiddenOnCreate: true, hiddenOnEdit: true }
          : field
      ),
    []
  )
  const editorMode = editor?.mode ?? "create"
  const editorValues = React.useMemo<ResourceFormValues>(
    () => ({
      ...(editor?.mode === "edit"
        ? dictDataConfig.getEditValues(editor.record)
        : dictDataConfig.getDefaultValues()),
      dict_type: dictTypeValue ?? "",
    }),
    [dictTypeValue, editor]
  )
  const params = React.useMemo(
    () => ({
      page: pageIndex + 1,
      page_size: pageSize,
      keyword: debouncedSearch || undefined,
      dict_type: dictTypeValue,
    }),
    [debouncedSearch, dictTypeValue, pageIndex, pageSize]
  )
  const query = useQuery({
    queryKey: [...systemQueryKeys.dictData, "dialog", params],
    queryFn: () => listDictData(params),
    enabled: open && Boolean(dictTypeValue),
    placeholderData: (previousData) => previousData,
  })
  const createMutation = useMutation({
    mutationFn: (values: ResourceFormValues) =>
      dictDataConfig.create(withDialogDictType(values)),
    onSuccess: async () => {
      setPageIndex(0)
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.dictData,
      })
      showResourceCreateSuccess("字典数据")
      setEditor(null)
    },
    onError: showResourceError,
  })
  const updateMutation = useMutation({
    mutationFn: ({
      record,
      values,
    }: {
      record: DictDataResource
      values: ResourceFormValues
    }) => dictDataConfig.update(record, withDialogDictType(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.dictData,
      })
      showResourceUpdateSuccess("字典数据")
      setEditor(null)
    },
    onError: showResourceError,
  })
  const deleteMutation = useMutation({
    mutationFn: (record: DictDataResource) => dictDataConfig.remove(record),
    onSuccess: async () => {
      setPageIndex(0)
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.dictData,
      })
      showResourceDeleteSuccess("字典数据")
      setDeletingRecord(null)
    },
    onError: showResourceError,
  })
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const hasActiveFilters = search.trim().length > 0

  function withDialogDictType(values: ResourceFormValues): ResourceFormValues {
    if (!dictTypeValue) {
      throw new Error("缺少字典类型")
    }

    return {
      ...values,
      dict_type: dictTypeValue,
    }
  }

  function handleCreate() {
    setEditor({ mode: "create" })
  }

  async function handleRefresh() {
    setIsManualRefreshing(true)
    try {
      const [result] = await Promise.all([query.refetch(), delay(1_000)])
      if (result.isError) {
        showResourceError(result.error)
        return
      }
      showResourceRefreshSuccess("字典数据")
    } catch (error) {
      showResourceError(error)
    } finally {
      setIsManualRefreshing(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && (isSubmitting || deleteMutation.isPending)) {
          return
        }
        if (!nextOpen) {
          setEditor(null)
          setDeletingRecord(null)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b px-4 py-3 lg:px-6">
          <DialogTitle>
            {dictType ? `${dictType.dict_name} 字典列表` : "字典列表"}
          </DialogTitle>
          <DialogDescription>
            {dictType ? dictType.dict_type : "查看当前字典类型下的字典数据。"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-[520px] flex-1 overflow-hidden">
          <ResourceTable
            data={query.data?.items ?? []}
            columns={dictDataColumns}
            defaultColumnVisibility={{
              dict_type: false,
              remark: false,
            }}
            columnVisibilityResetKey={dictTypeValue ?? "dict-data-dialog"}
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
            searchPlaceholder="搜索字典标签、键值..."
            emptyTitle="暂无字典数据"
            emptyDescription="当前字典类型下还没有字典数据。"
            emptyActionLabel="新增字典数据"
            onEmptyAction={handleCreate}
            isFiltered={hasActiveFilters}
            getRowId={(row, index) => String(row.dict_code || index)}
            selectionResetKey={`${dictTypeValue}:${debouncedSearch}`}
            toolbarActions={
              <ResourceToolbarActions
                isRefreshing={isManualRefreshing}
                onRefresh={handleRefresh}
                onCreate={handleCreate}
              />
            }
            renderRowActions={(record) => (
              <RowActions
                noun="字典数据"
                onEdit={() => setEditor({ mode: "edit", record })}
                onDelete={() => setDeletingRecord(record)}
              />
            )}
          />
        </div>

        <ResourceEditorDialog
          open={Boolean(editor)}
          mode={editorMode}
          noun="字典数据"
          fields={fields}
          schema={dictDataConfig.schema()}
          values={editorValues}
          recordId={
            editor?.mode === "edit" ? editor.record.dict_code : undefined
          }
          isSubmitting={isSubmitting}
          onOpenChange={(nextOpen) => {
            if (!nextOpen && !isSubmitting) {
              setEditor(null)
            }
          }}
          onSubmit={async (values) => {
            if (editor?.mode === "edit") {
              await updateMutation.mutateAsync({
                record: editor.record,
                values,
              })
              return
            }

            await createMutation.mutateAsync(values)
          }}
        />

        <AlertDialog
          open={Boolean(deletingRecord)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen && !deleteMutation.isPending) {
              setDeletingRecord(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <TriangleAlertIcon />
              </AlertDialogMedia>
              <AlertDialogTitle>删除字典数据</AlertDialogTitle>
              <AlertDialogDescription>
                确认删除“
                {deletingRecord ? dictDataConfig.getName(deletingRecord) : ""}
                ”吗？该操作会提交到后台，删除后需要通过后端数据恢复。
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
      </DialogContent>
    </Dialog>
  )
}
