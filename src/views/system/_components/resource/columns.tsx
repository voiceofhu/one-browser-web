"use client"

/* eslint-disable react-refresh/only-export-components */
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { setDictTypeStatus } from "@/api/system/dict"
import { setDeptStatus } from "@/api/system/dept"
import { setMenuStatus } from "@/api/system/menu"
import { setPostStatus } from "@/api/system/post"
import { setRoleStatus } from "@/api/system/role"
import { setUserStatus } from "@/api/system/user"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useAuthPermissions } from "@/hooks/use-auth"
import { hasPermission } from "@/lib/auth-permissions"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { systemQueryKeys } from "@/lib/query-keys"

import {
  DATA_SCOPE_LABELS,
  getLabel,
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
  textColumn("dict_name", "字典名称"),
  textColumn("dict_type", "字典类型"),
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
  numberColumn("dict_sort", "排序"),
  yesNoColumn("is_default", "默认"),
  statusColumn(),
  textColumn("remark", "备注", "max-w-64", "-"),
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

function MenuNameCell({ menu }: { menu: MenuResource }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate">{menu.menu_name}</span>
      <Badge
        variant={menu.visible === "0" ? "secondary" : "destructive"}
        className="shrink-0"
      >
        {getLabel(VISIBLE_LABELS, menu.visible)}
      </Badge>
    </div>
  )
}

function UserStatusSwitch({ user }: { user: UserResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
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
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:user:status"
  )

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        disabled={!canChangeStatus || user.is_super_admin || mutation.isPending}
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

function RoleStatusSwitch({ role }: { role: RoleResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setRoleStatus(role, status),
    onSuccess: async (updatedRole) => {
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.roles })
      toast.success(
        `${updatedRole.role_name}已${
          updatedRole.status === "0" ? "启用" : "停用"
        }`,
        {
          description: "角色状态已同步到后台。",
          duration: 5_000,
        }
      )
    },
    onError: showResourceError,
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : role.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:role:status"
  )

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        disabled={!canChangeStatus || mutation.isPending}
        aria-label={`${enabled ? "停用" : "启用"}角色 ${role.role_name}`}
        onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
      />
      <span className="text-xs text-muted-foreground">
        {enabled ? "启用" : "停用"}
      </span>
    </div>
  )
}

function MenuStatusSwitch({ menu }: { menu: MenuResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setMenuStatus(menu, status),
    onSuccess: async (updatedMenu) => {
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.menus })
      toast.success(
        `${updatedMenu.menu_name}已${
          updatedMenu.status === "0" ? "启用" : "停用"
        }`,
        {
          description: "菜单状态已同步到后台。",
          duration: 5_000,
        }
      )
    },
    onError: showResourceError,
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : menu.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:menu:status"
  )

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        disabled={!canChangeStatus || mutation.isPending}
        aria-label={`${enabled ? "停用" : "启用"}权限 ${menu.menu_name}`}
        onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
      />
      <span className="text-xs text-muted-foreground">
        {enabled ? "启用" : "停用"}
      </span>
    </div>
  )
}

function DeptStatusSwitch({ dept }: { dept: DeptResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setDeptStatus(dept, status),
    onSuccess: async (updatedDept) => {
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.depts })
      toast.success(
        `${updatedDept.dept_name}已${
          updatedDept.status === "0" ? "设为正常" : "停用"
        }`,
        {
          description: "部门状态已同步到后台。",
          duration: 5_000,
        }
      )
    },
    onError: showResourceError,
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : dept.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:dept:status"
  )

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        disabled={!canChangeStatus || mutation.isPending}
        aria-label={`${enabled ? "停用" : "设为正常"}部门 ${dept.dept_name}`}
        onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
      />
      <span className="text-xs text-muted-foreground">
        {enabled ? "正常" : "停用"}
      </span>
    </div>
  )
}

function PostStatusSwitch({ post }: { post: PostResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setPostStatus(post, status),
    onSuccess: async (updatedPost) => {
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.posts })
      toast.success(
        `${updatedPost.post_name}已${
          updatedPost.status === "0" ? "启用" : "停用"
        }`,
        {
          description: "岗位状态已同步到后台。",
          duration: 5_000,
        }
      )
    },
    onError: showResourceError,
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : post.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:post:status"
  )

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        disabled={!canChangeStatus || mutation.isPending}
        aria-label={`${enabled ? "停用" : "启用"}岗位 ${post.post_name}`}
        onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
      />
      <span className="text-xs text-muted-foreground">
        {enabled ? "启用" : "停用"}
      </span>
    </div>
  )
}

function DictTypeStatusSwitch({ dictType }: { dictType: DictTypeResource }) {
  const queryClient = useQueryClient()
  const authPermissions = useAuthPermissions()
  const mutation = useMutation({
    mutationFn: (status: StatusFlag) => setDictTypeStatus(dictType, status),
    onSuccess: async (updatedDictType) => {
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.dictTypes,
      })
      toast.success(
        `${updatedDictType.dict_name}已${
          updatedDictType.status === "0" ? "启用" : "停用"
        }`,
        {
          description: "字典类型状态已同步到后台。",
          duration: 5_000,
        }
      )
    },
    onError: showResourceError,
  })
  const enabled = mutation.isPending
    ? mutation.variables === "0"
    : dictType.status === "0"
  const canChangeStatus = hasPermission(
    authPermissions.data,
    "system:dict:status"
  )

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        disabled={!canChangeStatus || mutation.isPending}
        aria-label={`${enabled ? "停用" : "启用"}字典类型 ${
          dictType.dict_name
        }`}
        onCheckedChange={(checked) => mutation.mutate(checked ? "0" : "1")}
      />
      <span className="text-xs text-muted-foreground">
        {enabled ? "启用" : "停用"}
      </span>
    </div>
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
  if (!value) {
    return <span className="text-muted-foreground">从未</span>
  }

  return (
    <span title={formatAbsoluteDateTime(value)}>
      {formatRelativeTime(value, "从未")}
    </span>
  )
}
