"use client"

import { useQuery } from "@tanstack/react-query"

import { listRoles } from "@/api/system/role"
import { useTranslation } from "@/components/providers/language-context"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { translateAdminText } from "@/local"
import { systemQueryKeys } from "@/lib/query-keys"

type RoleSelectProps = {
  value: number | null
  disabled?: boolean
  invalid?: boolean
  onChange: (value: number) => void
}

export function RoleSelect({
  value,
  disabled = false,
  invalid = false,
  onChange,
}: RoleSelectProps) {
  const { locale } = useTranslation()
  const rolesQuery = useQuery({
    queryKey: [...systemQueryKeys.roles, "selector"],
    queryFn: () =>
      listRoles({ page: 1, page_size: 100, assignable_only: true }),
    staleTime: 30_000,
  })
  const roles = (rolesQuery.data?.list ?? []).filter((role) => !role.protected)
  const placeholder = rolesQuery.isLoading
    ? translateAdminText(locale, "正在加载角色...")
    : rolesQuery.isError
      ? translateAdminText(locale, "角色加载失败，请稍后重试。")
      : translateAdminText(locale, "请选择角色")

  return (
    <Select
      value={value == null ? "" : String(value)}
      disabled={disabled || rolesQuery.isLoading || rolesQuery.isError}
      onValueChange={(nextValue) => onChange(Number(nextValue))}
    >
      <SelectTrigger className="w-full" aria-invalid={invalid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {roles.map((role) => (
            <SelectItem
              key={role.role_id}
              value={String(role.role_id)}
              disabled={role.status !== "0"}
            >
              {role.role_name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
