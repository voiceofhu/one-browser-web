import { buildQueryPath, http } from "@/lib/request"

import type { DeptResource, ListParams, PageResponse } from "@/types/admin"

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

export function deleteDept(deptId: number) {
  return http.del<void>(`${DEPT_PATH}/${deptId}`)
}
