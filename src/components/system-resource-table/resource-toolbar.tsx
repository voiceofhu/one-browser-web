import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BrowserTableFilterTabs,
  BrowserTableRefreshButton,
  BrowserTableSearchField,
  BrowserTableToolbar,
} from '@/features/browser/components/table-toolbar';
import {
  ArrowDown01Icon,
  SlidersHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Table } from '@tanstack/react-table';
import { fieldLabels } from './labels';
import type { StatusFilter, SystemRecord } from './types';

const options = [
  { label: '全部', value: 'all' },
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
] satisfies Array<{ label: string; value: StatusFilter }>;

export function ResourceToolbar({
  hasStatus,
  isFetching,
  onRefresh,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  table,
  title,
  actions,
}: {
  hasStatus: boolean;
  isFetching: boolean;
  onRefresh: () => void | Promise<{ isError?: boolean }>;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  table: Table<SystemRecord>;
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <BrowserTableToolbar
      filters={
        <>
          {hasStatus ? (
            <BrowserTableFilterTabs
              label="状态筛选"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={options}
            />
          ) : null}
          <BrowserTableSearchField
            className="w-full sm:w-56"
            value={search}
            onValueChange={setSearch}
            placeholder={`搜索${title}`}
            ariaLabel={`搜索${title}`}
          />
        </>
      }
      actions={
        <>
          {actions}
          <BrowserTableRefreshButton
            isRefreshing={isFetching}
            onRefresh={onRefresh}
            successMessage={`${title}已刷新`}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="outline">
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
                {table
                  .getAllLeafColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) =>
                        column.toggleVisibility(Boolean(checked))
                      }
                    >
                      {fieldLabels[column.id] ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  );
}
