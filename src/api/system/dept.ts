import { buildQueryPath, http } from "@/lib/request"

import type {
  DeptResource,
  ListParams,
  PageResponse,
  StatusFlag,
} from "@/types/admin"

type DeptPayload = Record<string, unknown>

const DEPT_PATH = "/system/dept"

export function listDepts(params?: ListParams) {
  return http.get<PageResponse<DeptResource>>(buildQueryPath(DEPT_PATH, params))
}

export function getDept(deptId: number) {
  return http.get<DeptResource>(`${DEPT_PATH}/${deptId}`)
}

export function createDept(payload: DeptPayload) {
  return http.post<DeptResource>(DEPT_PATH, payload)
}

export function updateDept(deptId: number, payload: DeptPayload) {
  return http.put<DeptResource>(`${DEPT_PATH}/${deptId}`, payload)
}

export function setDeptStatus(dept: DeptResource, status: StatusFlag) {
  return updateDept(dept.dept_id, buildDeptPayload(dept, { status }))
}

export function setDeptOrder(dept: DeptResource, orderNum: number) {
  return updateDept(dept.dept_id, buildDeptPayload(dept, { order_num: orderNum }))
}

function buildDeptPayload(
  dept: DeptResource,
  overrides: Partial<DeptPayload>
) {
  return {
    parent_id: dept.parent_id,
    ancestors: dept.ancestors,
    dept_name: dept.dept_name,
    order_num: dept.order_num,
    leader: dept.leader,
    phone: dept.phone,
    email: dept.email,
    status: dept.status,
    ...overrides,
  }
}

export function deleteDept(deptId: number) {
  return http.del<void>(`${DEPT_PATH}/${deptId}`)
}
