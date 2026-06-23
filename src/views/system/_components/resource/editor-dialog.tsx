"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
  type FieldError as HookFormFieldError,
  type FieldErrors,
  type Resolver,
} from "react-hook-form"
import type { ZodType } from "zod"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
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
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

import { getUserPostIds, getUserRoleIds } from "@/api/system/user"
import { formatResourceActionText, translateText } from "@/lib/i18n-text"
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
  const { locale, t } = useTranslation()
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(schema as never) as Resolver<ResourceFormValues>,
    defaultValues: values,
  })
  const { reset } = form
  const watchedValues = useWatch({ control: form.control })
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
    showResourceValidationError(
      noun,
      fieldLabel,
      getFieldErrorMessage(error),
      locale
    )
  }

  const title =
    mode === "create"
      ? formatResourceActionText(locale, "create", noun)
      : formatResourceActionText(locale, "edit", noun)
  const translatedNoun = translateText(locale, noun)
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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        className={cn("gap-4", isCompactForm ? "sm:max-w-md" : "sm:max-w-3xl")}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <form
          className="flex min-h-0 flex-1 flex-col gap-0 md:gap-3"
          onSubmit={form.handleSubmit(
            (formValues) => onSubmit(formValues),
            handleInvalidSubmit
          )}
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {mode === "create"
                ? t("resource.createDialogDescription", {
                    noun: translatedNoun,
                  })
                : t("resource.editDialogDescription", {
                    noun: translatedNoun,
                  })}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <ResponsiveDialogBody>
            <FieldGroup
              className={cn(
                "grid gap-y-3 p-1 md:max-h-[68vh] md:overflow-y-auto",
                !isCompactForm && "gap-x-4 md:grid-cols-2"
              )}
            >
              {visibleFields.map((field) => (
                <ResourceFieldControl
                  key={field.name}
                  field={field}
                  mode={mode}
                  recordId={recordId}
                  error={
                    form.formState.errors[field.name] as HookFormFieldError
                  }
                  register={form.register}
                  watch={form.watch}
                  setValue={form.setValue}
                  disabled={isSubmitting || isLoadingBinding}
                  useMultiColumn={!isCompactForm}
                  locale={locale}
                />
              ))}
            </FieldGroup>
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isLoadingBinding}
              >
                {t("common.cancel")}
              </Button>
            </ResponsiveDialogClose>
            <Button type="submit" disabled={isSubmitting || isLoadingBinding}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              {mode === "create" ? t("common.create") : t("common.save")}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function getFieldErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === "string" ? message : undefined
  }

  return undefined
}
