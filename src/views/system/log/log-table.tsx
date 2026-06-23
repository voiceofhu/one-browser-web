"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"

import { useTranslation } from "@/components/providers/language-context"
import { translateAdminText } from "@/local"
import type { ListParams, PageResponse } from "@/types/admin"
import { ResourceTable } from "@/views/system/_components/resource/table"
import { useDebouncedValue } from "@/views/system/_components/resource/manager-utils"
import {
  ResourceStatusFilterTabs,
  type ResourceStatusFilterValue,
} from "@/views/system/_components/resource/status-filter-tabs"

type LogTableProps<TData> = {
  queryKey: readonly unknown[]
  list: (params?: ListParams) => Promise<PageResponse<TData>>
  columns: ColumnDef<TData>[]
  getRowId: (row: TData, index: number) => string
  searchPlaceholder: string
  emptyTitle: string
  emptyDescription: string
  statusFilterLabel: string
  columnVisibilityResetKey: React.Key
  defaultColumnVisibility?: Record<string, boolean>
  renderRowActions?: (record: TData) => React.ReactNode
}

const LOG_STATUS_FILTERS = [
  { label: "全部", value: "all" },
  { label: "成功", value: "0" },
  { label: "失败", value: "1" },
] as const

export function LogTable<TData>({
  queryKey,
  list,
  columns,
  getRowId,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  statusFilterLabel,
  columnVisibilityResetKey,
  defaultColumnVisibility,
  renderRowActions,
}: LogTableProps<TData>) {
  const { locale } = useTranslation()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] =
    React.useState<ResourceStatusFilterValue>("all")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const params = React.useMemo(() => {
    const nextParams: ListParams = {
      page: pageIndex + 1,
      page_size: pageSize,
    }

    if (debouncedSearch) {
      nextParams.keyword = debouncedSearch
    }
    if (statusFilter !== "all") {
      nextParams.status = statusFilter
    }

    return nextParams
  }, [debouncedSearch, pageIndex, pageSize, statusFilter])
  const listQueryKey = React.useMemo(
    () => [...queryKey, params] as const,
    [queryKey, params]
  )
  const query = useQuery({
    queryKey: listQueryKey,
    queryFn: () => list(params),
    placeholderData: (previousData) => previousData,
  })
  const records = React.useMemo(
    () => query.data?.list ?? [],
    [query.data?.list]
  )
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all"
  const statusFilterOptions = React.useMemo(
    () =>
      LOG_STATUS_FILTERS.map((option) => ({
        ...option,
        label: translateAdminText(locale, option.label),
      })),
    [locale]
  )

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ResourceTable
        data={records}
        columns={columns}
        defaultColumnVisibility={defaultColumnVisibility}
        columnVisibilityResetKey={columnVisibilityResetKey}
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
          <ResourceStatusFilterTabs
            label={statusFilterLabel}
            options={statusFilterOptions}
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
        searchPlaceholder={searchPlaceholder}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        isFiltered={hasActiveFilters}
        getRowId={getRowId}
        selectionResetKey={`${statusFilter}:${debouncedSearch}`}
        renderRowActions={renderRowActions}
      />
    </div>
  )
}
