export type StatusFlag = "0" | "1"
export type SexFlag = "0" | "1" | "2"
export type DataScopeFlag = "1" | "2" | "3" | "4" | "5"
export type MenuTypeFlag = "M" | "C" | "F"
export type VisibleFlag = "0" | "1"
export type YesNoFlag = "Y" | "N"
export type LogStatusFlag = "0" | "1"

export interface CurrentUser {
  user_id: number
  user_name: string
  nick_name: string
  email: string
  phone_number: string
  sex: SexFlag
  avatar: string
  user_type: string
}

export interface CurrentUserEnvelope {
  user: CurrentUser
}

export interface AuthPermissions {
  roles: string[]
  permissions: string[]
  routes: AuthRoute[]
}

export interface AuthRoute {
  id: number
  parent_id: number | null
  name: string
  path: string
  hidden: boolean
  menu_type: MenuTypeFlag
  meta: AuthRouteMeta
  children?: AuthRoute[]
}

export interface AuthRouteMeta {
  title: string
  icon: string
}

export interface LoginResponse {
  user: CurrentUser
  expires_in: number
}

export interface HealthResponse {
  status: string
  service: string
  environment: string
  postgres: string
  sea_orm: string
  redis: string
  updated_at?: string
  server?: HealthServerSnapshot
  process?: HealthProcessSnapshot
  system?: HealthSystemSnapshot
}

export interface HealthServerSnapshot {
  hostname: string
  os: string
  arch: string
  uptime_seconds: number | null
  boot_time?: string | null
  current_time: string
}

export interface HealthProcessSnapshot {
  pid: number
  version: string
  commit: string
  runtime: string
  runtime_version?: string | null
  started_at: string
  uptime_seconds: number
  cpu_usage_percent: number | null
  cpu_time_seconds: number | null
  user_cpu_seconds: number | null
  system_cpu_seconds: number | null
  rss_bytes: number | null
  peak_rss_bytes: number | null
  memory_footprint_bytes?: number | null
  virtual_memory_bytes: number | null
  data_bytes: number | null
  threads: number | null
  fd_count: number | null
  fd_limit?: number | null
  executable: string
}

export interface HealthSystemSnapshot {
  load_average: HealthLoadAverage | null
  memory: HealthMemorySnapshot | null
  storage: HealthStorageSnapshot
}

export interface HealthLoadAverage {
  one: number
  five: number
  fifteen: number
  cores?: number
  usage_percent?: number
}

export interface HealthMemorySnapshot {
  total_bytes: number
  available_bytes: number
  used_bytes: number
  usage_percent: number
}

export interface HealthStorageSnapshot {
  path: string
  total_bytes: number | null
  used_bytes: number | null
  usage_percent: number | null
}

export interface ListParams {
  page?: number
  page_size?: number
  keyword?: string
  status?: StatusFlag
  dict_type?: string
}

export interface PageResponse<T> {
  items: T[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface UserResource {
  user_id: number
  is_super_admin: boolean
  dept_id: number | null
  user_name: string
  nick_name: string
  user_type: string
  email: string
  phone_number: string
  sex: SexFlag
  avatar: string
  status: StatusFlag
  login_ip: string
  login_at: string | null
  created_at: string
  updated_at: string | null
  remark: string | null
}

export interface RoleResource {
  role_id: number
  role_name: string
  role_key: string
  role_sort: number
  data_scope: DataScopeFlag
  status: StatusFlag
  created_at: string
  updated_at: string | null
  remark: string | null
}

export interface MenuResource {
  menu_id: number
  menu_name: string
  parent_id: number | null
  order_num: number
  path: string
  menu_type: MenuTypeFlag
  visible: VisibleFlag
  status: StatusFlag
  perms: string | null
  icon: string
  created_at: string
  updated_at: string | null
  remark: string
}

export interface DeptResource {
  dept_id: number
  parent_id: number | null
  ancestors: string
  dept_name: string
  order_num: number
  leader: string | null
  phone: string | null
  email: string | null
  status: StatusFlag
  created_at: string
  updated_at: string | null
}

export interface PostResource {
  post_id: number
  post_code: string
  post_name: string
  post_sort: number
  status: StatusFlag
  created_at: string
  updated_at: string | null
  remark: string | null
}

export interface DictTypeResource {
  dict_id: number
  dict_name: string
  dict_type: string
  status: StatusFlag
  remark: string | null
}

export interface DictDataResource {
  dict_code: number
  dict_sort: number
  dict_label: string
  dict_value: string
  dict_type: string
  css_class: string | null
  list_class: string | null
  is_default: YesNoFlag
  status: StatusFlag
  remark: string | null
}

export interface OperationLogResource {
  oper_id: number
  title: string
  business_type: number
  method: string
  request_method: string
  operator_type: number
  oper_name: string
  dept_name: string
  oper_url: string
  oper_ip: string
  oper_location: string
  oper_param: string
  json_result: string
  status: LogStatusFlag
  error_msg: string
  operated_at: string
  cost_time: number
}

export interface LoginLogResource {
  info_id: number
  user_name: string
  ip_addr: string
  login_location: string
  browser: string
  os: string
  status: LogStatusFlag
  msg: string
  login_at: string
}
