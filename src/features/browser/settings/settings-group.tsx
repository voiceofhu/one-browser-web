import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function SettingsGroup({
  children,
  className,
  description,
  title,
}: {
  children: ReactNode;
  className?: string;
  description?: string;
  title: string;
}) {
  return (
    <FieldSet className="gap-1.5">
      <FieldLegend className="mb-0 text-xs font-medium text-foreground">
        {title}
      </FieldLegend>
      {description ? (
        <FieldDescription className="mb-0 text-xs leading-relaxed font-normal">
          {description}
        </FieldDescription>
      ) : null}
      <FieldGroup
        className={cn(
          'gap-0 overflow-hidden rounded-sm border bg-card',
          className,
        )}
      >
        {children}
      </FieldGroup>
    </FieldSet>
  );
}

export function SettingsRow({
  children,
  controlClassName,
  description,
  htmlFor,
  label,
  labelId,
}: {
  children: ReactNode;
  controlClassName?: string;
  description: ReactNode;
  htmlFor?: string;
  label: string;
  labelId?: string;
}) {
  return (
    <Field
      orientation="responsive"
      className="items-center justify-between gap-2 px-3 py-2 @md/field-group:gap-4"
    >
      <FieldContent className="min-w-0">
        <FieldLabel
          htmlFor={htmlFor}
          id={labelId}
          className="text-[13px] leading-snug font-medium"
        >
          {label}
        </FieldLabel>
        <FieldDescription className="mt-0.5 text-xs leading-relaxed font-normal break-words">
          {description}
        </FieldDescription>
      </FieldContent>
      <div
        className={cn(
          'flex min-w-0 w-full shrink-0 items-center justify-start @md/field-group:w-auto @md/field-group:justify-end [&>button]:rounded-sm [&>button]:shadow-none',
          controlClassName,
        )}
      >
        {children}
      </div>
    </Field>
  );
}

export function SettingsFormRow({
  children,
  description,
  htmlFor,
  label,
}: {
  children: ReactNode;
  description: ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <Field
      orientation="responsive"
      className="items-center justify-between gap-2 px-3 py-2 @md/field-group:gap-4"
    >
      <FieldContent className="min-w-0">
        <FieldLabel
          htmlFor={htmlFor}
          className="text-[13px] leading-snug font-medium"
        >
          {label}
        </FieldLabel>
        <FieldDescription className="mt-0.5 text-xs leading-relaxed font-normal break-words">
          {description}
        </FieldDescription>
      </FieldContent>
      <div className="flex min-w-0 w-full shrink-0 items-center @md/field-group:w-64 @lg/field-group:w-80 [&_[data-slot=input-group]]:rounded-sm [&_input]:shadow-none">
        {children}
      </div>
    </Field>
  );
}

export function SettingsDivider() {
  return <Separator className="w-full" />;
}
