import { AnimatedSegmentedTabs } from '@/components/ui/animated-segmented-tabs';
import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type CompactTabOption<T extends string> = {
  value: T;
  label: string;
};

export function EditorFieldRow({
  children,
  className,
  controlClassName,
  label,
}: {
  children: ReactNode;
  className?: string;
  controlClassName?: string;
  label: ReactNode;
}) {
  return (
    <Field
      className={cn(
        'grid gap-2 md:grid-cols-[7rem_minmax(0,1fr)] md:items-start',
        className,
      )}
    >
      <FieldLabel className="pt-2 text-sm">{label}</FieldLabel>
      <div className={cn('min-w-0', controlClassName)}>{children}</div>
    </Field>
  );
}

export function CompactTabs<T extends string>({
  className,
  itemClassName,
  listClassName,
  onValueChange,
  options,
  value,
}: {
  className?: string;
  itemClassName?: string;
  listClassName?: string;
  onValueChange: (value: T) => void;
  options: Array<CompactTabOption<T>>;
  value: T;
}) {
  return (
    <AnimatedSegmentedTabs
      label="编辑选项"
      options={options}
      value={value}
      onValueChange={onValueChange}
      className={cn('inline-flex max-w-full overflow-hidden', className)}
      listClassName={cn(
        'no-scrollbar max-w-full justify-start overflow-x-auto overscroll-x-contain scroll-px-1 border p-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        listClassName,
      )}
      triggerClassName={cn('h-full min-w-16 flex-none snap-start px-4 text-xs', itemClassName)}
    />
  );
}
