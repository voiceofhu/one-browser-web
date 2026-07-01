"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
  type FieldError as HookFormFieldError,
  type FieldErrors,
  type UseFormReturn,
} from "react-hook-form"
import { z } from "zod"

import { DialogActionButton } from "@/components/ui/dialog-action-button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { JobPayload, JobResource } from "@/types/admin"
import { showResourceValidationError } from "@/views/system/_components/resource/toast"

import {
  JOB_CONCURRENT_OPTIONS,
  JOB_INVOKE_TARGET_OPTIONS,
  JOB_INVOKE_TARGET_VALUES,
  JOB_MISFIRE_POLICY_OPTIONS,
  JOB_STATUS_OPTIONS,
} from "./constants"

const jobFormSchema = z.object({
  job_name: z.string().trim().min(1, "请输入任务名称"),
  job_group: z.string().trim().min(1, "请输入任务组"),
  invoke_target: z.enum(JOB_INVOKE_TARGET_VALUES),
  cron_expression: z.string().trim().min(1, "请输入调度表达式"),
  misfire_policy: z.enum(["1", "2", "3"]),
  concurrent: z.enum(["0", "1"]),
  status: z.enum(["0", "1"]),
  remark: z.string().trim(),
})

type JobFormValues = z.infer<typeof jobFormSchema>
type JobEditorMode = "create" | "edit"

type JobEditorDialogProps = {
  open: boolean
  mode: JobEditorMode
  job?: JobResource | null
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: JobPayload) => Promise<void>
}

const FIELD_LABELS: Record<keyof JobFormValues, string> = {
  job_name: "任务名称",
  job_group: "任务组",
  invoke_target: "调用目标",
  cron_expression: "调度表达式",
  misfire_policy: "执行策略",
  concurrent: "并发执行",
  status: "任务状态",
  remark: "备注",
}

const DEFAULT_JOB_FORM_VALUES: JobFormValues = {
  job_name: "",
  job_group: "DEFAULT",
  invoke_target: JOB_INVOKE_TARGET_VALUES[0],
  cron_expression: "@every 5m",
  misfire_policy: "3",
  concurrent: "1",
  status: "0",
  remark: "",
}

export function JobEditorDialog({
  open,
  mode,
  job,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: JobEditorDialogProps) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: getJobFormValues(job),
  })
  const selectedTarget = useWatch({
    control: form.control,
    name: "invoke_target",
  })
  const selectedTargetOption = JOB_INVOKE_TARGET_OPTIONS.find(
    (option) => option.value === selectedTarget
  )

  React.useEffect(() => {
    if (open) {
      form.reset(getJobFormValues(job))
    }
  }, [form, job, open])

  function handleInvalidSubmit(errors: FieldErrors<JobFormValues>) {
    const [fieldName, error] = Object.entries(errors)[0] ?? []
    showResourceValidationError(
      "定时任务",
      FIELD_LABELS[fieldName as keyof JobFormValues],
      getFieldErrorMessage(error)
    )
  }

  const title = mode === "create" ? "新增定时任务" : "编辑定时任务"

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        className="gap-4 sm:max-w-3xl"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <form
          className="flex min-h-0 flex-1 flex-col gap-0 md:gap-3"
          onSubmit={form.handleSubmit(
            (values) => onSubmit(toJobPayload(values)),
            handleInvalidSubmit
          )}
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              配置后台白名单任务和调度表达式。
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <ResponsiveDialogBody>
            <FieldGroup className="grid gap-y-3 p-1 md:max-h-[68vh] md:grid-cols-2 md:gap-x-4 md:overflow-y-auto">
              <TextField
                form={form}
                name="job_name"
                label="任务名称"
                placeholder="例如：健康检查"
                disabled={isSubmitting}
                required
              />
              <TextField
                form={form}
                name="job_group"
                label="任务组"
                placeholder="DEFAULT"
                disabled={isSubmitting}
                required
              />
              <SelectField
                form={form}
                name="invoke_target"
                label="调用目标"
                disabled={isSubmitting}
                options={JOB_INVOKE_TARGET_OPTIONS}
                description={selectedTargetOption?.description}
                required
              />
              <TextField
                form={form}
                name="cron_expression"
                label="调度表达式"
                placeholder="@every 5m"
                description="支持 @hourly、@daily、@every 30s/5m/1h，或五字段 cron。"
                disabled={isSubmitting}
                required
              />
              <SelectField
                form={form}
                name="misfire_policy"
                label="执行策略"
                disabled={isSubmitting}
                options={JOB_MISFIRE_POLICY_OPTIONS}
                required
              />
              <SelectField
                form={form}
                name="concurrent"
                label="并发执行"
                disabled={isSubmitting}
                options={JOB_CONCURRENT_OPTIONS}
                required
              />
              <SelectField
                form={form}
                name="status"
                label="任务状态"
                disabled={isSubmitting}
                options={JOB_STATUS_OPTIONS}
                required
              />
              <TextareaField
                form={form}
                name="remark"
                label="备注"
                placeholder="记录任务用途或维护说明"
                disabled={isSubmitting}
              />
            </FieldGroup>
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <DialogActionButton
                type="button"
                action="cancel"
                disabled={isSubmitting}
              >
                取消
              </DialogActionButton>
            </ResponsiveDialogClose>
            <DialogActionButton
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              loadingText={mode === "create" ? "创建" : "保存"}
            >
              {mode === "create" ? "创建" : "保存"}
            </DialogActionButton>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function TextField({
  form,
  name,
  label,
  placeholder,
  description,
  disabled,
  required,
}: {
  form: UseFormReturn<JobFormValues>
  name: keyof JobFormValues
  label: string
  placeholder?: string
  description?: string
  disabled?: boolean
  required?: boolean
}) {
  const fieldId = React.useId()
  const error = form.formState.errors[name]
  const invalid = Boolean(error)

  return (
    <Field data-invalid={invalid}>
      <RequiredFieldLabel htmlFor={fieldId} required={required}>
        {label}
      </RequiredFieldLabel>
      <Input
        id={fieldId}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={invalid}
        {...form.register(name)}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{getFieldErrorMessage(error)}</FieldError>
    </Field>
  )
}

function TextareaField({
  form,
  name,
  label,
  placeholder,
  disabled,
}: {
  form: UseFormReturn<JobFormValues>
  name: keyof JobFormValues
  label: string
  placeholder?: string
  disabled?: boolean
}) {
  const fieldId = React.useId()
  const error = form.formState.errors[name]
  const invalid = Boolean(error)

  return (
    <Field className="md:col-span-2" data-invalid={invalid}>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <Textarea
        id={fieldId}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={invalid}
        {...form.register(name)}
      />
      <FieldError>{getFieldErrorMessage(error)}</FieldError>
    </Field>
  )
}

function SelectField<TValue extends JobFormValues[keyof JobFormValues]>({
  form,
  name,
  label,
  description,
  disabled,
  options,
  required,
}: {
  form: UseFormReturn<JobFormValues>
  name: keyof JobFormValues
  label: string
  description?: string
  disabled?: boolean
  options: readonly { value: TValue; label: string }[]
  required?: boolean
}) {
  const fieldId = React.useId()
  const error = form.formState.errors[name]
  const invalid = Boolean(error)
  const value = form.watch(name)

  return (
    <Field data-invalid={invalid}>
      <RequiredFieldLabel htmlFor={fieldId} required={required}>
        {label}
      </RequiredFieldLabel>
      <Select
        value={String(value)}
        disabled={disabled}
        onValueChange={(nextValue) => {
          form.setValue(name, nextValue as JobFormValues[typeof name], {
            shouldDirty: true,
            shouldValidate: true,
          })
        }}
      >
        <SelectTrigger id={fieldId} className="w-full" aria-invalid={invalid}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{getFieldErrorMessage(error)}</FieldError>
    </Field>
  )
}

function RequiredFieldLabel({
  children,
  required,
  ...props
}: React.ComponentProps<typeof FieldLabel> & { required?: boolean }) {
  return (
    <FieldLabel {...props}>
      {children}
      {required ? <span className="text-destructive">*</span> : null}
    </FieldLabel>
  )
}

function getJobFormValues(job?: JobResource | null): JobFormValues {
  if (!job) {
    return DEFAULT_JOB_FORM_VALUES
  }

  return {
    job_name: job.job_name,
    job_group: job.job_group,
    invoke_target: isKnownInvokeTarget(job.invoke_target)
      ? job.invoke_target
      : JOB_INVOKE_TARGET_VALUES[0],
    cron_expression: job.cron_expression,
    misfire_policy: job.misfire_policy,
    concurrent: job.concurrent,
    status: job.status,
    remark: job.remark,
  }
}

function isKnownInvokeTarget(
  value: string
): value is (typeof JOB_INVOKE_TARGET_VALUES)[number] {
  return JOB_INVOKE_TARGET_VALUES.some((target) => target === value)
}

function toJobPayload(values: JobFormValues): JobPayload {
  return {
    job_name: values.job_name,
    job_group: values.job_group,
    invoke_target: values.invoke_target,
    cron_expression: values.cron_expression,
    misfire_policy: values.misfire_policy,
    concurrent: values.concurrent,
    status: values.status,
    remark: values.remark,
  }
}

function getFieldErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as HookFormFieldError).message
    return typeof message === "string" ? message : undefined
  }

  return undefined
}
