export type StatusFlag = "0" | "1"
export type SexFlag = "0" | "1" | "2"
export type DataScopeFlag = "1" | "2" | "3" | "4" | "5"
export type MenuTypeFlag = "M" | "C" | "F"
export type VisibleFlag = "0" | "1"
export type YesNoFlag = "Y" | "N"

export interface CurrentUser {
  user_id: number
  user_name: string
  nick_name: string
  email: string
  avatar: string
  user_type: string
}

export interface CurrentUserEnvelope {
  user: CurrentUser
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
}

export interface ListParams {
  page?: number
  page_size?: number
  keyword?: string
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
  menu_check_strictly: boolean
  dept_check_strictly: boolean
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
  component: string | null
  route_query: string | null
  route_name: string
  is_frame: boolean
  is_cache: boolean
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
