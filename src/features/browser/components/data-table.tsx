import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ArrowDown01Icon,
  DatabaseSearchIcon,
  SlidersHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type RowData,
  type RowSelectionState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import {
  BrowserTableDragHandle,
  SortableBrowserTableRow,
} from './sortable-table-row';

declare module '@tanstack/react-table' {
  // TanStack requires both generic parameters on ColumnMeta augmentation.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    cellClassName?: string;
    headerClassName?: string;
    label?: string;
  }
}

export type BrowserTableColumnVisibilityOption = {
  id: string;
  label: string;
};

interface BrowserTableColumnVisibilityMenuProps<
  TData = unknown,
  TValue = unknown,
> {
  columns?: ColumnDef<TData, TValue>[];
  options?: readonly BrowserTableColumnVisibilityOption[];
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: OnChangeFn<VisibilityState>;
  size?: 'default' | 'sm';
}

export function BrowserTableColumnVisibilityMenu<
  TData = unknown,
  TValue = unknown,
>({
  columns,
  options,
  columnVisibility,
  onColumnVisibilityChange,
  size = 'sm',
}: BrowserTableColumnVisibilityMenuProps<TData, TValue>) {
  const columnOptions = React.useMemo(
    () => options ?? getColumnVisibilityOptions(columns ?? []),
    [columns, options],
  );

  if (!columnOptions.length) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size={size}>
          <HugeiconsIcon
            icon={SlidersHorizontalIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          列
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            data-icon="inline-end"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>显示列</DropdownMenuLabel>
          {columnOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              checked={columnVisibility[option.id] !== false}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) =>
                onColumnVisibilityChange((current) => ({
                  ...current,
                  [option.id]: Boolean(checked),
                }))
              }
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getColumnVisibilityOptions<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
): BrowserTableColumnVisibilityOption[] {
  return columns.flatMap((column) => {
    if ('columns' in column && Array.isArray(column.columns)) {
      return getColumnVisibilityOptions(column.columns);
    }

    if (column.enableHiding === false) {
      return [];
    }

    const id = getColumnId(column);
    if (!id) {
      return [];
    }

    return [
      {
        id,
        label:
          column.meta?.label ??
          (typeof column.header === 'string' ? column.header : id),
      },
    ];
  });
}

function getColumnId<TData, TValue>(column: ColumnDef<TData, TValue>) {
  if (column.id) {
    return column.id;
  }

  if ('accessorKey' in column && column.accessorKey != null) {
    return String(column.accessorKey).replaceAll('.', '_');
  }

  return null;
}

export type BrowserTableRowReorderEvent<TData> = {
  active: TData;
  over: TData;
  orderedRecords: TData[];
};

interface BrowserDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyTitle: string;
  emptyDescription: string;
  getRowId: (row: TData) => string;
  isLoading?: boolean;
  density?: 'default' | 'compact';
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  tableClassName?: string;
  onRowReorder?: (
    event: BrowserTableRowReorderEvent<TData>,
  ) => Promise<unknown> | void;
  isRowReordering?: boolean;
}

export function BrowserDataTable<TData, TValue>({
  columns,
  data,
  emptyTitle,
  emptyDescription,
  getRowId,
  isLoading,
  density = 'default',
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  columnVisibility,
  onColumnVisibilityChange,
  tableClassName,
  onRowReorder,
  isRowReordering = false,
}: BrowserDataTableProps<TData, TValue>) {
  const enableRowReorder = Boolean(onRowReorder);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowReorder) {
      return columns;
    }

    return [
      {
        id: 'reorder',
        header: '',
        cell: () => <BrowserTableDragHandle disabled={isRowReordering} />,
        enableHiding: false,
        enableSorting: false,
      },
      ...columns,
    ];
  }, [columns, enableRowReorder, isRowReordering]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns: tableColumns,
    data,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    onColumnVisibilityChange,
    onRowSelectionChange,
    state: {
      columnVisibility: columnVisibility ?? {},
      rowSelection: rowSelection ?? {},
    },
  });
  const rows = table.getRowModel().rows;
  const rowIds = React.useMemo<UniqueIdentifier[]>(
    () => rows.map((row) => row.id),
    [rows],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = rows.findIndex((row) => row.id === String(active.id));
    const newIndex = rows.findIndex((row) => row.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const orderedRows = arrayMove(rows, oldIndex, newIndex);
    void onRowReorder?.({
      active: rows[oldIndex].original,
      over: rows[newIndex].original,
      orderedRecords: orderedRows.map((row) => row.original),
    });
  }

  if (!isLoading && !data.length) {
    return (
      <Empty className="min-h-56 rounded-none px-4 py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={DatabaseSearchIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <Table
        className={cn('min-w-[900px]', tableClassName)}
        aria-busy={Boolean(isLoading)}
        aria-label={isLoading ? '数据加载中' : undefined}
      >
        <TableHeader className="sticky top-0 z-20 bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    'h-8 text-xs',
                    header.id === 'reorder' && 'w-8 px-1',
                    header.id === 'select' && 'w-10 pl-3',
                    header.id === 'name' && 'min-w-64',
                    header.id === 'status' && 'w-24',
                    header.id === 'proxySummary' && 'min-w-52',
                    header.id === 'pid' && 'w-24',
                    header.id === 'createdAt' && 'min-w-40 text-left',
                    header.id === 'actions' &&
                      'sticky right-0 z-30 bg-muted/95 px-3 text-right whitespace-nowrap',
                    header.column.columnDef.meta?.headerClassName,
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }, (_, index) => (
              <TableRow key={index} className="hover:bg-transparent" aria-hidden="true">
                {table.getVisibleLeafColumns().map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      density === 'compact' ? 'h-9 py-1' : 'h-11 py-1.5',
                      column.id === 'actions' && 'sticky right-0 bg-card px-3',
                      column.columnDef.meta?.cellClassName,
                    )}
                  >
                    <Skeleton
                      className={cn(
                        'h-3 w-3/4 max-w-36 rounded-sm',
                        (column.id === 'select' || column.id === 'reorder') && 'size-3.5',
                        column.id === 'actions' && 'ml-auto w-16',
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
          <SortableContext
            items={rowIds}
            strategy={verticalListSortingStrategy}
          >
            {rows.map((row) => (
              <SortableBrowserTableRow
                key={row.id}
                row={row}
                disabled={!enableRowReorder || isRowReordering}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      density === 'compact' ? 'h-9 py-1' : 'h-11 py-1.5',
                      cell.column.id === 'reorder' && 'px-1',
                      cell.column.id === 'select' && 'pl-3',
                      cell.column.id === 'createdAt' && 'text-left',
                      cell.column.id === 'actions' &&
                        'sticky right-0 z-10 bg-card px-3 text-right whitespace-nowrap group-data-[state=selected]/row:bg-muted group-hover/row:bg-muted/50',
                      cell.column.columnDef.meta?.cellClassName,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </SortableBrowserTableRow>
            ))}
          </SortableContext>
          )}
        </TableBody>
      </Table>
    </DndContext>
  );
}
