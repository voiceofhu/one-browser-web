"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type PaginationState,
  type RowSelectionState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react"

export { ResourceTableColumnHeader } from "./column-header"
import { ResourceTableBulkActions } from "./bulk-actions"
import { ResourceTableEmptyState } from "./empty-state"
import { ResourceTablePagination } from "./pagination"
import { ResourceTableSkeleton } from "./skeleton"
import {
  ResourceTableDragHandle,
  SortableResourceTableRow,
} from "./sortable-row"
import { ResourceTableTreeCell } from "./tree-cell"
import { getColumnMeta, getErrorMessage } from "./utils"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type ResourceTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  defaultColumnVisibility?: VisibilityState
  columnVisibilityResetKey?: React.Key
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
  emptyActionLabel?: string
  onEmptyAction?: () => void
  isFiltered?: boolean
  toolbarLeading?: React.ReactNode
  toolbarActions?: React.ReactNode
  renderRowActions?: (row: TData) => React.ReactNode
  getRowId?: (row: TData, index: number) => string
  getSubRows?: (row: TData) => TData[] | undefined
  treeColumnId?: string
  getRowCanSelect?: (row: TData) => boolean
  onBulkDelete?: (rows: TData[], clearSelection: () => void) => void
  isBulkDeleting?: boolean
  onRowReorder?: (event: {
    active: TData
    over: TData
    orderedRecords: TData[]
  }) => void
  isRowReordering?: boolean
  selectionResetKey?: React.Key
  showPaginationControls?: boolean
}

export function ResourceTable<TData>({
  data,
  columns,
  defaultColumnVisibility,
  columnVisibilityResetKey,
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
  emptyActionLabel,
  onEmptyAction,
  isFiltered = false,
  toolbarLeading,
  toolbarActions,
  renderRowActions,
  getRowId,
  getSubRows,
  treeColumnId,
  getRowCanSelect,
  onBulkDelete,
  isBulkDeleting = false,
  onRowReorder,
  isRowReordering = false,
  selectionResetKey,
  showPaginationControls = true,
}: ResourceTableProps<TData>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => defaultColumnVisibility ?? {})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [expanded, setExpanded] = React.useState<ExpandedState>(true)
  const enableBulkSelection = Boolean(onBulkDelete)
  const enableRowReorder = Boolean(onRowReorder)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
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

  const clearRowSelection = React.useCallback(() => setRowSelection({}), [])

  React.useEffect(() => {
    clearRowSelection()
  }, [clearRowSelection, pageIndex, pageSize, searchValue, selectionResetKey])

  React.useEffect(() => {
    setColumnVisibility(defaultColumnVisibility ?? {})
  }, [columnVisibilityResetKey, defaultColumnVisibility])

  React.useEffect(() => {
    if (getSubRows) {
      setExpanded(true)
    }
  }, [getSubRows, selectionResetKey])

  const tableColumns = React.useMemo<ColumnDef<TData>[]>(() => {
    const nextColumns = [...columns]

    if (enableBulkSelection) {
      nextColumns.unshift({
        id: "select",
        enableHiding: false,
        header: ({ table }) => {
          const hasSelectableRows = table
            .getRowModel()
            .rows.some((row) => row.getCanSelect())

          return (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              disabled={!hasSelectableRows}
              aria-label="选择当前页"
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(value === true)
              }
            />
          )
        },
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            aria-label="选择当前行"
            onCheckedChange={(value) => row.toggleSelected(value === true)}
          />
        ),
        meta: {
          label: "选择",
          cellClassName: "w-10",
        },
      })
    }

    if (enableRowReorder) {
      nextColumns.unshift({
        id: "reorder",
        enableHiding: false,
        header: "",
        cell: () => <ResourceTableDragHandle disabled={isRowReordering} />,
        meta: {
          label: "排序",
          cellClassName: "w-10",
        },
      })
    }

    if (renderRowActions) {
      nextColumns.push({
        id: "actions",
        enableHiding: false,
        header: "操作",
        cell: ({ row }) => renderRowActions(row.original),
        meta: {
          label: "操作",
          cellClassName: "w-32 text-right",
        },
      })
    }

    return nextColumns
  }, [
    columns,
    enableBulkSelection,
    enableRowReorder,
    isRowReordering,
    renderRowActions,
  ])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 exposes stateful table helpers by design.
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      columnVisibility,
      expanded,
      pagination,
      rowSelection,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    onPaginationChange: handlePaginationChange,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows,
    enableSorting: false,
    enableRowSelection: enableBulkSelection
      ? (row) => getRowCanSelect?.(row.original) ?? true
      : false,
    manualFiltering: true,
    manualPagination: true,
    rowCount: totalRows,
    getRowId,
  })

  const visibleColumns = table.getVisibleLeafColumns()
  const rows = table.getRowModel().rows
  const rowIds = React.useMemo<UniqueIdentifier[]>(
    () => rows.map((row) => row.id),
    [rows]
  )
  const selectedRows = table
    .getSelectedRowModel()
    .rows.filter((row) => row.getCanSelect())
  const selectedRecords = selectedRows.map((row) => row.original)
  const selectedCount = selectedRecords.length
  const errorMessage = getErrorMessage(error)
  const totalPages = Math.max(Math.ceil(totalRows / pageSize), 1)
  const hasPreviousPage = pageIndex > 0
  const hasNextPage = totalRows > 0 && pageIndex < totalPages - 1
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = rows.findIndex((row) => row.id === String(active.id))
    const newIndex = rows.findIndex((row) => row.id === String(over.id))
    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const orderedRows = arrayMove(rows, oldIndex, newIndex)
    onRowReorder?.({
      active: rows[oldIndex].original,
      over: rows[newIndex].original,
      orderedRecords: orderedRows.map((row) => row.original),
    })
  }

  return (
    <section className="relative flex flex-1 flex-col overflow-hidden bg-background">
      <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          {toolbarLeading}
          <InputGroup className="w-full max-w-sm sm:w-80">
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
        </div>
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
          <ResourceTableEmptyState
            searchValue={searchValue}
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            isFiltered={isFiltered}
            onAction={onEmptyAction}
          />
        ) : (
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader className="bg-muted/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="first:pl-4 last:pr-4 lg:first:pl-6 lg:last:pr-6"
                        >
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
                  <SortableContext
                    items={rowIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {rows.map((row) => (
                      <SortableResourceTableRow
                        key={row.id}
                        row={row}
                        disabled={!enableRowReorder || isRowReordering}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const content = flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )

                          return (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                "first:pl-4 last:pr-4 lg:first:pl-6 lg:last:pr-6",
                                getColumnMeta(cell.column).cellClassName
                              )}
                            >
                              {cell.column.id === treeColumnId ? (
                                <ResourceTableTreeCell row={row}>
                                  {content}
                                </ResourceTableTreeCell>
                              ) : (
                                content
                              )}
                            </TableCell>
                          )
                        })}
                      </SortableResourceTableRow>
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </div>
        )}
      </div>
      <ResourceTablePagination
        firstRow={firstRow}
        lastRow={lastRow}
        totalRows={totalRows}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalPages={totalPages}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        isUpdating={isFetching && !isLoading}
        showControls={showPaginationControls}
        onPageIndexChange={onPageIndexChange}
        onPageSizeChange={onPageSizeChange}
      />
      {enableBulkSelection ? (
        <ResourceTableBulkActions
          selectedCount={selectedCount}
          selectedRecords={selectedRecords}
          isBulkDeleting={isBulkDeleting}
          onClearSelection={clearRowSelection}
          onBulkDelete={onBulkDelete}
        />
      ) : null}
    </section>
  )
}
