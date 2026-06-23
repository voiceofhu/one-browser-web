"use client"

/* eslint-disable react-refresh/only-export-components */
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import {
  setDictDataDefault,
  setDictDataStatus,
  setDictTypeStatus,
} from "@/api/system/dict"
import { setDeptStatus } from "@/api/system/dept"
import { setMenuStatus } from "@/api/system/menu"
import { setNoticeStatus } from "@/api/system/notice"
import { setPostStatus } from "@/api/system/post"
import { setRoleStatus } from "@/api/system/role"
import { setUserStatus } from "@/api/system/user"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/components/providers/language-context"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useAuthPermissions } from "@/hooks/use-auth"
import { hasPermission } from "@/lib/auth-permissions"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { translate, type Locale } from "@/local"
import { translateText } from "@/local"
import { systemQueryKeys } from "@/lib/query-keys"

import {
  DATA_SCOPE_LABELS,
  getLabel,
  NOTICE_TYPE_LABELS,
  SEX_LABELS,
  VISIBLE_LABELS,
} from "@/router/routes"
import type {
  DeptResource,
  DictDataResource,
  DictTypeResource,
  HealthResponse,
  MenuResource,
  NoticeSummaryResource,
  PageResponse,
  PostResource,
  RoleResource,
  StatusFlag,
  UserResource,
} from "@/types/admin"
import { ResourceTableColumnHeader } from "./table"
import { showResourceError } from "./toast"

export const userColumns: ColumnDef<UserResource>[] = [
  textColumn("user_name", "用户名"),
  textColumn("nick_name", "昵称"),
  textColumn("email", "邮箱"),
  textColumn("phone_number", "手机号"),
  {
    accessorKey: "sex",
    header: ({ column }) => tableHeader(column, "性别"),
    cell: ({ row }) => (
      <TranslatedBadge label={getLabel(SEX_LABELS, row.original.sex)} />
    ),
    meta: { label: "性别" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <UserStatusSwitch user={row.original} />,
    meta: { label: "状态" },
  },
  {
    accessorKey: "login_at",
    header: ({ column }) => tableHeader(column, "最近登录"),
    cell: ({ row }) => <DateCell value={row.original.login_at} />,
    meta: { label: "最近登录" },
  },
  dateColumn("created_at", "创建时间"),
]

export const roleColumns: ColumnDef<RoleResource>[] = [
  textColumn("role_name", "角色名称"),
  textColumn("role_key", "权限标识"),
  numberColumn("role_sort", "排序"),
  {
    accessorKey: "data_scope",
    header: ({ column }) => tableHeader(column, "数据范围"),
    cell: ({ row }) => (
      <TranslatedBadge
        label={getLabel(DATA_SCOPE_LABELS, row.original.data_scope)}
      />
    ),
    meta: { label: "数据范围" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <RoleStatusSwitch role={row.original} />,
    meta: { label: "状态" },
  },
  dateColumn("created_at", "创建时间"),
]

export const menuColumns: ColumnDef<MenuResource>[] = [
  {
    accessorKey: "menu_name",
    header: ({ column }) => tableHeader(column, "权限名称"),
    cell: ({ row }) => <MenuNameCell menu={row.original} />,
    meta: { label: "权限名称", cellClassName: "min-w-72 max-w-96" },
  },
  numberColumn("order_num", "排序"),
  textColumn("path", "路由路径"),
  textColumn("perms", "权限标识"),
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <MenuStatusSwitch menu={row.original} />,
    meta: { label: "状态" },
  },
  dateColumn("created_at", "创建时间"),
]

export const deptColumns: ColumnDef<DeptResource>[] = [
  textColumn("dept_name", "部门名称", "min-w-72 max-w-96"),
  textColumn("leader", "负责人"),
  textColumn("phone", "电话"),
  textColumn("email", "邮箱"),
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <DeptStatusSwitch dept={row.original} />,
    meta: { label: "状态" },
  },
  dateColumn("created_at", "创建时间"),
]

export const postColumns: ColumnDef<PostResource>[] = [
  textColumn("post_name", "岗位名称"),
  textColumn("post_code", "岗位编码"),
  numberColumn("post_sort", "排序"),
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <PostStatusSwitch post={row.original} />,
    meta: { label: "状态" },
  },
  dateColumn("created_at", "创建时间"),
  textColumn("remark", "备注", "max-w-64", "-"),
]

export const dictTypeColumns: ColumnDef<DictTypeResource>[] = [
  textColumn("dict_name", "字典类型"),
  textColumn("dict_type", "字典代码"),
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <DictTypeStatusSwitch dictType={row.original} />,
    meta: { label: "状态" },
  },
  textColumn("remark", "备注", "max-w-64", "-"),
]

export const dictDataColumns: ColumnDef<DictDataResource>[] = [
  textColumn("dict_label", "字典标签"),
  textColumn("dict_value", "字典键值"),
  textColumn("dict_type", "字典类型"),
  {
    accessorKey: "is_default",
    header: ({ column }) => tableHeader(column, "默认"),
    cell: ({ row }) => <DictDataDefaultRadio dictData={row.original} />,
    meta: { label: "默认" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <DictDataStatusSwitch dictData={row.original} />,
    meta: { label: "状态" },
  },
  textColumn("remark", "备注", "max-w-64", "-"),
]

export const noticeColumns: ColumnDef<NoticeSummaryResource>[] = [
  textColumn("notice_title", "通知标题", "min-w-52 max-w-80"),
  {
    accessorKey: "notice_type",
    header: ({ column }) => tableHeader(column, "通知类型"),
    cell: ({ row }) => (
      <TranslatedBadge
        label={getLabel(NOTICE_TYPE_LABELS, row.original.notice_type)}
      />
    ),
    meta: { label: "通知类型" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <NoticeStatusSwitch notice={row.original} />,
    meta: { label: "状态" },
  },
  textColumn("created_by", "创建人"),
  dateColumn("created_at", "创建时间"),
  dateColumn("updated_at", "更新时间"),
]

export function DependencyHealthBody({ health }: { health?: HealthResponse }) {
  const { locale } = useTranslation()

  if (!health) {
    return translateText(locale, "等待健康检查返回。")
  }

  return (
    <div className="grid gap-2">
      <div>Postgres：{health.postgres}</div>
      <div>SeaORM：{health.sea_orm}</div>
      <div>Redis：{health.redis}</div>
    </div>
  )
}

function textColumn<TData, TKey extends keyof TData & string>(
  key: TKey,
  label: string,
  cellClassName = "max-w-64",
  emptyText = "-"
): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => (
      <TextCell value={getValue()} emptyText={emptyText} />
    ),
    meta: { label, cellClassName },
  }
}

function numberColumn<TData, TKey extends keyof TData & string>(
  key: TKey,
  label: string
): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => <TextCell value={getValue()} />,
    meta: { label },
  }
}

function dateColumn<
  TData extends Record<TKey, string | null>,
  TKey extends keyof TData & string,
>(key: TKey, label: string): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
    meta: { label },
  }
}

function tableHeader<TData, TValue>(
  column: Parameters<
    typeof ResourceTableColumnHeader<TData, TValue>
  >[0]["column"],
  title: string
) {
  return <ResourceTableColumnHeader column={column} title={title} />
}

function ResourceStatusSwitch({
  checked,
  disabled,
  label,
  onCheckedChange,
}: {
  checked: boolean
  disabled: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center">
      <Switch
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}

function showStatusSuccess(
  name: string,
  noun: string,
  status: StatusFlag,
  locale: Locale
) {
  toast.success(
    translate(locale, "resource.statusChanged", {
      name,
      noun: translateText(locale, noun),
      status: translateText(locale, status === "0" ? "已启用" : "已禁用"),
    })
  )
}

function getStatusSwitchLabel(
  locale: Locale,
  enabled: boolean,
  noun: string,
  name: string
) {
  if (locale === "en-US") {
    return `${enabled ? "Disable" : "Enable"} ${translateText(locale, noun)} ${name}`
  }

  const action = enabled ? "禁用" : "启用"
  return `${translateText(locale, action)} ${translateText(locale, noun)} ${name}`
}

function TranslatedBadge({ label }: { label: string }) {
  const { locale } = useTranslation()

  return <Badge variant="outline">{translateText(locale, label)}</Badge>
}

function MenuNameCell({ menu }: { menu: MenuResource }) {
  const { locale } = useTranslation()

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate">{menu.menu_name}</span>
      <Badge
        variant={menu.visible === "0" ? "secondary" : "destructive"}
        className="shrink-0"
      >
        {translateText(locale, getLabel(VISIBLE_LABELS, menu.visible))}
      </Badge>
    </div>
  )
}

function UserStatusSwitch({ user }: { user: UserResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const { locale } = useTranslation()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setUserStatus(user.user_id, status),
    onSuccess: async (updatedUser) => {
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.users })
      showStatusSuccess(
        updatedUser.nick_name || updatedUser.user_name,
        "账号",
        updatedUser.status,
        locale
      )
    },
    onError: (error) => showResourceError(error, locale),
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : user.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:user:status"
  )

  return (
    <ResourceStatusSwitch
      checked={enabled}
      disabled={!canChangeStatus || user.is_super_admin || mutation.isPending}
      label={getStatusSwitchLabel(
        locale,
        enabled,
        "账号",
        user.nick_name || user.user_name
      )}
      onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
    />
  )
}

function RoleStatusSwitch({ role }: { role: RoleResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const { locale } = useTranslation()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setRoleStatus(role, status),
    onSuccess: async (updatedRole) => {
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.roles })
      showStatusSuccess(
        updatedRole.role_name,
        "角色",
        updatedRole.status,
        locale
      )
    },
    onError: (error) => showResourceError(error, locale),
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : role.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:role:status"
  )

  return (
    <ResourceStatusSwitch
      checked={enabled}
      disabled={!canChangeStatus || mutation.isPending}
      label={getStatusSwitchLabel(locale, enabled, "角色", role.role_name)}
      onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
    />
  )
}

function MenuStatusSwitch({ menu }: { menu: MenuResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const { locale } = useTranslation()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setMenuStatus(menu, status),
    onSuccess: async (updatedMenu) => {
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.menus })
      showStatusSuccess(
        updatedMenu.menu_name,
        "权限",
        updatedMenu.status,
        locale
      )
    },
    onError: (error) => showResourceError(error, locale),
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : menu.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:menu:status"
  )

  return (
    <ResourceStatusSwitch
      checked={enabled}
      disabled={!canChangeStatus || mutation.isPending}
      label={getStatusSwitchLabel(locale, enabled, "权限", menu.menu_name)}
      onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
    />
  )
}

function DeptStatusSwitch({ dept }: { dept: DeptResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const { locale } = useTranslation()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setDeptStatus(dept, status),
    onSuccess: async (updatedDept) => {
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.depts })
      showStatusSuccess(
        updatedDept.dept_name,
        "部门",
        updatedDept.status,
        locale
      )
    },
    onError: (error) => showResourceError(error, locale),
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : dept.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:dept:status"
  )

  return (
    <ResourceStatusSwitch
      checked={enabled}
      disabled={!canChangeStatus || mutation.isPending}
      label={getStatusSwitchLabel(locale, enabled, "部门", dept.dept_name)}
      onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
    />
  )
}

function PostStatusSwitch({ post }: { post: PostResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const { locale } = useTranslation()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setPostStatus(post, status),
    onSuccess: async (updatedPost) => {
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.posts })
      showStatusSuccess(
        updatedPost.post_name,
        "岗位",
        updatedPost.status,
        locale
      )
    },
    onError: (error) => showResourceError(error, locale),
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : post.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:post:status"
  )

  return (
    <ResourceStatusSwitch
      checked={enabled}
      disabled={!canChangeStatus || mutation.isPending}
      label={getStatusSwitchLabel(locale, enabled, "岗位", post.post_name)}
      onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
    />
  )
}

function DictTypeStatusSwitch({ dictType }: { dictType: DictTypeResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const { locale } = useTranslation()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setDictTypeStatus(dictType, status),
    onSuccess: async (updatedDictType) => {
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.dictTypes,
      })
      showStatusSuccess(
        updatedDictType.dict_name,
        "字典类型",
        updatedDictType.status,
        locale
      )
    },
    onError: (error) => showResourceError(error, locale),
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : dictType.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:dict:status"
  )

  return (
    <ResourceStatusSwitch
      checked={enabled}
      disabled={!canChangeStatus || mutation.isPending}
      label={getStatusSwitchLabel(
        locale,
        enabled,
        "字典类型",
        dictType.dict_name
      )}
      onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
    />
  )
}

function DictDataDefaultRadio({ dictData }: { dictData: DictDataResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const { locale, t } = useTranslation()
  const mutation = useMutation({
    mutationFn: () => setDictDataDefault(dictData, "Y"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: systemQueryKeys.dictData })
      const snapshots = queryClient.getQueriesData<
        PageResponse<DictDataResource>
      >({
        queryKey: systemQueryKeys.dictData,
      })

      for (const [queryKey, data] of snapshots) {
        if (!data) {
          continue
        }

        queryClient.setQueryData<PageResponse<DictDataResource>>(queryKey, {
          ...data,
          list: data.list.map((item) =>
            item.dict_type === dictData.dict_type
              ? {
                  ...item,
                  is_default: item.dict_code === dictData.dict_code ? "Y" : "N",
                }
              : item
          ),
        })
      }

      return { snapshots }
    },
    onSuccess: async (updatedDictData) => {
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.dictData,
      })
      toast.success(
        t("resource.defaultSet", { name: updatedDictData.dict_label })
      )
    },
    onError: (error, _variables, context) => {
      for (const [queryKey, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(queryKey, data)
      }
      showResourceError(error, locale)
    },
  })
  const checked = mutation.isPending ? true : dictData.is_default === "Y"
  const canUpdate = hasPermission(
    authPermissions.data,
    "system:dict:data:update"
  )
  const value = String(dictData.dict_code)

  return (
    <div className="flex items-center">
      <RadioGroup
        value={checked ? value : ""}
        className="inline-flex w-auto gap-0"
        aria-label={t("resource.setDefault", { name: dictData.dict_label })}
        onValueChange={() => {
          if (!checked) {
            mutation.mutate()
          }
        }}
      >
        <RadioGroupItem
          value={value}
          disabled={!canUpdate || mutation.isPending}
          aria-label={t("resource.setDefault", { name: dictData.dict_label })}
        />
      </RadioGroup>
    </div>
  )
}

function DictDataStatusSwitch({ dictData }: { dictData: DictDataResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const { locale } = useTranslation()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setDictDataStatus(dictData, status),
    onSuccess: async (updatedDictData) => {
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.dictData,
      })
      showStatusSuccess(
        updatedDictData.dict_label,
        "字典数据",
        updatedDictData.status,
        locale
      )
    },
    onError: (error) => showResourceError(error, locale),
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : dictData.status === "0"
  const canUpdate = hasPermission(
    authPermissions.data,
    "system:dict:data:update"
  )

  return (
    <ResourceStatusSwitch
      checked={enabled}
      disabled={!canUpdate || mutation.isPending}
      label={getStatusSwitchLabel(
        locale,
        enabled,
        "字典数据",
        dictData.dict_label
      )}
      onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
    />
  )
}

function NoticeStatusSwitch({ notice }: { notice: NoticeSummaryResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const { locale } = useTranslation()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setNoticeStatus(notice, status),
    onSuccess: async (updatedNotice) => {
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.notices,
      })
      showStatusSuccess(
        updatedNotice.notice_title,
        "通知",
        updatedNotice.status,
        locale
      )
    },
    onError: (error) => showResourceError(error, locale),
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : notice.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:notice:status"
  )

  return (
    <ResourceStatusSwitch
      checked={enabled}
      disabled={!canChangeStatus || mutation.isPending}
      label={getStatusSwitchLabel(locale, enabled, "通知", notice.notice_title)}
      onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
    />
  )
}

function TextCell({
  value,
  emptyText = "-",
}: {
  value: unknown
  emptyText?: string
}) {
  const text = value == null || value === "" ? emptyText : String(value)

  return <span className="block truncate">{text}</span>
}

function DateCell({ value }: { value: string | null }) {
  const { locale } = useTranslation()
  const never = translateText(locale, "从未")

  if (!value) {
    return <span className="text-muted-foreground">{never}</span>
  }

  return (
    <span title={formatAbsoluteDateTime(value)}>
      {formatRelativeTime(value, never)}
    </span>
  )
}
