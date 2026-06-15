"use client"

/* eslint-disable react-refresh/only-export-components */
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale/zh-CN"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { setUserStatus } from "@/api/system/user"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { systemQueryKeys } from "@/lib/query-keys"

import {
  DATA_SCOPE_LABELS,
  getLabel,
  MENU_TYPE_LABELS,
  SEX_LABELS,
  STATUS_LABELS,
  VISIBLE_LABELS,
  YES_NO_LABELS,
} from "@/router/routes"
import type {
  DeptResource,
  DictDataResource,
  DictTypeResource,
  HealthResponse,
  MenuResource,
  PostResource,
  RoleResource,
  StatusFlag,
  UserResource,
  YesNoFlag,
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
      <Badge variant="outline">{getLabel(SEX_LABELS, row.original.sex)}</Badge>
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
      <Badge variant="outline">
        {getLabel(DATA_SCOPE_LABELS, row.original.data_scope)}
      </Badge>
    ),
    meta: { label: "数据范围" },
  },
  booleanColumn("menu_check_strictly", "菜单严格"),
  booleanColumn("dept_check_strictly", "部门严格"),
  statusColumn(),
  dateColumn("created_at", "创建时间"),
]

export const menuColumns: ColumnDef<MenuResource>[] = [
  textColumn("menu_name", "菜单名称"),
  numberColumn("parent_id", "父级"),
  numberColumn("order_num", "排序"),
  textColumn("path", "路由路径"),
  textColumn("perms", "权限标识"),
  {
    accessorKey: "menu_type",
    header: ({ column }) => tableHeader(column, "类型"),
    cell: ({ row }) => (
      <Badge variant="outline">
        {getLabel(MENU_TYPE_LABELS, row.original.menu_type)}
      </Badge>
    ),
    meta: { label: "类型" },
  },
  {
    accessorKey: "visible",
    header: ({ column }) => tableHeader(column, "可见"),
    cell: ({ row }) => (
      <Badge variant="outline">
        {getLabel(VISIBLE_LABELS, row.original.visible)}
      </Badge>
    ),
    meta: { label: "可见" },
  },
  statusColumn(),
  dateColumn("created_at", "创建时间"),
]

export const deptColumns: ColumnDef<DeptResource>[] = [
  textColumn("dept_name", "部门名称"),
  numberColumn("parent_id", "父级"),
  numberColumn("order_num", "排序"),
  textColumn("leader", "负责人"),
  textColumn("phone", "电话"),
  textColumn("email", "邮箱"),
  statusColumn(),
  dateColumn("created_at", "创建时间"),
]

export const postColumns: ColumnDef<PostResource>[] = [
  textColumn("post_name", "岗位名称"),
  textColumn("post_code", "岗位编码"),
  numberColumn("post_sort", "排序"),
  statusColumn(),
  dateColumn("created_at", "创建时间"),
  textColumn("remark", "备注"),
]

export const dictTypeColumns: ColumnDef<DictTypeResource>[] = [
  textColumn("dict_name", "字典名称"),
  textColumn("dict_type", "字典类型"),
  statusColumn(),
  textColumn("remark", "备注"),
]

export const dictDataColumns: ColumnDef<DictDataResource>[] = [
  textColumn("dict_label", "字典标签"),
  textColumn("dict_value", "字典键值"),
  textColumn("dict_type", "字典类型"),
  numberColumn("dict_sort", "排序"),
  yesNoColumn("is_default", "默认"),
  statusColumn(),
  textColumn("remark", "备注"),
]

export function DependencyHealthBody({ health }: { health?: HealthResponse }) {
  if (!health) {
    return "等待健康检查返回。"
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
  label: string
): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => <TextCell value={getValue()} />,
    meta: { label, cellClassName: "max-w-64" },
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

function statusColumn<
  TData extends { status: StatusFlag },
>(): ColumnDef<TData> {
  return {
    accessorKey: "status",
    header: ({ column }) => tableHeader(column, "状态"),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    meta: { label: "状态" },
  }
}

function booleanColumn<TData, TKey extends keyof TData & string>(
  key: TKey,
  label: string
): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => (
      <Badge variant={getValue<boolean>() ? "secondary" : "outline"}>
        {getValue<boolean>() ? "是" : "否"}
      </Badge>
    ),
    meta: { label },
  }
}

function yesNoColumn<
  TData extends Record<TKey, YesNoFlag>,
  TKey extends keyof TData & string,
>(key: TKey, label: string): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => (
      <Badge variant={getValue<YesNoFlag>() === "Y" ? "secondary" : "outline"}>
        {getLabel(YES_NO_LABELS, getValue<YesNoFlag>())}
      </Badge>
    ),
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

function StatusBadge({ status }: { status: StatusFlag }) {
  return (
    <Badge variant={status === "0" ? "secondary" : "destructive"}>
      {getLabel(STATUS_LABELS, status)}
    </Badge>
  )
}

function UserStatusSwitch({ user }: { user: UserResource }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setUserStatus(user.user_id, status),
    onSuccess: async (updatedUser) => {
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.users })
      toast.success(
        `${updatedUser.nick_name || updatedUser.user_name}已${
          updatedUser.status === "0" ? "启用" : "停用"
        }`,
        {
          description: "用户状态已同步到后台。",
          duration: 5_000,
        }
      )
    },
    onError: showResourceError,
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : user.status === "0"

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        disabled={user.is_super_admin || mutation.isPending}
        aria-label={`${enabled ? "停用" : "启用"}用户 ${
          user.nick_name || user.user_name
        }`}
        onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
      />
      <span className="text-xs text-muted-foreground">
        {enabled ? "启用" : "停用"}
      </span>
    </div>
  )
}

function TextCell({ value }: { value: unknown }) {
  const text = value == null || value === "" ? "无" : String(value)

  return <span className="block truncate">{text}</span>
}

function DateCell({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-muted-foreground">从未</span>
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return <span>{value}</span>
  }

  return (
    <span title={date.toISOString()}>
      {formatDistanceToNow(date, { addSuffix: true, locale: zhCN })}
    </span>
  )
}
