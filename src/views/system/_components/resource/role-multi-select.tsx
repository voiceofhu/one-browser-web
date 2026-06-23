"use client"

import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronsUpDownIcon } from "lucide-react"

import { listPosts } from "@/api/system/post"
import { listRoles } from "@/api/system/role"
import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { translateAdminText } from "@/local"
import { systemQueryKeys } from "@/lib/query-keys"

type BindingMultiSelectProps = {
  value: number[]
  disabled?: boolean
  invalid?: boolean
  onChange: (value: number[]) => void
}

export function RoleMultiSelect({
  value,
  disabled = false,
  invalid = false,
  onChange,
}: BindingMultiSelectProps) {
  const { locale } = useTranslation()
  const rolesQuery = useQuery({
    queryKey: [...systemQueryKeys.roles, "selector"],
    queryFn: () => listRoles({ page: 1, page_size: 100 }),
    staleTime: 30_000,
  })
  const roles = (rolesQuery.data?.list ?? []).filter(
    (role) => role.status === "0"
  )

  return (
    <BindingMultiSelect
      value={value}
      disabled={disabled}
      invalid={invalid}
      loading={rolesQuery.isLoading}
      error={rolesQuery.isError}
      loadingLabel={translateAdminText(locale, "正在加载角色...")}
      emptyLabel={translateAdminText(locale, "请选择角色")}
      errorLabel={translateAdminText(locale, "角色加载失败，请稍后重试。")}
      items={roles.map((role) => ({
        id: role.role_id,
        label: role.role_name,
      }))}
      optionIdPrefix="role"
      onChange={onChange}
    />
  )
}

export function PostMultiSelect({
  value,
  disabled = false,
  invalid = false,
  onChange,
}: BindingMultiSelectProps) {
  const { locale } = useTranslation()
  const postsQuery = useQuery({
    queryKey: [...systemQueryKeys.posts, "selector"],
    queryFn: () => listPosts({ page: 1, page_size: 100 }),
    staleTime: 30_000,
  })
  const posts = (postsQuery.data?.list ?? []).filter(
    (post) => post.status === "0"
  )

  return (
    <BindingMultiSelect
      value={value}
      disabled={disabled}
      invalid={invalid}
      loading={postsQuery.isLoading}
      error={postsQuery.isError}
      loadingLabel={translateAdminText(locale, "正在加载岗位...")}
      emptyLabel={translateAdminText(locale, "请选择岗位")}
      errorLabel={translateAdminText(locale, "岗位加载失败，请稍后重试。")}
      items={posts.map((post) => ({
        id: post.post_id,
        label: post.post_name,
      }))}
      optionIdPrefix="post"
      onChange={onChange}
    />
  )
}

function BindingMultiSelect({
  value,
  disabled = false,
  invalid = false,
  loading,
  error,
  loadingLabel,
  emptyLabel,
  errorLabel,
  items,
  optionIdPrefix,
  onChange,
}: BindingMultiSelectProps & {
  loading: boolean
  error: boolean
  loadingLabel: string
  emptyLabel: string
  errorLabel: string
  items: Array<{ id: number; label: ReactNode }>
  optionIdPrefix: string
}) {
  const selectedLabels = items
    .filter((item) => value.includes(item.id))
    .map((item) => item.label)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || loading}
          aria-invalid={invalid}
          className="w-full justify-between font-normal"
        >
          <span className="truncate text-left">
            {loading
              ? loadingLabel
              : selectedLabels.length > 0
                ? selectedLabels
                    .map((label) =>
                      typeof label === "string" ? label : String(label)
                    )
                    .join("、")
                : emptyLabel}
          </span>
          {loading ? (
            <Spinner data-icon="inline-end" />
          ) : (
            <ChevronsUpDownIcon data-icon="inline-end" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        {error ? (
          <p className="text-sm text-destructive">{errorLabel}</p>
        ) : (
          <FieldGroup className="max-h-64 gap-2 overflow-y-auto">
            {items.map((item) => {
              const checked = value.includes(item.id)
              const optionId = `${optionIdPrefix}-option-${item.id}`

              return (
                <Field key={item.id} orientation="horizontal">
                  <Checkbox
                    id={optionId}
                    checked={checked}
                    onCheckedChange={(nextChecked) => {
                      onChange(
                        nextChecked === true
                          ? [...value, item.id]
                          : value.filter((selectedId) => selectedId !== item.id)
                      )
                    }}
                  />
                  <FieldLabel htmlFor={optionId}>{item.label}</FieldLabel>
                </Field>
              )
            })}
          </FieldGroup>
        )}
      </PopoverContent>
    </Popover>
  )
}
