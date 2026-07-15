import { z } from "zod"

import type {
  DataScopeFlag,
  MenuTypeFlag,
  NoticeTypeFlag,
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
    | "radio"
    | "menu-icon-select"
    | "menu-parent-select"
    | "menu-type-tabs"
    | "menu-permission-tree"
    | "system-app-permission-tree"
    | "role-select"
    | "status-switch"
    | "switch"
  placeholder?: string
  description?: string
  tooltip?: string
  options?: ResourceFieldOption[]
  hiddenOnCreate?: boolean
  hiddenOnEdit?: boolean
  disabledOnEdit?: boolean
  invertBoolean?: boolean
  colSpan?: "full"
  hideLabel?: boolean
  required?: boolean
  visibleWhen?: (values: ResourceFormValues, mode: ResourceFormMode) => boolean
}

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label}不能为空`)

const optionalText = z.preprocess(
  (value) => (value == null ? "" : value),
  z.string().trim()
)
const optionalNullableNumber = z
  .number()
  .int()
  .nullish()
  .transform((value) => value ?? null)
const requiredNumber = z.number().int()

const status = z.enum(["0", "1"])
const sex = z.enum(["0", "1", "2"])
const userSex = z.preprocess(
  (value) => (["0", "1", "2"].includes(String(value)) ? value : "2"),
  sex
)
const dataScope = z.enum(["1", "2", "3", "4", "5"])
const menuType = z.enum(["M", "C", "F"])
const visible = z.enum(["0", "1"])
const yesNo = z.enum(["Y", "N"])
const noticeType = z.enum(["1", "2"])

export const statusOptions = options<StatusFlag>({
  "0": "启用",
  "1": "停用",
})
export const sexOptions = options<SexFlag>({
  "0": "男",
  "1": "女",
  "2": "不愿透露",
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
export const noticeTypeOptions = options<NoticeTypeFlag>({
  "1": "通知",
  "2": "公告",
})

const userBaseSchema = z.object({
  user_name: requiredText("用户名").max(64, "用户名不能超过 64 个字符"),
  nick_name: requiredText("昵称").max(64, "昵称不能超过 64 个字符"),
  user_type: optionalText,
  role_id: z
    .number({ error: "请选择一个角色" })
    .int()
    .positive("请选择一个角色"),
  email: z
    .string()
    .trim()
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "邮箱格式不正确",
    }),
  phone_number: optionalText,
  sex: userSex,
  avatar: optionalText,
  status: status.optional().default("0"),
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
  data_scope: dataScope.default("1"),
  menu_ids: z.array(z.number().int()).default([]),
  app_permission_ids: z.array(z.number().int()).default([]),
  status: status.optional().default("0"),
  remark: optionalText,
})

export const menuSchema = z
  .object({
    menu_name: requiredText("权限名称").max(64, "权限名称不能超过 64 个字符"),
    parent_id: optionalNullableNumber,
    order_num: requiredNumber,
    path: optionalText,
    menu_type: menuType,
    visible,
    status,
    perms: optionalText,
    icon: optionalText,
    remark: optionalText,
  })
  .superRefine((values, context) => {
    if (values.menu_type === "C" && !values.path?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["path"],
        message: "菜单路由不能为空",
      })
    }

    if (values.menu_type === "F") {
      if (values.parent_id == null) {
        context.addIssue({
          code: "custom",
          path: ["parent_id"],
          message: "按钮权限需要选择所属菜单",
        })
      }

      if (!values.perms?.trim()) {
        context.addIssue({
          code: "custom",
          path: ["perms"],
          message: "按钮权限标识不能为空",
        })
      }
    }
  })

export const dictTypeSchema = z.object({
  dict_name: requiredText("字典类型").max(64, "字典类型不能超过 64 个字符"),
  dict_type: requiredText("字典代码").max(128, "字典代码不能超过 128 个字符"),
  status: status.optional().default("0"),
  remark: optionalText,
})

export const dictDataSchema = z.object({
  dict_sort: requiredNumber.optional().default(0),
  dict_label: requiredText("字典标签").max(64, "字典标签不能超过 64 个字符"),
  dict_value: requiredText("字典键值").max(128, "字典键值不能超过 128 个字符"),
  dict_type: requiredText("字典类型").max(128, "字典类型不能超过 128 个字符"),
  css_class: optionalText,
  list_class: optionalText,
  is_default: yesNo.optional().default("N"),
  status: status.optional().default("0"),
  remark: optionalText,
})

export const noticeSchema = z.object({
  notice_title: requiredText("通知标题").max(
    100,
    "通知标题不能超过 100 个字符"
  ),
  notice_type: noticeType.default("1"),
  notice_content: optionalText,
  status: status.optional().default("0"),
  remark: optionalText,
})

export const resourceFields = {
  users: [
    textField("nick_name", "用户昵称", "请输入用户昵称", true),
    textField("phone_number", "手机号码", "请输入手机号码"),
    emailField("email", "邮箱"),
    textField("user_name", "用户名称", "请输入登录用户名", true),
    passwordField("password", "用户密码", undefined, true, true),
    radioField("sex", "用户性别", sexOptions),
    statusSwitchField("status", "状态", { hiddenOnCreate: true }),
    roleSelectField("role_id", "全局角色", true),
    textareaField("remark", "备注"),
  ],
  roles: [
    textField("role_name", "角色名称", "请输入角色名称", true),
    textField(
      "role_key",
      "权限字符",
      "请输入权限字符",
      true,
      "控制器中定义的权限字符，例如：admin、system:role:list"
    ),
    menuPermissionTreeField("menu_ids", "Web 菜单与权限"),
    systemAppPermissionTreeField("app_permission_ids", "App 全局权限"),
    textareaField("remark", "备注"),
  ],
  menus: [
    menuTypeTabsField("menu_type", "权限类型"),
    textField("menu_name", "权限名称", "请输入权限名称", true),
    menuParentSelectField(
      "parent_id",
      "上级权限",
      "按钮权限必须挂在具体菜单下"
    ),
    visibleWhen(menuIconSelectField("icon", "图标"), isMenuRoutePermission),
    visibleWhen(textField("path", "路由路径"), isRoutePermission),
    visibleWhen(
      selectField("visible", "可见状态", visibleOptions),
      isRoutePermission
    ),
    visibleWhen(
      textField(
        "perms",
        "权限标识",
        "例如 system:user:create 或 system:user:delete",
        false,
        "后端接口校验使用的权限字符，按钮权限必须填写。"
      ),
      hasPermissionCode
    ),
    textareaField("remark", "备注"),
  ],
  dictTypes: [
    textField("dict_name", "字典类型", undefined, true),
    textField("dict_type", "字典代码", undefined, true),
    statusSwitchField("status", "状态", { hiddenOnCreate: true }),
    textareaField("remark", "备注"),
  ],
  dictData: [
    textField("dict_label", "字典标签", undefined, true),
    textField("dict_value", "字典键值", undefined, true),
    textField("dict_type", "字典类型", undefined, true),
    textareaField("remark", "备注"),
  ],
  notices: [
    textField("notice_title", "通知标题", "请输入通知标题", true),
    selectField("notice_type", "通知类型", noticeTypeOptions, true),
    statusSwitchField("status", "状态", { hiddenOnCreate: true }),
    textareaField("notice_content", "通知内容", { colSpan: "full" }),
    textareaField("remark", "备注", { colSpan: "full" }),
  ],
} satisfies Record<string, ResourceField[]>

export const defaultValues = {
  users: {
    user_name: "",
    nick_name: "",
    password: "",
    user_type: "system",
    role_id: null,
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
    data_scope: "1" satisfies DataScopeFlag,
    menu_ids: [],
    app_permission_ids: [],
    status: "0" satisfies StatusFlag,
    remark: "",
  },
  menus: {
    menu_name: "",
    parent_id: null,
    order_num: 0,
    path: "",
    menu_type: "M" satisfies MenuTypeFlag,
    visible: "0" satisfies VisibleFlag,
    status: "0" satisfies StatusFlag,
    perms: "",
    icon: "#",
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
  notices: {
    notice_title: "",
    notice_type: "1" satisfies NoticeTypeFlag,
    notice_content: "",
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
  placeholder?: string,
  required?: boolean,
  tooltip?: string
): ResourceField {
  return { name, label, type: "text", placeholder, required, tooltip }
}

function emailField(
  name: string,
  label: string,
  placeholder?: string,
  required?: boolean
): ResourceField {
  return { name, label, type: "email", placeholder, required }
}

function passwordField(
  name: string,
  label: string,
  description?: string,
  hiddenOnEdit?: boolean,
  required?: boolean
): ResourceField {
  return { name, label, type: "password", description, hiddenOnEdit, required }
}

function textareaField(
  name: string,
  label: string,
  options?: Pick<ResourceField, "colSpan">
): ResourceField {
  return { name, label, type: "textarea", ...options }
}

function selectField(
  name: string,
  label: string,
  options: ResourceFieldOption[],
  required?: boolean
): ResourceField {
  return { name, label, type: "select", options, required }
}

function menuTypeTabsField(name: string, label: string): ResourceField {
  return {
    name,
    label,
    type: "menu-type-tabs",
    options: menuTypeOptions,
    colSpan: "full",
    hideLabel: true,
    required: true,
  }
}

function radioField(
  name: string,
  label: string,
  options: ResourceFieldOption[]
): ResourceField {
  return { name, label, type: "radio", options }
}

function menuParentSelectField(
  name: string,
  label: string,
  tooltip: string
): ResourceField {
  return {
    name,
    label,
    type: "menu-parent-select",
    placeholder: "选择父级菜单",
    tooltip,
  }
}

function menuIconSelectField(name: string, label: string): ResourceField {
  return { name, label, type: "menu-icon-select" }
}

function menuPermissionTreeField(name: string, label: string): ResourceField {
  return { name, label, type: "menu-permission-tree", colSpan: "full" }
}

function systemAppPermissionTreeField(
  name: string,
  label: string
): ResourceField {
  return { name, label, type: "system-app-permission-tree", colSpan: "full" }
}

function roleSelectField(
  name: string,
  label: string,
  required?: boolean
): ResourceField {
  return { name, label, type: "role-select", required }
}

function statusSwitchField(
  name: string,
  label: string,
  options?: Pick<ResourceField, "hiddenOnCreate">
): ResourceField {
  return { name, label, type: "status-switch", ...options }
}

function options<T extends string>(labels: Record<T, string>) {
  return Object.entries(labels).map(([value, label]) => ({
    value,
    label: String(label),
  }))
}

function visibleWhen(
  field: ResourceField,
  predicate: ResourceField["visibleWhen"]
): ResourceField {
  return { ...field, visibleWhen: predicate }
}

function isRoutePermission(values: ResourceFormValues) {
  return values.menu_type !== "F"
}

function isMenuRoutePermission(values: ResourceFormValues) {
  return values.menu_type === "C"
}

function hasPermissionCode(values: ResourceFormValues) {
  return values.menu_type !== "M"
}
