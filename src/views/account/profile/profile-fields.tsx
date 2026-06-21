import * as React from "react"
import type { LucideIcon } from "lucide-react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type ProfileInputProps = React.ComponentProps<typeof Input> & {
  label: string
  description?: string
  error?: string
}

export function ProfileInput({
  label,
  description,
  error,
  className,
  ...props
}: ProfileInputProps) {
  return (
    <Field data-invalid={Boolean(error)} className={className}>
      <FieldLabel>{label}</FieldLabel>
      <Input aria-invalid={Boolean(error)} {...props} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={[error ? { message: error } : undefined]} />
    </Field>
  )
}

export function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3">
      <dt className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="min-w-0 truncate text-right font-medium" title={value}>
        {value}
      </dd>
    </div>
  )
}
