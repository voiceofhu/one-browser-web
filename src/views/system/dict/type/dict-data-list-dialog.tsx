"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { TriangleAlertIcon } from "lucide-react"

import { listDictData } from "@/api/system/dict"
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
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { Spinner } from "@/components/ui/spinner"
import { translateAdminText } from "@/lib/i18n-admin"
import { systemQueryKeys } from "@/lib/query-keys"
import type {
  DictDataResource,
  DictTypeResource,
  PageResponse,
} from "@/types/admin"
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
  showResourceReorderSuccess,
  showResourceUpdateSuccess,
} from "@/views/system/_components/resource/toast"
import { ResourceToolbarActions } from "@/views/system/_components/resource/toolbar-actions"
import {
  ResourceStatusFilterTabs,
  type ResourceStatusFilterValue,
} from "@/views/system/_components/resource/status-filter-tabs"

type DictDataListDialogProps = {
  dictType: DictTypeResource | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type EditorState =
  | { mode: "create"; record?: undefined }
  | { mode: "edit"; record: DictDataResource }

const dictDataConfig = RESOURCE_CONFIGS["dict-data"]
const DICT_DATA_DIALOG_PAGE_SIZE = 1_000
type DictDataReorderPayload = Parameters<
  NonNullable<typeof dictDataConfig.reorder>
>[0]

export function DictDataListDialog({
  dictType,
  open,
  onOpenChange,
}: DictDataListDialogProps) {
  const { locale, t } = useTranslation()
  const tt = (text: string) => translateAdminText(locale, text)
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] =
    React.useState<ResourceStatusFilterValue>("all")
  const [editor, setEditor] = React.useState<EditorState | null>(null)
  const [deletingRecord, setDeletingRecord] =
    React.useState<DictDataResource | null>(null)
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false)
  const dictTypeValue = dictType?.dict_type
  const statusFilterOptions = React.useMemo(
    () =>
      dictDataConfig.statusFilters?.map((option) => ({
        ...option,
        label: translateAdminText(locale, String(option.label)),
      })),
    [locale]
  )
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
      page: 1,
      page_size: DICT_DATA_DIALOG_PAGE_SIZE,
      keyword: debouncedSearch || undefined,
      dict_type: dictTypeValue,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [debouncedSearch, dictTypeValue, statusFilter]
  )
  const dictDataQueryKey = React.useMemo(
    () => [...systemQueryKeys.dictData, "dialog", params] as const,
    [params]
  )
  const query = useQuery({
    queryKey: dictDataQueryKey,
    queryFn: () => listDictData(params),
    enabled: open && Boolean(dictTypeValue),
    placeholderData: (previousData) => previousData,
  })
  const createMutation = useMutation({
    mutationFn: (values: ResourceFormValues) =>
      dictDataConfig.create(withDialogDictType(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.dictData,
      })
      showResourceCreateSuccess("字典数据", locale)
      setEditor(null)
    },
    onError: (error) => showResourceError(error, locale),
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
      showResourceUpdateSuccess("字典数据", locale)
      setEditor(null)
    },
    onError: (error) => showResourceError(error, locale),
  })
  const deleteMutation = useMutation({
    mutationFn: (record: DictDataResource) => dictDataConfig.remove(record),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.dictData,
      })
      showResourceDeleteSuccess("字典数据", locale)
      setDeletingRecord(null)
    },
    onError: (error) => showResourceError(error, locale),
  })
  const reorderMutation = useMutation({
    mutationFn: (payload: DictDataReorderPayload) => {
      if (!dictDataConfig.reorder) {
        throw new Error(tt("字典数据暂不支持拖拽排序"))
      }

      return dictDataConfig.reorder(payload)
    },
    onSuccess: async (count) => {
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.dictData,
      })
      showResourceReorderSuccess("字典数据", count, locale)
    },
  })
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all"

  function withDialogDictType(values: ResourceFormValues): ResourceFormValues {
    if (!dictTypeValue) {
      throw new Error(tt("缺少字典类型"))
    }

    return {
      ...values,
      dict_type: dictTypeValue,
    }
  }

  function handleCreate() {
    setEditor({ mode: "create" })
  }

  function handleRowReorder(payload: DictDataReorderPayload) {
    queryClient.setQueryData<PageResponse<DictDataResource>>(
      dictDataQueryKey,
      (current) =>
        current
          ? {
              ...current,
              list: payload.orderedRecords,
            }
          : current
    )
    reorderMutation.mutate(payload, {
      onError: async (error) => {
        showResourceError(error, locale)
        await queryClient.invalidateQueries({ queryKey: dictDataQueryKey })
      },
    })
  }

  async function handleEdit(record: DictDataResource) {
    if (!dictDataConfig.detail) {
      setEditor({ mode: "edit", record })
      return
    }

    try {
      const detailRecord = await dictDataConfig.detail(record)
      setEditor({ mode: "edit", record: detailRecord })
    } catch (error) {
      showResourceError(error, locale)
    }
  }

  async function handleRefresh() {
    setIsManualRefreshing(true)
    try {
      const [result] = await Promise.all([query.refetch(), delay(1_000)])
      if (result.isError) {
        showResourceError(result.error, locale)
        return
      }
      showResourceRefreshSuccess("字典数据", locale)
    } catch (error) {
      showResourceError(error, locale)
    } finally {
      setIsManualRefreshing(false)
    }
  }

  return (
    <ResponsiveDialog
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
      <ResponsiveDialogContent className="max-h-[76vh] gap-0 overflow-hidden p-0 sm:max-w-[880px]">
        <ResponsiveDialogHeader className="min-h-14 border-b px-5 py-3 pr-12 text-left">
          <ResponsiveDialogTitle className="text-lg leading-7 font-semibold">
            {dictType
              ? tt("{name} 字典列表").replace("{name}", dictType.dict_name)
              : tt("字典列表")}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="flex h-[320px] max-h-[52vh] min-h-[240px] flex-1 overflow-hidden md:h-[360px]">
          <ResourceTable
            density="compact"
            data={query.data?.list ?? []}
            columns={dictDataColumns}
            defaultColumnVisibility={{
              dict_type: false,
              remark: false,
            }}
            columnVisibilityResetKey={dictTypeValue ?? "dict-data-dialog"}
            totalRows={query.data?.total ?? 0}
            pageIndex={0}
            pageSize={DICT_DATA_DIALOG_PAGE_SIZE}
            searchValue={search}
            onSearchChange={setSearch}
            onPageIndexChange={() => undefined}
            onPageSizeChange={() => undefined}
            isLoading={query.isLoading}
            isFetching={query.isFetching}
            error={query.error}
            searchPlaceholder={tt("搜索字典标签、键值...")}
            emptyTitle={tt("暂无字典数据")}
            emptyDescription={tt("当前字典类型下还没有字典数据。")}
            emptyActionLabel={tt("新增字典数据")}
            onEmptyAction={handleCreate}
            isFiltered={hasActiveFilters}
            getRowId={(row, index) => String(row.dict_code || index)}
            selectionResetKey={`${dictTypeValue}:${debouncedSearch}:${statusFilter}`}
            toolbarLeading={
              statusFilterOptions ? (
                <ResourceStatusFilterTabs
                  label={tt("字典数据状态")}
                  options={statusFilterOptions}
                  value={statusFilter}
                  listClassName="h-7 rounded-md p-0.5"
                  triggerClassName="px-2 text-xs"
                  highlightClassName="rounded-sm"
                  onValueChange={setStatusFilter}
                />
              ) : null
            }
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
                onEdit={() => void handleEdit(record)}
                onDelete={() => setDeletingRecord(record)}
              />
            )}
            onRowReorder={handleRowReorder}
            isRowReordering={reorderMutation.isPending}
            showColumnControls={false}
            showPaginationFooter={false}
            showPaginationControls={false}
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
              <AlertDialogTitle>
                {t("resource.deleteConfirmTitle", {
                  noun: tt("字典数据"),
                })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("resource.deleteConfirmDescription", {
                  name: deletingRecord
                    ? dictDataConfig.getName(deletingRecord)
                    : "",
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                {t("common.cancel")}
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
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
