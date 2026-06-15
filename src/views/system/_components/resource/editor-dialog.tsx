"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  type FieldError as HookFormFieldError,
  type Resolver,
} from "react-hook-form"
import type { ZodType } from "zod"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError as FieldErrorMessage,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { getDept, listDepts } from "@/api/system/dept"
import { getUserPostIds, getUserRoleIds } from "@/api/system/user"
import { systemQueryKeys } from "@/lib/query-keys"
import type { DeptResource } from "@/types/admin"
import type {
  ResourceField,
  ResourceFormMode,
  ResourceFormValues,
} from "./form"
import { PostMultiSelect, RoleMultiSelect } from "./role-multi-select"

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
    (field) => !(mode === "edit" && field.hiddenOnEdit)
  )
  const title = mode === "create" ? `新增${noun}` : `编辑${noun}`
  const isLoadingRoleBinding =
    mode === "edit" && hasRoleField && roleIdsQuery.isLoading
  const isLoadingPostBinding =
    mode === "edit" && hasPostField && postIdsQuery.isLoading
  const isLoadingBinding = isLoadingRoleBinding || isLoadingPostBinding

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-3xl">
        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit((formValues) => onSubmit(formValues))}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? `填写信息后创建新的${noun}。`
                : `修改${noun}信息并保存到后台。`}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="grid max-h-[68vh] gap-x-4 gap-y-3 overflow-y-auto pr-1 md:grid-cols-2">
            {visibleFields.map((field) => (
              <ResourceFieldControl
                key={field.name}
                field={field}
                mode={mode}
                error={form.formState.errors[field.name] as HookFormFieldError}
                register={form.register}
                watch={form.watch}
                setValue={form.setValue}
                disabled={isSubmitting || isLoadingBinding}
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

type ResourceFieldControlProps = {
  field: ResourceField
  mode: ResourceFormMode
  error?: HookFormFieldError
  disabled: boolean
  register: ReturnType<typeof useForm<ResourceFormValues>>["register"]
  watch: ReturnType<typeof useForm<ResourceFormValues>>["watch"]
  setValue: ReturnType<typeof useForm<ResourceFormValues>>["setValue"]
}

function ResourceFieldControl({
  field,
  mode,
  error,
  disabled,
  register,
  watch,
  setValue,
}: ResourceFieldControlProps) {
  const controlId = `dashboard-field-${field.name}`
  const isDisabled =
    disabled || (mode === "edit" && field.disabledOnEdit === true)
  const invalid = Boolean(error)
  const fieldClassName = field.type === "textarea" ? "md:col-span-2" : undefined

  if (field.type === "switch" || field.type === "status-switch") {
    const checked =
      field.type === "status-switch"
        ? watch(field.name) === "0"
        : Boolean(watch(field.name))

    return (
      <Field
        orientation="horizontal"
        data-invalid={invalid}
        data-disabled={isDisabled}
        className={`${fieldClassName ?? ""} min-h-9 justify-between rounded-md border px-3`}
      >
        <FieldLabel htmlFor={controlId}>{field.label}</FieldLabel>
        <Switch
          id={controlId}
          checked={checked}
          disabled={isDisabled}
          aria-invalid={invalid}
          onCheckedChange={(value) =>
            setValue(
              field.name,
              field.type === "status-switch" ? (value ? "0" : "1") : value,
              {
                shouldDirty: true,
                shouldValidate: true,
              }
            )
          }
        />
        <FieldErrorMessage errors={[error]} />
      </Field>
    )
  }

  return (
    <Field
      data-invalid={invalid}
      data-disabled={isDisabled}
      className={fieldClassName}
    >
      <FieldLabel htmlFor={controlId}>{field.label}</FieldLabel>
      {renderControl({
        field,
        controlId,
        invalid,
        isDisabled,
        register,
        watch,
        setValue,
      })}
      {field.description ? (
        <FieldDescription>{field.description}</FieldDescription>
      ) : null}
      <FieldErrorMessage errors={[error]} />
    </Field>
  )
}

function renderControl({
  field,
  controlId,
  invalid,
  isDisabled,
  register,
  watch,
  setValue,
}: {
  field: ResourceField
  controlId: string
  invalid: boolean
  isDisabled: boolean
  register: ReturnType<typeof useForm<ResourceFormValues>>["register"]
  watch: ReturnType<typeof useForm<ResourceFormValues>>["watch"]
  setValue: ReturnType<typeof useForm<ResourceFormValues>>["setValue"]
}) {
  if (field.type === "select") {
    return (
      <Select
        value={String(watch(field.name) ?? "")}
        disabled={isDisabled}
        onValueChange={(value) =>
          setValue(field.name, value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      >
        <SelectTrigger id={controlId} className="w-full" aria-invalid={invalid}>
          <SelectValue placeholder={field.placeholder ?? "请选择"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (field.type === "dept-combobox") {
    return (
      <DeptCombobox
        controlId={controlId}
        value={watch(field.name)}
        invalid={invalid}
        disabled={isDisabled}
        placeholder={field.placeholder ?? "搜索部门名称"}
        onChange={(value) =>
          setValue(field.name, value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    )
  }

  if (field.type === "role-multi-select") {
    const value = watch(field.name)
    const roleIds = Array.isArray(value)
      ? value.filter((item): item is number => typeof item === "number")
      : []

    return (
      <RoleMultiSelect
        value={roleIds}
        disabled={isDisabled}
        invalid={invalid}
        onChange={(nextValue) =>
          setValue(field.name, nextValue, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    )
  }

  if (field.type === "post-multi-select") {
    const value = watch(field.name)
    const postIds = Array.isArray(value)
      ? value.filter((item): item is number => typeof item === "number")
      : []

    return (
      <PostMultiSelect
        value={postIds}
        disabled={isDisabled}
        invalid={invalid}
        onChange={(nextValue) =>
          setValue(field.name, nextValue, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    )
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        id={controlId}
        disabled={isDisabled}
        aria-invalid={invalid}
        placeholder={field.placeholder}
        className="min-h-16"
        {...register(field.name)}
      />
    )
  }

  return (
    <Input
      id={controlId}
      type={field.type}
      disabled={isDisabled}
      aria-invalid={invalid}
      placeholder={field.placeholder}
      {...register(field.name, {
        setValueAs:
          field.type === "number"
            ? (value) => (value === "" ? null : Number(value))
            : undefined,
      })}
    />
  )
}

function DeptCombobox({
  controlId,
  value,
  invalid,
  disabled,
  placeholder,
  onChange,
}: {
  controlId: string
  value: unknown
  invalid: boolean
  disabled: boolean
  placeholder: string
  onChange: (value: number | null) => void
}) {
  const deptId = typeof value === "number" ? value : null
  const [keyword, setKeyword] = React.useState("")
  const query = useQuery({
    queryKey: [...systemQueryKeys.depts, "combobox", keyword],
    queryFn: () => listDepts({ page: 1, page_size: 20, keyword }),
    staleTime: 30_000,
  })
  const selectedDeptQuery = useQuery({
    queryKey: [...systemQueryKeys.depts, "detail", deptId],
    queryFn: () => getDept(deptId ?? 0),
    enabled:
      deptId != null &&
      !query.data?.items.some((dept) => dept.dept_id === deptId),
    staleTime: 30_000,
  })
  const selectedDept = React.useMemo(() => {
    if (!deptId) {
      return null
    }

    return (
      query.data?.items.find((dept) => dept.dept_id === deptId) ??
      selectedDeptQuery.data ??
      ({
        dept_id: deptId,
        dept_name: `部门 ${deptId}`,
        parent_id: null,
        ancestors: "",
        order_num: 0,
        leader: null,
        phone: null,
        email: null,
        status: "0",
        created_at: "",
        updated_at: null,
      } satisfies DeptResource)
    )
  }, [deptId, query.data?.items, selectedDeptQuery.data])
  const items = React.useMemo(() => {
    const records = [...(query.data?.items ?? [])]
    if (
      selectedDept &&
      !records.some((dept) => dept.dept_id === selectedDept.dept_id)
    ) {
      records.unshift(selectedDept)
    }

    return records
  }, [query.data?.items, selectedDept])

  return (
    <Combobox
      items={items}
      value={selectedDept}
      disabled={disabled}
      itemToStringLabel={(dept) => dept.dept_name}
      itemToStringValue={(dept) => String(dept.dept_id)}
      isItemEqualToValue={(item, selected) => item.dept_id === selected.dept_id}
      onInputValueChange={(inputValue) => setKeyword(inputValue)}
      onValueChange={(dept) => onChange(dept?.dept_id ?? null)}
    >
      <ComboboxInput
        id={controlId}
        placeholder={placeholder}
        aria-invalid={invalid}
        showClear
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {query.isLoading ? "正在加载部门..." : "没有匹配部门"}
        </ComboboxEmpty>
        <ComboboxList>
          {(dept) => (
            <ComboboxItem key={dept.dept_id} value={dept}>
              <span className="truncate">{dept.dept_name}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
