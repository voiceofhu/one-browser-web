import { z } from "zod"

import type {
  DataScopeFlag,
  MenuTypeFlag,
  SexFlag,
  StatusFlag,
  VisibleFlag,
  YesNoFlag,
} from "@/types/admin"

export type ResourceFormMode = "create" | "edit"
export type ResourceFormValues = Record<string, unknown>

export type ResourceFieldOption = {
  label: string
  value: string
}

export type ResourceField = {
  name: string
  label: string
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "dept-combobox"
    | "post-multi-select"
    | "role-multi-select"
    | "status-switch"
    | "switch"
  placeholder?: string
  description?: string
  options?: ResourceFieldOption[]
  hiddenOnEdit?: boolean
  disabledOnEdit?: boolean
}

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label}不能为空`)

const optionalText = z.string().trim().optional()
const optionalNullableNumber = z.number().int().nullable()
const requiredNumber = z.number().int()

const status = z.enum(["0", "1"])
const sex = z.enum(["0", "1", "2"])
const dataScope = z.enum(["1", "2", "3", "4", "5"])
const menuType = z.enum(["M", "C", "F"])
const visible = z.enum(["0", "1"])
const yesNo = z.enum(["Y", "N"])

export const statusOptions = options<StatusFlag>({
  "0": "启用",
  "1": "停用",
})
export const sexOptions = options<SexFlag>({
  "0": "男",
  "1": "女",
  "2": "未知",
})
export const dataScopeOptions = options<DataScopeFlag>({
  "1": "全部数据",
  "2": "本部门数据",
  "3": "本部门及以下",
  "4": "自定义数据",
  "5": "仅本人数据",
})
export const menuTypeOptions = options<MenuTypeFlag>({
  M: "目录",
  C: "菜单",
  F: "按钮",
})
export const visibleOptions = options<VisibleFlag>({
  "0": "显示",
  "1": "隐藏",
})
export const yesNoOptions = options<YesNoFlag>({
  Y: "是",
  N: "否",
})

const userBaseSchema = z.object({
  dept_id: optionalNullableNumber,
  user_name: requiredText("用户名").max(64, "用户名不能超过 64 个字符"),
  nick_name: requiredText("昵称").max(64, "昵称不能超过 64 个字符"),
  user_type: optionalText,
  post_ids: z.array(z.number().int()),
  role_ids: z.array(z.number().int()).min(1, "至少选择一个角色"),
  email: z
    .string()
    .trim()
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "邮箱格式不正确",
    }),
  phone_number: optionalText,
  sex,
  avatar: optionalText,
  status,
  remark: optionalText,
})

export const userCreateSchema = userBaseSchema.extend({
  password: z.string().min(10, "密码至少需要 10 位"),
})

export const userUpdateSchema = userBaseSchema.extend({
  password: z.string().optional(),
})

export const roleSchema = z.object({
  role_name: requiredText("角色名称").max(64, "角色名称不能超过 64 个字符"),
  role_key: requiredText("权限标识").max(64, "权限标识不能超过 64 个字符"),
  role_sort: requiredNumber,
  data_scope: dataScope,
  menu_check_strictly: z.boolean(),
  dept_check_strictly: z.boolean(),
  status,
  remark: optionalText,
})

export const menuSchema = z.object({
  menu_name: requiredText("菜单名称").max(64, "菜单名称不能超过 64 个字符"),
  parent_id: optionalNullableNumber,
  order_num: requiredNumber,
  path: optionalText,
  component: optionalText,
  route_query: optionalText,
  route_name: optionalText,
  is_frame: z.boolean(),
  is_cache: z.boolean(),
  menu_type: menuType,
  visible,
  status,
  perms: optionalText,
  icon: optionalText,
  remark: optionalText,
})

export const deptSchema = z.object({
  parent_id: optionalNullableNumber,
  ancestors: optionalText,
  dept_name: requiredText("部门名称").max(64, "部门名称不能超过 64 个字符"),
  order_num: requiredNumber,
  leader: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "邮箱格式不正确",
    }),
  status,
})

export const postSchema = z.object({
  post_code: requiredText("岗位编码").max(64, "岗位编码不能超过 64 个字符"),
  post_name: requiredText("岗位名称").max(64, "岗位名称不能超过 64 个字符"),
  post_sort: requiredNumber,
  status,
  remark: optionalText,
})

export const dictTypeSchema = z.object({
  dict_name: requiredText("字典名称").max(64, "字典名称不能超过 64 个字符"),
  dict_type: requiredText("字典类型").max(128, "字典类型不能超过 128 个字符"),
  status,
  remark: optionalText,
})

export const dictDataSchema = z.object({
  dict_sort: requiredNumber,
  dict_label: requiredText("字典标签").max(64, "字典标签不能超过 64 个字符"),
  dict_value: requiredText("字典键值").max(128, "字典键值不能超过 128 个字符"),
  dict_type: requiredText("字典类型").max(128, "字典类型不能超过 128 个字符"),
  css_class: optionalText,
  list_class: optionalText,
  is_default: yesNo,
  status,
  remark: optionalText,
})

export const resourceFields = {
  users: [
    textField("nick_name", "用户昵称", "请输入用户昵称"),
    deptComboboxField("dept_id", "归属部门"),
    textField("phone_number", "手机号码", "请输入手机号码"),
    emailField("email", "邮箱"),
    textField("user_name", "用户名称", "请输入登录用户名"),
    passwordField("password", "用户密码", "密码至少需要 10 位", true),
    selectField("sex", "用户性别", sexOptions),
    statusSwitchField("status", "状态"),
    postMultiSelectField("post_ids", "岗位"),
    roleMultiSelectField("role_ids", "角色"),
    textareaField("remark", "备注"),
  ],
  roles: [
    textField("role_name", "角色名称"),
    textField("role_key", "权限标识"),
    numberField("role_sort", "排序"),
    selectField("data_scope", "数据范围", dataScopeOptions),
    switchField("menu_check_strictly", "菜单树严格校验"),
    switchField("dept_check_strictly", "部门树严格校验"),
    selectField("status", "状态", statusOptions),
    textareaField("remark", "备注"),
  ],
  menus: [
    textField("menu_name", "菜单名称"),
    numberField("parent_id", "父级菜单 ID", "留空表示顶级菜单"),
    numberField("order_num", "排序"),
    textField("path", "路由路径"),
    textField("component", "组件路径"),
    textField("route_query", "路由参数"),
    textField("route_name", "路由名称"),
    switchField("is_frame", "外链"),
    switchField("is_cache", "缓存"),
    selectField("menu_type", "菜单类型", menuTypeOptions),
    selectField("visible", "可见状态", visibleOptions),
    selectField("status", "状态", statusOptions),
    textField("perms", "权限标识"),
    textField("icon", "图标"),
    textareaField("remark", "备注"),
  ],
  depts: [
    numberField("parent_id", "父级部门 ID", "留空表示顶级部门"),
    textField("ancestors", "祖级列表"),
    textField("dept_name", "部门名称"),
    numberField("order_num", "排序"),
    textField("leader", "负责人"),
    textField("phone", "联系电话"),
    emailField("email", "邮箱"),
    selectField("status", "状态", statusOptions),
  ],
  posts: [
    textField("post_code", "岗位编码"),
    textField("post_name", "岗位名称"),
    numberField("post_sort", "排序"),
    selectField("status", "状态", statusOptions),
    textareaField("remark", "备注"),
  ],
  dictTypes: [
    textField("dict_name", "字典名称"),
    textField("dict_type", "字典类型"),
    selectField("status", "状态", statusOptions),
    textareaField("remark", "备注"),
  ],
  dictData: [
    numberField("dict_sort", "排序"),
    textField("dict_label", "字典标签"),
    textField("dict_value", "字典键值"),
    textField("dict_type", "字典类型"),
    textField("css_class", "CSS 类名"),
    textField("list_class", "列表样式"),
    selectField("is_default", "是否默认", yesNoOptions),
    selectField("status", "状态", statusOptions),
    textareaField("remark", "备注"),
  ],
} satisfies Record<string, ResourceField[]>

export const defaultValues = {
  users: {
    dept_id: null,
    user_name: "",
    nick_name: "",
    password: "",
    user_type: "system",
    post_ids: [],
    role_ids: [],
    email: "",
    phone_number: "",
    sex: "2" satisfies SexFlag,
    avatar: "",
    status: "0" satisfies StatusFlag,
    remark: "",
  },
  roles: {
    role_name: "",
    role_key: "",
    role_sort: 0,
    data_scope: "1" satisfies DataScopeFlag,
    menu_check_strictly: true,
    dept_check_strictly: true,
    status: "0" satisfies StatusFlag,
    remark: "",
  },
  menus: {
    menu_name: "",
    parent_id: null,
    order_num: 0,
    path: "",
    component: "",
    route_query: "",
    route_name: "",
    is_frame: false,
    is_cache: false,
    menu_type: "M" satisfies MenuTypeFlag,
    visible: "0" satisfies VisibleFlag,
    status: "0" satisfies StatusFlag,
    perms: "",
    icon: "#",
    remark: "",
  },
  depts: {
    parent_id: null,
    ancestors: "",
    dept_name: "",
    order_num: 0,
    leader: "",
    phone: "",
    email: "",
    status: "0" satisfies StatusFlag,
  },
  posts: {
    post_code: "",
    post_name: "",
    post_sort: 0,
    status: "0" satisfies StatusFlag,
    remark: "",
  },
  dictTypes: {
    dict_name: "",
    dict_type: "",
    status: "0" satisfies StatusFlag,
    remark: "",
  },
  dictData: {
    dict_sort: 0,
    dict_label: "",
    dict_value: "",
    dict_type: "",
    css_class: "",
    list_class: "",
    is_default: "N" satisfies YesNoFlag,
    status: "0" satisfies StatusFlag,
    remark: "",
  },
} satisfies Record<string, ResourceFormValues>

export function textPayload(
  values: ResourceFormValues,
  key: string,
  fallback = ""
) {
  const value = values[key]
  return typeof value === "string" ? value.trim() : fallback
}

export function nullableTextPayload(values: ResourceFormValues, key: string) {
  const value = textPayload(values, key)
  return value ? value : null
}

export function numberPayload(
  values: ResourceFormValues,
  key: string,
  fallback = 0
) {
  const value = values[key]
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

export function nullableNumberPayload(values: ResourceFormValues, key: string) {
  const value = values[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

export function booleanPayload(values: ResourceFormValues, key: string) {
  return values[key] === true
}

export function mergeRecord(
  defaults: ResourceFormValues,
  record?: object
): ResourceFormValues {
  return {
    ...defaults,
    ...(record ?? {}),
  }
}

function textField(
  name: string,
  label: string,
  placeholder?: string
): ResourceField {
  return { name, label, type: "text", placeholder }
}

function emailField(name: string, label: string): ResourceField {
  return { name, label, type: "email" }
}

function passwordField(
  name: string,
  label: string,
  description?: string,
  hiddenOnEdit?: boolean
): ResourceField {
  return { name, label, type: "password", description, hiddenOnEdit }
}

function numberField(
  name: string,
  label: string,
  description?: string
): ResourceField {
  return { name, label, type: "number", description }
}

function textareaField(name: string, label: string): ResourceField {
  return { name, label, type: "textarea" }
}

function selectField(
  name: string,
  label: string,
  options: ResourceFieldOption[]
): ResourceField {
  return { name, label, type: "select", options }
}

function deptComboboxField(
  name: string,
  label: string,
  description?: string
): ResourceField {
  return { name, label, type: "dept-combobox", description }
}

function roleMultiSelectField(name: string, label: string): ResourceField {
  return { name, label, type: "role-multi-select" }
}

function postMultiSelectField(name: string, label: string): ResourceField {
  return { name, label, type: "post-multi-select" }
}

function statusSwitchField(name: string, label: string): ResourceField {
  return { name, label, type: "status-switch" }
}

function switchField(name: string, label: string): ResourceField {
  return { name, label, type: "switch" }
}

function options<T extends string>(labels: Record<T, string>) {
  return Object.entries(labels).map(([value, label]) => ({
    value,
    label: String(label),
  }))
}
