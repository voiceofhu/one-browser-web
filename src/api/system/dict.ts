import { buildQueryPath, http } from "@/lib/request"

import type {
  DictDataResource,
  DictTypeResource,
  ListParams,
  PageResponse,
  StatusFlag,
} from "@/types/admin"

type DictPayload = Record<string, unknown>

const DICT_TYPE_PATH = "/system/dict/type"
const DICT_DATA_PATH = "/system/dict/data"

export function listDictTypes(params?: ListParams) {
  return http.get<PageResponse<DictTypeResource>>(
    buildQueryPath(DICT_TYPE_PATH, params)
  )
}

export function createDictType(payload: DictPayload) {
  return http.post<DictTypeResource>(DICT_TYPE_PATH, payload)
}

export function updateDictType(dictId: number, payload: DictPayload) {
  return http.put<DictTypeResource>(`${DICT_TYPE_PATH}/${dictId}`, payload)
}

export function setDictTypeStatus(
  dictType: DictTypeResource,
  status: StatusFlag
) {
  return updateDictType(dictType.dict_id, {
    dict_name: dictType.dict_name,
    dict_type: dictType.dict_type,
    status,
    remark: dictType.remark,
  })
}

export function deleteDictType(dictId: number) {
  return http.del<void>(`${DICT_TYPE_PATH}/${dictId}`)
}

export function listDictData(params?: ListParams) {
  return http.get<PageResponse<DictDataResource>>(
    buildQueryPath(DICT_DATA_PATH, params)
  )
}

export function createDictData(payload: DictPayload) {
  return http.post<DictDataResource>(DICT_DATA_PATH, payload)
}

export function updateDictData(dictCode: number, payload: DictPayload) {
  return http.put<DictDataResource>(`${DICT_DATA_PATH}/${dictCode}`, payload)
}

export function deleteDictData(dictCode: number) {
  return http.del<void>(`${DICT_DATA_PATH}/${dictCode}`)
}
