import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  type PaginationState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';
import { listSystemResources } from './api';
import { fieldLabels } from './labels';
import type { StatusFilter, SystemRecord, SystemResourceConfig } from './types';
import { filterByStatus, renderResourceCell } from './resource-cell';
import { ResourceFooter } from './resource-footer';
import {
  ResourceEmpty,
  ResourceError,
  ResourceTableLoading,
} from './resource-states';
import { ResourceToolbar } from './resource-toolbar';

export function SystemResourceTable({
  config,
  renderCell,
  renderRowActions,
  toolbarActions,
}: {
  config: SystemResourceConfig;
  renderCell?: (
    field: string,
    value: unknown,
    record: SystemRecord,
  ) => React.ReactNode | undefined;
  renderRowActions?: (record: SystemRecord) => React.ReactNode;
  toolbarActions?: React.ReactNode;
}) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const deferredSearch = React.useDeferredValue(search.trim());
  const serverParams = config.serverPagination
    ? {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: deferredSearch,
        status: statusFilter,
      }
    : undefined;
  const query = useQuery({
    queryKey: [
      'system-resource',
      config.endpoint,
      config.queryParams,
      serverParams,
    ],
    queryFn: () => listSystemResources(config, serverParams),
    placeholderData: config.serverPagination
      ? (previousData) => previousData
      : undefined,
  });
  const columns = React.useMemo<ColumnDef<SystemRecord>[]>(
    () => [
      ...config.columns.map<ColumnDef<SystemRecord>>((field) => ({
        accessorKey: field,
        header: fieldLabels[field] ?? field,
        cell: ({ getValue, row }) =>
          renderCell?.(field, getValue(), row.original) ??
          renderResourceCell(field, getValue(), row.original),
        meta: { label: fieldLabels[field] ?? field },
      })),
      ...(renderRowActions
        ? [
            {
              id: 'actions',
              header: '操作',
              cell: ({ row }) => renderRowActions(row.original),
              enableHiding: false,
            } satisfies ColumnDef<SystemRecord>,
          ]
        : []),
    ],
    [config.columns, renderCell, renderRowActions],
  );
  const records = React.useMemo(
    () =>
      config.serverPagination
        ? (query.data?.list ?? [])
        : filterByStatus(query.data?.list ?? [], statusFilter),
    [config.serverPagination, query.data?.list, statusFilter],
  );
  const total = query.data?.total ?? 0;
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      columnVisibility,
      globalFilter: config.serverPagination ? '' : search,
      pagination,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setSearch,
    onPaginationChange: setPagination,
    manualPagination: config.serverPagination,
    rowCount: config.serverPagination ? total : undefined,
  });
  const updateSearch = (value: string) => {
    setSearch(value);
    if (config.serverPagination) {
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    }
  };
  const updateStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    if (config.serverPagination) {
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    }
  };
  return (
    <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden">
      <ResourceToolbar
        hasStatus={
          config.serverPagination
            ? config.columns.includes('status')
            : records.some((record) => 'status' in record)
        }
        isFetching={query.isFetching}
        onRefresh={query.refetch}
        search={search}
        setSearch={updateSearch}
        statusFilter={statusFilter}
        setStatusFilter={updateStatusFilter}
        table={table}
        title={config.title}
        actions={toolbarActions}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        {query.isLoading ? (
          <ResourceTableLoading columnCount={table.getVisibleLeafColumns().length} />
        ) : query.isError ? (
          <ResourceError
            error={query.error}
            isRetrying={query.isFetching}
            onRetry={() => void query.refetch()}
          />
        ) : table.getRowModel().rows.length === 0 ? (
          <ResourceEmpty />
        ) : (
          <Table className="min-w-[640px]">
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id} className="h-8">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-10 py-1.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <ResourceFooter
        table={table}
        total={config.serverPagination ? total : undefined}
      />
    </section>
  );
}
