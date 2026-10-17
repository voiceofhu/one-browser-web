import {
  AnimatedSegmentedTabs,
  type AnimatedSegmentedTabsOption,
} from '@/components/ui/animated-segmented-tabs';
import { RefreshButton } from '@/components/refresh-button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';

export type BrowserStatusFilter = 'all' | '0' | '1';

export const BROWSER_STATUS_FILTERS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '启用' },
  { value: '1', label: '停用' },
] as const satisfies readonly AnimatedSegmentedTabsOption<BrowserStatusFilter>[];

type BrowserTableToolbarProps = {
  filters: React.ReactNode;
  actions: React.ReactNode;
};

export function BrowserTableToolbar({
  filters,
  actions,
}: BrowserTableToolbarProps) {
  return (
    <div
      data-slot="browser-table-toolbar"
      className="bg-muted/20 flex shrink-0 flex-col gap-2 border-b px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {filters}
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-start gap-1.5 border-t pt-2 sm:ml-auto sm:justify-end sm:border-t-0 sm:border-l sm:pt-0 sm:pl-2">
        {actions}
      </div>
    </div>
  );
}

type BrowserTableFilterTabsProps<TValue extends string> = {
  label: string;
  options: readonly AnimatedSegmentedTabsOption<TValue>[];
  value: TValue;
  onValueChange: (value: TValue) => void;
};

export function BrowserTableFilterTabs<TValue extends string>({
  label,
  options,
  value,
  onValueChange,
}: BrowserTableFilterTabsProps<TValue>) {
  return (
    <AnimatedSegmentedTabs
      label={label}
      options={options}
      className="max-w-full overflow-x-auto"
      listClassName="h-8 max-w-full border p-0.5 sm:h-7"
      triggerClassName="px-2.5 text-xs font-normal data-[state=active]:font-medium"
      value={value}
      onValueChange={onValueChange}
    />
  );
}

type BrowserTableSearchFieldProps = {
  value: string;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  onValueChange: (value: string) => void;
};

export function BrowserTableSearchField({
  value,
  placeholder,
  ariaLabel,
  className,
  onValueChange,
}: BrowserTableSearchFieldProps) {
  return (
    <InputGroup className={cn('h-9 w-full max-w-64 bg-background shadow-none sm:h-7 sm:w-56 sm:flex-none', className)}>
      <InputGroupAddon className="h-full py-0">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
      </InputGroupAddon>
      <InputGroupInput
        className="h-full py-0 text-xs/relaxed"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </InputGroup>
  );
}

type BrowserTableRefreshButtonProps = {
  isRefreshing: boolean;
  onRefresh: () => unknown | Promise<unknown>;
  successMessage: string;
};

export function BrowserTableRefreshButton({
  isRefreshing,
  onRefresh,
  successMessage,
}: BrowserTableRefreshButtonProps) {
  return (
    <RefreshButton
      variant="outline"
      size="sm"
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      successMessage={successMessage}
    />
  );
}
