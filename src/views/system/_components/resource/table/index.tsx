"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react"

export { ResourceTableColumnHeader } from "./column-header"
import { ResourceTableSkeleton } from "./skeleton"
import { getColumnMeta, getErrorMessage } from "./utils"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ResourceTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  totalRows: number
  pageIndex: number
  pageSize: number
  searchValue: string
  onSearchChange: (value: string) => void
  onPageIndexChange: (value: number) => void
  onPageSizeChange: (value: number) => void
  isLoading?: boolean
  isFetching?: boolean
  error?: unknown
  searchPlaceholder?: string
  emptyTitle?: string
  emptyDescription?: string
  toolbarActions?: React.ReactNode
  renderRowActions?: (row: TData) => React.ReactNode
  getRowId?: (row: TData, index: number) => string
}

export function ResourceTable<TData>({
  data,
  columns,
  totalRows,
  pageIndex,
  pageSize,
  searchValue,
  onSearchChange,
  onPageIndexChange,
  onPageSizeChange,
  isLoading = false,
  isFetching = false,
  error,
  searchPlaceholder = "搜索资源...",
  emptyTitle = "暂无数据",
  emptyDescription = "当前资源还没有可显示的记录。",
  toolbarActions,
  renderRowActions,
  getRowId,
}: ResourceTableProps<TData>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const pagination = React.useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  )
  const handlePaginationChange = React.useCallback(
    (updater: Updater<PaginationState>) => {
      const next = typeof updater === "function" ? updater(pagination) : updater

      if (next.pageSize !== pageSize) {
        onPageSizeChange(next.pageSize)
      }
      if (next.pageIndex !== pageIndex) {
        onPageIndexChange(next.pageIndex)
      }
    },
    [onPageIndexChange, onPageSizeChange, pageIndex, pageSize, pagination]
  )

  const tableColumns = React.useMemo<ColumnDef<TData>[]>(() => {
    if (!renderRowActions) {
      return columns
    }

    return [
      ...columns,
      {
        id: "actions",
        enableHiding: false,
        header: "操作",
        cell: ({ row }) => renderRowActions(row.original),
        meta: {
          label: "操作",
          cellClassName: "w-24 text-right",
        },
      },
    ]
  }, [columns, renderRowActions])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 exposes stateful table helpers by design.
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      columnVisibility,
      pagination,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
    manualFiltering: true,
    manualPagination: true,
    rowCount: totalRows,
    getRowId,
  })

  const visibleColumns = table.getVisibleLeafColumns()
  const rows = table.getRowModel().rows
  const errorMessage = getErrorMessage(error)
  const totalPages = Math.max(Math.ceil(totalRows / pageSize), 1)
  const hasPreviousPage = pageIndex > 0
  const hasNextPage = totalRows > 0 && pageIndex < totalPages - 1
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <section className="flex flex-1 flex-col bg-background">
      <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </InputGroup>
        <div className="flex items-center justify-end gap-2">
          {toolbarActions}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <SlidersHorizontalIcon data-icon="inline-start" />
                列
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>显示列</DropdownMenuLabel>
              <DropdownMenuGroup>
                {table
                  .getAllLeafColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(Boolean(value))
                      }
                    >
                      {getColumnMeta(column).label ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex min-h-80 flex-1 flex-col">
        {errorMessage ? (
          <Alert variant="destructive" className="mx-4 mt-4 lg:mx-6">
            <AlertTitle>资源加载失败</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="p-4 lg:p-6">
            <ResourceTableSkeleton
              columns={Math.max(visibleColumns.length, 1)}
            />
          </div>
        ) : rows.length === 0 ? (
          <Empty className="min-h-72 flex-1 rounded-none border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>
                {searchValue ? "没有匹配结果" : emptyTitle}
              </EmptyTitle>
              <EmptyDescription>
                {searchValue
                  ? "换个关键词试试，搜索会直接请求后台分页接口。"
                  : emptyDescription}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={getColumnMeta(cell.column).cellClassName}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            当前显示 {firstRow}-{lastRow} 条，共 {totalRows} 条
          </span>
          {isFetching && !isLoading ? <span>更新中...</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {[10, 20, 50, 100].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} 条
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageIndexChange(0)}
            disabled={!hasPreviousPage}
          >
            <ChevronsLeftIcon />
            <span className="sr-only">第一页</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageIndexChange(Math.max(pageIndex - 1, 0))}
            disabled={!hasPreviousPage}
          >
            <ChevronLeftIcon />
            <span className="sr-only">上一页</span>
          </Button>
          <div className="min-w-24 text-center text-sm text-muted-foreground">
            第 {pageIndex + 1} / {totalPages} 页
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() =>
              onPageIndexChange(Math.min(pageIndex + 1, totalPages - 1))
            }
            disabled={!hasNextPage}
          >
            <ChevronRightIcon />
            <span className="sr-only">下一页</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageIndexChange(totalPages - 1)}
            disabled={!hasNextPage}
          >
            <ChevronsRightIcon />
            <span className="sr-only">最后一页</span>
          </Button>
        </div>
      </div>
    </section>
  )
}
