import { buildQueryPath, http } from "@/lib/request"

import type { ListParams, MenuResource, PageResponse } from "@/types/admin"

type MenuPayload = Record<string, unknown>

const MENU_PATH = "/system/menu"

export function listMenus(params?: ListParams) {
  return http.get<PageResponse<MenuResource>>(buildQueryPath(MENU_PATH, params))
}

export function createMenu(payload: MenuPayload) {
  return http.post<MenuResource>(MENU_PATH, payload)
}

export function updateMenu(menuId: number, payload: MenuPayload) {
  return http.put<MenuResource>(`${MENU_PATH}/${menuId}`, payload)
}

export function deleteMenu(menuId: number) {
  return http.del<void>(`${MENU_PATH}/${menuId}`)
}
