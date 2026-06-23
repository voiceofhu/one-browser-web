"use client"

import * as React from "react"
import { HelpCircleIcon } from "lucide-react"
import { useForm, type FieldError as HookFormFieldError } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError as FieldErrorMessage,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Locale } from "@/local"
import { translate } from "@/local"
import { translateText } from "@/local"
import { cn } from "@/lib/utils"
import type { DeptResource, MenuTypeFlag } from "@/types/admin"
import type {
  ResourceField,
  ResourceFormMode,
  ResourceFormValues,
} from "./form"
import { DeptParentSelect } from "./dept-parent-select"
import { MenuIconSelect } from "./menu-icon-select"
import { MenuParentSelect } from "./menu-parent-select"
import { PostMultiSelect, RoleMultiSelect } from "./role-multi-select"
import { RoleMenuPermissionTree } from "./role-menu-permission-tree"

type ResourceFieldControlProps = {
  field: ResourceField
  mode: ResourceFormMode
  recordId?: number
  error?: HookFormFieldError
  disabled: boolean
  register: ReturnType<typeof useForm<ResourceFormValues>>["register"]
  watch: ReturnType<typeof useForm<ResourceFormValues>>["watch"]
  setValue: ReturnType<typeof useForm<ResourceFormValues>>["setValue"]
  useMultiColumn: boolean
  locale: Locale
}

const MENU_PARENT_TYPES = {
  M: ["M"],
  C: ["M"],
  F: ["C"],
} satisfies Record<MenuTypeFlag, MenuTypeFlag[]>

export function ResourceFieldControl({
  field,
  mode,
  recordId,
  error,
  disabled,
  register,
  watch,
  setValue,
  useMultiColumn,
  locale,
}: ResourceFieldControlProps) {
  const controlId = `dashboard-field-${field.name}`
  const isDisabled =
    disabled || (mode === "edit" && field.disabledOnEdit === true)
  const invalid = Boolean(error)
  const fieldClassName = cn(
    useMultiColumn &&
      (field.type === "textarea" || field.colSpan === "full") &&
      "md:col-span-2",
    field.type === "dept-parent-select" &&
      "has-[>[data-dept-parent-empty=true]]:hidden"
  )

  if (field.type === "switch" || field.type === "status-switch") {
    const rawChecked =
      field.type === "status-switch"
        ? watch(field.name) === "0"
        : Boolean(watch(field.name))
    const checked = field.invertBoolean ? !rawChecked : rawChecked

    return (
      <Field
        orientation="horizontal"
        data-invalid={invalid}
        data-disabled={isDisabled}
        className={`${fieldClassName ?? ""} min-h-9 justify-between rounded-md border px-3`}
      >
        <RequiredFieldLabel
          htmlFor={controlId}
          label={translateText(locale, field.label)}
          required={field.required}
          tooltip={
            field.tooltip ? translateText(locale, field.tooltip) : undefined
          }
          locale={locale}
        />
        <Switch
          id={controlId}
          checked={checked}
          disabled={isDisabled}
          aria-invalid={invalid}
          onCheckedChange={(value) =>
            setValue(
              field.name,
              field.type === "status-switch"
                ? value
                  ? "0"
                  : "1"
                : field.invertBoolean
                  ? !value
                  : value,
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
      {field.hideLabel ? null : (
        <RequiredFieldLabel
          htmlFor={controlId}
          label={translateText(locale, field.label)}
          required={field.required}
          tooltip={
            field.tooltip ? translateText(locale, field.tooltip) : undefined
          }
          locale={locale}
        />
      )}
      {renderControl({
        field,
        mode,
        locale,
        controlId,
        recordId,
        invalid,
        isDisabled,
        register,
        watch,
        setValue,
      })}
      {field.description ? (
        <FieldDescription>
          {translateText(locale, field.description)}
        </FieldDescription>
      ) : null}
      <FieldErrorMessage errors={[error]} />
    </Field>
  )
}

function renderControl({
  field,
  mode,
  locale,
  controlId,
  recordId,
  invalid,
  isDisabled,
  register,
  watch,
  setValue,
}: {
  field: ResourceField
  mode: ResourceFormMode
  locale: Locale
  controlId: string
  recordId?: number
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
          <SelectValue
            placeholder={
              field.placeholder
                ? translateText(locale, field.placeholder)
                : translate(locale, "resource.selectPlaceholder")
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {translateText(locale, option.label)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (field.type === "menu-type-tabs") {
    const currentType = normalizeMenuType(watch(field.name))

    return (
      <Tabs
        value={currentType}
        aria-label={field.label}
        className="w-full sm:w-fit"
        onValueChange={(value) => {
          const nextType = normalizeMenuType(value)
          const previousType = normalizeMenuType(watch(field.name))

          setValue(field.name, nextType, {
            shouldDirty: true,
            shouldValidate: true,
          })

          if (nextType !== previousType) {
            setValue("parent_id", null, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }

          if (nextType === "F") {
            setValue("path", "", { shouldDirty: true, shouldValidate: true })
            setValue("icon", "#", { shouldDirty: true, shouldValidate: true })
            setValue("visible", "1", {
              shouldDirty: true,
              shouldValidate: true,
            })
          } else {
            setValue("visible", "0", {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-3 sm:w-fit">
          {field.options?.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              disabled={isDisabled}
              className="px-4"
            >
              {translateText(locale, option.label)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    )
  }

  if (field.type === "radio") {
    const optionCount = field.options?.length ?? 0
    const optionValues = field.options?.map((option) => option.value) ?? []
    const rawValue = String(watch(field.name) ?? "")
    const value = optionValues.includes(rawValue)
      ? rawValue
      : getRadioFallbackValue(field, optionValues)

    return (
      <RadioGroup
        id={controlId}
        value={value}
        disabled={isDisabled}
        aria-invalid={invalid}
        className={cn(
          "grid gap-2",
          optionCount <= 2 ? "grid-cols-2" : "grid-cols-3"
        )}
        onValueChange={(value) =>
          setValue(field.name, value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      >
        {field.options?.map((option) => {
          const itemId = `${controlId}-${option.value}`

          return (
            <label
              key={option.value}
              htmlFor={itemId}
              className="flex h-8 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5"
            >
              <RadioGroupItem
                id={itemId}
                value={option.value}
                disabled={isDisabled}
                aria-invalid={invalid}
              />
              <span>{translateText(locale, option.label)}</span>
            </label>
          )
        })}
      </RadioGroup>
    )
  }

  if (field.type === "dept-combobox") {
    return (
      <DeptParentSelect
        controlId={controlId}
        value={watch(field.name)}
        invalid={invalid}
        disabled={isDisabled}
        placeholder={
          field.placeholder
            ? translateText(locale, field.placeholder)
            : translate(locale, "resource.selectDept")
        }
        title={translate(locale, "resource.selectDept")}
        onChange={(dept) =>
          setValue(field.name, dept?.dept_id ?? null, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    )
  }

  if (field.type === "dept-parent-select") {
    return (
      <DeptParentSelect
        controlId={controlId}
        value={watch(field.name)}
        currentDeptId={recordId}
        invalid={invalid}
        disabled={isDisabled}
        placeholder={
          field.placeholder
            ? translateText(locale, field.placeholder)
            : translate(locale, "resource.selectParentDept")
        }
        hideWhenEmpty
        onChange={(dept) => {
          setValue(field.name, dept?.dept_id ?? null, {
            shouldDirty: true,
            shouldValidate: true,
          })
          setValue("ancestors", getDeptAncestors(dept), {
            shouldDirty: true,
            shouldValidate: true,
          })
        }}
      />
    )
  }

  if (field.type === "menu-parent-select") {
    const menuType = normalizeMenuType(watch("menu_type"))

    return (
      <MenuParentSelect
        controlId={controlId}
        value={watch(field.name)}
        currentMenuId={mode === "edit" ? recordId : undefined}
        invalid={invalid}
        disabled={isDisabled}
        placeholder={menuParentPlaceholder(menuType, locale, field.placeholder)}
        allowedTypes={MENU_PARENT_TYPES[menuType]}
        allowEmpty={menuType !== "F"}
        emptyLabel={translate(locale, "resource.topPermission")}
        onChange={(menu) =>
          setValue(field.name, menu?.menu_id ?? null, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    )
  }

  if (field.type === "menu-icon-select") {
    return (
      <MenuIconSelect
        controlId={controlId}
        value={watch(field.name)}
        invalid={invalid}
        disabled={isDisabled}
        onChange={(icon) =>
          setValue(field.name, icon, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    )
  }

  if (field.type === "menu-permission-tree") {
    const value = watch(field.name)
    const menuIds = Array.isArray(value)
      ? value.filter((item): item is number => typeof item === "number")
      : []

    return (
      <RoleMenuPermissionTree
        value={menuIds}
        roleId={mode === "edit" ? recordId : undefined}
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
        placeholder={
          field.placeholder
            ? translateText(locale, field.placeholder)
            : undefined
        }
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
      placeholder={
        field.placeholder ? translateText(locale, field.placeholder) : undefined
      }
      {...register(field.name, {
        setValueAs:
          field.type === "number"
            ? (value) => (value === "" ? null : Number(value))
            : undefined,
      })}
    />
  )
}

function RequiredFieldLabel({
  label,
  required,
  tooltip,
  locale,
  ...props
}: Omit<React.ComponentProps<typeof FieldLabel>, "children"> & {
  label: string
  required?: boolean
  tooltip?: string
  locale: Locale
}) {
  return (
    <div className="flex w-fit items-center gap-1.5">
      <FieldLabel {...props}>
        {required ? <span className="text-destructive">*</span> : null}
        {label}
      </FieldLabel>
      {tooltip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="-my-1 text-muted-foreground"
                aria-label={translate(locale, "resource.fieldHelp", { label })}
              >
                <HelpCircleIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </div>
  )
}

function getDeptAncestors(parentDept: DeptResource | null) {
  if (!parentDept) {
    return "0"
  }

  const parentAncestors = parentDept.ancestors.trim()
  return parentAncestors
    ? `${parentAncestors},${parentDept.dept_id}`
    : `0,${parentDept.dept_id}`
}

function getRadioFallbackValue(
  field: ResourceField,
  optionValues: string[]
): string {
  if (field.name === "sex" && optionValues.includes("2")) {
    return "2"
  }

  return optionValues[0] ?? ""
}

function normalizeMenuType(value: unknown): MenuTypeFlag {
  if (value === "C" || value === "F") {
    return value
  }

  return "M"
}

function menuParentPlaceholder(
  menuType: MenuTypeFlag,
  locale: Locale,
  fallback?: string
): string {
  if (menuType === "F") {
    return translate(locale, "resource.selectParentMenu")
  }

  if (menuType === "C") {
    return translate(locale, "resource.selectParentDirectory")
  }

  return fallback
    ? translateText(locale, fallback)
    : translate(locale, "resource.selectParentPermission")
}
