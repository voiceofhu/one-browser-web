import type { ColumnDef } from "@tanstack/react-table"
import type { ZodType } from "zod"

import {
  createDept,
  deleteDept,
  getDept,
  listDepts,
  setDeptOrder,
  updateDept,
} from "@/api/system/dept"
import {
  createDictData,
  createDictType,
  deleteDictData,
  deleteDictType,
  getDictData,
  getDictType,
  listDictData,
  listDictTypes,
  setDictDataOrder,
  updateDictData,
  updateDictType,
} from "@/api/system/dict"
import {
  createMenu,
  deleteMenu,
  getMenu,
  listMenus,
  updateMenu,
} from "@/api/system/menu"
import {
  createNotice,
  deleteNotice,
  getNotice,
  listNotices,
  updateNotice,
} from "@/api/system/notice"
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  updatePost,
} from "@/api/system/post"
import {
  createRole,
  deleteRole,
  getRole,
  listRoles,
  setRoleMenuIds,
  updateRole,
} from "@/api/system/role"
import {
  createUser,
  deleteUser,
  getUser,
  getUserRoleIds,
  listUsers,
  resetUserPassword,
  setUserPostIds,
  setUserRoleIds,
  updateUser,
} from "@/api/system/user"
import { systemQueryKeys } from "@/lib/query-keys"
import {
  deptColumns,
  dictDataColumns,
  dictTypeColumns,
  menuColumns,
  noticeColumns,
  postColumns,
  roleColumns,
  userColumns,
} from "./columns"
import {
  defaultValues,
  deptSchema,
  dictDataSchema,
  dictTypeSchema,
  menuSchema,
  mergeRecord,
  nullableNumberPayload,
  nullableTextPayload,
  noticeSchema,
  numberPayload,
  postSchema,
  resourceFields,
  roleSchema,
  textPayload,
  userCreateSchema,
  userUpdateSchema,
  type ResourceField,
  type ResourceFormMode,
  type ResourceFormValues,
} from "./form"
import type {
  DeptResource,
  DictDataResource,
  DictTypeResource,
  ListParams,
  MenuResource,
  NoticeSummaryResource,
  NoticeResource,
  PageResponse,
  PostResource,
  RoleResource,
  UserResource,
} from "@/types/admin"
import type { ResourceStatusFilterOption } from "./status-filter-tabs"
import type { ResourceTreeConfig } from "./tree"

export type DashboardResourceConfig<TData, TDetail extends TData = TData> = {
  queryKey: readonly unknown[]
  noun: string
  list: (params?: ListParams) => Promise<PageResponse<TData>>
  columns: ColumnDef<TData>[]
  defaultColumnVisibility?: Record<string, boolean>
  getId: (record: TData) => number
  getName: (record: TData) => string
  fields: ResourceField[]
  schema: (mode: ResourceFormMode) => ZodType<ResourceFormValues>
  getDefaultValues: () => ResourceFormValues
  getEditValues: (record: TDetail) => ResourceFormValues
  getChildCreateValues?: (record: TData) => ResourceFormValues | null
  detail?: (record: TData) => Promise<TDetail>
  create: (payload: ResourceFormValues) => Promise<unknown>
  update: (record: TDetail, payload: ResourceFormValues) => Promise<TDetail>
  remove: (record: TData) => Promise<void>
  reorder?: (payload: ResourceReorderPayload<TData>) => Promise<number>
  tree?: ResourceTreeConfig<TData>
  isProtected?: (record: TData) => boolean
  statusFilters?: readonly ResourceStatusFilterOption[]
  permissions?: ResourceActionPermissions
  userActions?: {
    getRoleIds: (record: TData) => Promise<number[]>
    setRoleIds: (record: TData, roleIds: number[]) => Promise<void>
    resetPassword: (record: TData, password: string) => Promise<void>
  }
}

export type ResourceActionPermissions = {
  create?: string
  update?: string
  delete?: string
  createChild?: string
  reorder?: string
  resetPassword?: string
  assignRoles?: string
}

export type ResourceReorderPayload<TData> = {
  active: TData
  over: TData
  orderedRecords: TData[]
}

const STATUS_FILTERS = [
  { label: "全部", value: "all" },
  { label: "启用", value: "0" },
  { label: "停用", value: "1" },
] satisfies readonly ResourceStatusFilterOption[]

export const RESOURCE_CONFIGS = {
  users: {
    queryKey: systemQueryKeys.users,
    noun: "用户",
    list: listUsers,
    statusFilters: STATUS_FILTERS,
    permissions: {
      create: "system:user:create",
      update: "system:user:update",
      delete: "system:user:delete",
      resetPassword: "system:user:reset-password",
      assignRoles: "system:user:assign-role",
    },
    columns: userColumns,
    getId: (record) => record.user_id,
    getName: (record) => record.user_name || record.nick_name,
    fields: resourceFields.users,
    schema: (mode) => (mode === "create" ? userCreateSchema : userUpdateSchema),
    getDefaultValues: () => ({ ...defaultValues.users }),
    getEditValues: (record) => mergeRecord(defaultValues.users, record),
    detail: (record) => getUser(record.user_id),
    create: async (values) => {
      const result = await createUser(userPayload(values, true))
      await Promise.all([
        setUserRoleIds(result.id, idsPayload(values, "role_ids")),
        setUserPostIds(result.id, idsPayload(values, "post_ids")),
      ])
      return result
    },
    update: async (record, values) => {
      const user = await updateUser(record.user_id, userPayload(values))
      await Promise.all([
        setUserRoleIds(record.user_id, idsPayload(values, "role_ids")),
        setUserPostIds(record.user_id, idsPayload(values, "post_ids")),
      ])
      return user
    },
    remove: (record) => deleteUser(record.user_id),
    isProtected: (record) => record.is_super_admin,
    userActions: {
      getRoleIds: async (record) => (await getUserRoleIds(record.user_id)).ids,
      setRoleIds: (record, roleIds) => setUserRoleIds(record.user_id, roleIds),
      resetPassword: (record, password) =>
        resetUserPassword(record.user_id, password),
    },
  },
  roles: {
    queryKey: systemQueryKeys.roles,
    noun: "角色",
    list: listRoles,
    statusFilters: STATUS_FILTERS,
    permissions: {
      create: "system:role:create",
      update: "system:role:update",
      delete: "system:role:delete",
    },
    columns: roleColumns,
    getId: (record) => record.role_id,
    getName: (record) => record.role_name,
    fields: resourceFields.roles,
    schema: () => roleSchema,
    getDefaultValues: () => ({ ...defaultValues.roles }),
    getEditValues: (record) => mergeRecord(defaultValues.roles, record),
    detail: (record) => getRole(record.role_id),
    create: async (values) => {
      const result = await createRole(rolePayload(values))
      await setRoleMenuIds(result.id, idsPayload(values, "menu_ids"))
      return result
    },
    update: async (record, values) => {
      const role = await updateRole(record.role_id, rolePayload(values))
      await setRoleMenuIds(record.role_id, idsPayload(values, "menu_ids"))
      return role
    },
    remove: (record) => deleteRole(record.role_id),
  },
  menus: {
    queryKey: systemQueryKeys.menus,
    noun: "权限",
    list: listMenus,
    statusFilters: STATUS_FILTERS,
    permissions: {
      create: "system:menu:create",
      update: "system:menu:update",
      delete: "system:menu:delete",
      createChild: "system:menu:create",
    },
    columns: menuColumns,
    getId: (record) => record.menu_id,
    getName: (record) => record.menu_name,
    fields: resourceFields.menus,
    schema: () => menuSchema,
    getDefaultValues: () => ({ ...defaultValues.menus }),
    getEditValues: (record) => mergeRecord(defaultValues.menus, record),
    getChildCreateValues: menuChildCreateValues,
    detail: (record) => getMenu(record.menu_id),
    create: (values) => createMenu(menuPayload(values)),
    update: (record, values) => updateMenu(record.menu_id, menuPayload(values)),
    remove: (record) => deleteMenu(record.menu_id),
    tree: {
      columnId: "menu_name",
      getParentId: (record) => record.parent_id,
      getOrder: (record) => record.order_num,
      pageSize: 1_000,
    },
  },
  depts: {
    queryKey: systemQueryKeys.depts,
    noun: "部门",
    list: listDepts,
    statusFilters: STATUS_FILTERS,
    permissions: {
      create: "system:dept:create",
      update: "system:dept:update",
      delete: "system:dept:delete",
      reorder: "system:dept:order",
    },
    columns: deptColumns,
    getId: (record) => record.dept_id,
    getName: (record) => record.dept_name,
    fields: resourceFields.depts,
    schema: () => deptSchema,
    getDefaultValues: () => ({ ...defaultValues.depts }),
    getEditValues: (record) => mergeRecord(defaultValues.depts, record),
    detail: (record) => getDept(record.dept_id),
    create: (values) => createDept(deptPayload(values)),
    update: (record, values) => updateDept(record.dept_id, deptPayload(values)),
    remove: (record) => deleteDept(record.dept_id),
    reorder: reorderDeptRows,
    tree: {
      columnId: "dept_name",
      getParentId: (record) => record.parent_id,
      getOrder: (record) => record.order_num,
      pageSize: 1_000,
    },
  },
  posts: {
    queryKey: systemQueryKeys.posts,
    noun: "岗位",
    list: listPosts,
    statusFilters: STATUS_FILTERS,
    permissions: {
      create: "system:post:create",
      update: "system:post:update",
      delete: "system:post:delete",
    },
    columns: postColumns,
    defaultColumnVisibility: {
      post_code: false,
      post_sort: false,
    },
    getId: (record) => record.post_id,
    getName: (record) => record.post_name,
    fields: resourceFields.posts,
    schema: () => postSchema,
    getDefaultValues: () => ({ ...defaultValues.posts }),
    getEditValues: (record) => mergeRecord(defaultValues.posts, record),
    detail: (record) => getPost(record.post_id),
    create: (values) => createPost(postPayload(values)),
    update: (record, values) => updatePost(record.post_id, postPayload(values)),
    remove: (record) => deletePost(record.post_id),
  },
  "dict-types": {
    queryKey: systemQueryKeys.dictTypes,
    noun: "字典",
    list: listDictTypes,
    statusFilters: STATUS_FILTERS,
    permissions: {
      create: "system:dict:create",
      update: "system:dict:update",
      delete: "system:dict:delete",
    },
    columns: dictTypeColumns,
    getId: (record) => record.dict_id,
    getName: (record) => record.dict_name,
    fields: resourceFields.dictTypes,
    schema: () => dictTypeSchema,
    getDefaultValues: () => ({ ...defaultValues.dictTypes }),
    getEditValues: (record) => mergeRecord(defaultValues.dictTypes, record),
    detail: (record) => getDictType(record.dict_id),
    create: (values) => createDictType(dictTypePayload(values)),
    update: (record, values) =>
      updateDictType(record.dict_id, dictTypePayload(values)),
    remove: (record) => deleteDictType(record.dict_id),
  },
  "dict-data": {
    queryKey: systemQueryKeys.dictData,
    noun: "字典数据",
    list: listDictData,
    statusFilters: STATUS_FILTERS,
    permissions: {
      create: "system:dict:data:create",
      update: "system:dict:data:update",
      delete: "system:dict:data:delete",
      reorder: "system:dict:data:update",
    },
    columns: dictDataColumns,
    getId: (record) => record.dict_code,
    getName: (record) => record.dict_label,
    fields: resourceFields.dictData,
    schema: () => dictDataSchema,
    getDefaultValues: () => ({ ...defaultValues.dictData }),
    getEditValues: (record) => mergeRecord(defaultValues.dictData, record),
    detail: (record) => getDictData(record.dict_code),
    create: (values) => createDictData(dictDataPayload(values)),
    update: (record, values) =>
      updateDictData(record.dict_code, dictDataPayload(values)),
    remove: (record) => deleteDictData(record.dict_code),
    reorder: reorderDictDataRows,
  },
  notices: {
    queryKey: systemQueryKeys.notices,
    noun: "通知",
    list: listNotices,
    statusFilters: STATUS_FILTERS,
    permissions: {
      create: "system:notice:create",
      update: "system:notice:update",
      delete: "system:notice:delete",
    },
    columns: noticeColumns,
    defaultColumnVisibility: {
      updated_at: false,
    },
    getId: (record) => record.notice_id,
    getName: (record) => record.notice_title,
    fields: resourceFields.notices,
    schema: () => noticeSchema,
    getDefaultValues: () => ({ ...defaultValues.notices }),
    getEditValues: (record) => mergeRecord(defaultValues.notices, record),
    detail: (record) => getNotice(record.notice_id),
    create: (values) => createNotice(noticePayload(values)),
    update: (record, values) =>
      updateNotice(record.notice_id, noticePayload(values)),
    remove: (record) => deleteNotice(record.notice_id),
  },
} satisfies {
  users: DashboardResourceConfig<UserResource>
  roles: DashboardResourceConfig<RoleResource>
  menus: DashboardResourceConfig<MenuResource>
  depts: DashboardResourceConfig<DeptResource>
  posts: DashboardResourceConfig<PostResource>
  "dict-types": DashboardResourceConfig<DictTypeResource>
  "dict-data": DashboardResourceConfig<DictDataResource>
  notices: DashboardResourceConfig<NoticeSummaryResource, NoticeResource>
}

function userPayload(values: ResourceFormValues, includePassword = false) {
  return {
    dept_id: nullableNumberPayload(values, "dept_id"),
    user_name: textPayload(values, "user_name"),
    nick_name: textPayload(values, "nick_name"),
    user_type: textPayload(values, "user_type", "system"),
    email: textPayload(values, "email"),
    phone_number: textPayload(values, "phone_number"),
    sex: textPayload(values, "sex", "2"),
    avatar: textPayload(values, "avatar"),
    status: textPayload(values, "status", "0"),
    remark: nullableTextPayload(values, "remark"),
    ...(includePassword ? { password: textPayload(values, "password") } : {}),
  }
}

function idsPayload(values: ResourceFormValues, key: string) {
  const ids = values[key]
  return Array.isArray(ids)
    ? ids.filter((value): value is number => typeof value === "number")
    : []
}

function rolePayload(values: ResourceFormValues) {
  return {
    role_name: textPayload(values, "role_name"),
    role_key: textPayload(values, "role_key"),
    role_sort: numberPayload(values, "role_sort"),
    data_scope: textPayload(values, "data_scope", "1"),
    status: textPayload(values, "status", "0"),
    remark: nullableTextPayload(values, "remark"),
  }
}

function menuPayload(values: ResourceFormValues) {
  const menuType = textPayload(values, "menu_type", "M")
  const isButtonPermission = menuType === "F"

  return {
    menu_name: textPayload(values, "menu_name"),
    parent_id: nullableNumberPayload(values, "parent_id"),
    order_num: numberPayload(values, "order_num"),
    path: isButtonPermission ? "" : textPayload(values, "path"),
    menu_type: menuType,
    visible: isButtonPermission ? "1" : textPayload(values, "visible", "0"),
    status: textPayload(values, "status", "0"),
    perms: menuType === "M" ? null : nullableTextPayload(values, "perms"),
    icon: isButtonPermission ? "#" : textPayload(values, "icon", "#"),
    remark: textPayload(values, "remark"),
  }
}

function menuChildCreateValues(menu: MenuResource): ResourceFormValues | null {
  if (menu.menu_type === "F") {
    return null
  }

  const childType = menu.menu_type === "C" ? "F" : "C"

  return {
    ...defaultValues.menus,
    parent_id: menu.menu_id,
    menu_type: childType,
    visible: childType === "F" ? "1" : "0",
    icon: childType === "F" ? "#" : defaultValues.menus.icon,
  }
}

function deptPayload(values: ResourceFormValues) {
  return {
    parent_id: nullableNumberPayload(values, "parent_id"),
    ancestors: textPayload(values, "ancestors", "0"),
    dept_name: textPayload(values, "dept_name"),
    order_num: numberPayload(values, "order_num"),
    leader: nullableTextPayload(values, "leader"),
    phone: nullableTextPayload(values, "phone"),
    email: nullableTextPayload(values, "email"),
    status: textPayload(values, "status", "0"),
  }
}

async function reorderDeptRows({
  active,
  over,
  orderedRecords,
}: ResourceReorderPayload<DeptResource>) {
  if (active.parent_id !== over.parent_id) {
    throw new Error("部门只能在同一个上级部门下拖拽排序")
  }

  const siblings = orderedRecords.filter(
    (record) => record.parent_id === active.parent_id
  )
  const nextOrderNums = siblings
    .map((record) => record.order_num)
    .sort((left, right) => left - right)
  const updates = siblings
    .map((record, index) => ({
      record,
      orderNum: nextOrderNums[index] ?? index + 1,
    }))
    .filter(({ record, orderNum }) => record.order_num !== orderNum)

  await Promise.all(
    updates.map(({ record, orderNum }) => setDeptOrder(record, orderNum))
  )
  return updates.length
}

function postPayload(values: ResourceFormValues) {
  return {
    post_name: textPayload(values, "post_name"),
    status: textPayload(values, "status", "0"),
    remark: nullableTextPayload(values, "remark"),
  }
}

function dictTypePayload(values: ResourceFormValues) {
  return {
    dict_name: textPayload(values, "dict_name"),
    dict_type: textPayload(values, "dict_type"),
    status: textPayload(values, "status", "0"),
    remark: nullableTextPayload(values, "remark"),
  }
}

function dictDataPayload(values: ResourceFormValues) {
  return {
    dict_sort: numberPayload(values, "dict_sort"),
    dict_label: textPayload(values, "dict_label"),
    dict_value: textPayload(values, "dict_value"),
    dict_type: textPayload(values, "dict_type"),
    css_class: nullableTextPayload(values, "css_class"),
    list_class: nullableTextPayload(values, "list_class"),
    is_default: textPayload(values, "is_default", "N"),
    status: textPayload(values, "status", "0"),
    remark: nullableTextPayload(values, "remark"),
  }
}

async function reorderDictDataRows({
  active,
  over,
  orderedRecords,
}: ResourceReorderPayload<DictDataResource>) {
  if (active.dict_type !== over.dict_type) {
    throw new Error("字典数据只能在同一个字典类型下拖拽排序")
  }

  const rows = orderedRecords.filter(
    (record) => record.dict_type === active.dict_type
  )
  const nextSorts = rows
    .map((record) => record.dict_sort)
    .sort((left, right) => left - right)
  const updates = rows
    .map((record, index) => ({
      record,
      dictSort: nextSorts[index] ?? index + 1,
    }))
    .filter(({ record, dictSort }) => record.dict_sort !== dictSort)

  await Promise.all(
    updates.map(({ record, dictSort }) => setDictDataOrder(record, dictSort))
  )
  return updates.length
}

function noticePayload(values: ResourceFormValues) {
  return {
    notice_title: textPayload(values, "notice_title"),
    notice_type: textPayload(values, "notice_type", "1"),
    notice_content: nullableTextPayload(values, "notice_content"),
    status: textPayload(values, "status", "0"),
    remark: nullableTextPayload(values, "remark"),
  }
}
