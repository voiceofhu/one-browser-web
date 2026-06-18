"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  type FieldError as HookFormFieldError,
  type FieldErrors,
  type Resolver,
} from "react-hook-form"
import type { ZodType } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

import { getUserPostIds, getUserRoleIds } from "@/api/system/user"
import { systemQueryKeys } from "@/lib/query-keys"
import { cn } from "@/lib/utils"
import type {
  ResourceField,
  ResourceFormMode,
  ResourceFormValues,
} from "./form"
import { ResourceFieldControl } from "./editor-field-control"
import { showResourceValidationError } from "./toast"

type ResourceEditorDialogProps = {
  open: boolean
  mode: ResourceFormMode
  noun: string
  fields: ResourceField[]
  schema: ZodType<ResourceFormValues>
  values: ResourceFormValues
  recordId?: number
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ResourceFormValues) => Promise<void>
}

export function ResourceEditorDialog({
  open,
  mode,
  noun,
  fields,
  schema,
  values,
  recordId,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: ResourceEditorDialogProps) {
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(schema as never) as Resolver<ResourceFormValues>,
    defaultValues: values,
  })
  const { reset } = form
  const watchedValues = form.watch()
  const hasRoleField = fields.some(
    (field) => field.type === "role-multi-select"
  )
  const hasPostField = fields.some(
    (field) => field.type === "post-multi-select"
  )
  const roleIdsQuery = useQuery({
    queryKey: [...systemQueryKeys.users, "roles", recordId],
    queryFn: () => getUserRoleIds(recordId ?? 0),
    enabled: open && mode === "edit" && hasRoleField && recordId != null,
  })
  const postIdsQuery = useQuery({
    queryKey: [...systemQueryKeys.users, "posts", recordId],
    queryFn: () => getUserPostIds(recordId ?? 0),
    enabled: open && mode === "edit" && hasPostField && recordId != null,
  })

  React.useEffect(() => {
    if (open) {
      reset({
        ...values,
        ...(roleIdsQuery.data ? { role_ids: roleIdsQuery.data.ids } : {}),
        ...(postIdsQuery.data ? { post_ids: postIdsQuery.data.ids } : {}),
      })
    }
  }, [open, postIdsQuery.data, reset, roleIdsQuery.data, values])

  const visibleFields = fields.filter(
    (field) =>
      !(mode === "create" && field.hiddenOnCreate) &&
      !(mode === "edit" && field.hiddenOnEdit) &&
      field.visibleWhen?.(watchedValues, mode) !== false
  )

  function handleInvalidSubmit(errors: FieldErrors<ResourceFormValues>) {
    const [fieldName, error] = Object.entries(errors)[0] ?? []
    const fieldLabel = fields.find((field) => field.name === fieldName)?.label
    showResourceValidationError(noun, fieldLabel, getFieldErrorMessage(error))
  }

  const title = mode === "create" ? `新增${noun}` : `编辑${noun}`
  const isLoadingRoleBinding =
    mode === "edit" && hasRoleField && roleIdsQuery.isLoading
  const isLoadingPostBinding =
    mode === "edit" && hasPostField && postIdsQuery.isLoading
  const isLoadingBinding = isLoadingRoleBinding || isLoadingPostBinding
  const isCompactForm =
    visibleFields.length <= 3 &&
    !visibleFields.some((field) =>
      ["dept-combobox", "post-multi-select", "role-multi-select"].includes(
        field.type
      )
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("gap-4", isCompactForm ? "sm:max-w-md" : "sm:max-w-3xl")}
      >
        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit(
            (formValues) => onSubmit(formValues),
            handleInvalidSubmit
          )}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? `填写信息后创建新的${noun}。`
                : `修改${noun}信息并保存到后台。`}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup
            className={cn(
              "grid max-h-[68vh] gap-y-3 overflow-y-auto p-1",
              !isCompactForm && "gap-x-4 md:grid-cols-2"
            )}
          >
            {visibleFields.map((field) => (
              <ResourceFieldControl
                key={field.name}
                field={field}
                mode={mode}
                recordId={recordId}
                error={form.formState.errors[field.name] as HookFormFieldError}
                register={form.register}
                watch={form.watch}
                setValue={form.setValue}
                disabled={isSubmitting || isLoadingBinding}
                useMultiColumn={!isCompactForm}
              />
            ))}
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isLoadingBinding}
              >
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || isLoadingBinding}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              {mode === "create" ? "创建" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function getFieldErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === "string" ? message : undefined
  }

  return undefined
}
