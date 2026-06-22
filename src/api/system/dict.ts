import { buildQueryPath, http } from "@/lib/request"

import type {
  DictDataResource,
  DictTypeResource,
  ListParams,
  PageResponse,
  ResourceMutationResult,
  StatusFlag,
  YesNoFlag,
} from "@/types/admin"

type DictPayload = Record<string, unknown>

const DICT_TYPE_PATH = "/system/dict-types"
const DICT_DATA_PATH = "/system/dict-data"

export function listDictTypes(params?: ListParams) {
  return http.get<PageResponse<DictTypeResource>>(
    buildQueryPath(DICT_TYPE_PATH, params)
  )
}

export function getDictType(dictId: number) {
  return http.get<DictTypeResource>(`${DICT_TYPE_PATH}/${dictId}`)
}

export function createDictType(payload: DictPayload) {
  return http.post<ResourceMutationResult>(DICT_TYPE_PATH, payload)
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

export function getDictData(dictCode: number) {
  return http.get<DictDataResource>(`${DICT_DATA_PATH}/${dictCode}`)
}

export function createDictData(payload: DictPayload) {
  return http.post<ResourceMutationResult>(DICT_DATA_PATH, payload)
}

export function updateDictData(dictCode: number, payload: DictPayload) {
  return http.put<DictDataResource>(`${DICT_DATA_PATH}/${dictCode}`, payload)
}

export function setDictDataStatus(
  dictData: DictDataResource,
  status: StatusFlag
) {
  return updateDictData(
    dictData.dict_code,
    buildDictDataPayload(dictData, { status })
  )
}

export function setDictDataDefault(
  dictData: DictDataResource,
  isDefault: YesNoFlag
) {
  return updateDictData(
    dictData.dict_code,
    buildDictDataPayload(dictData, { is_default: isDefault })
  )
}

export function setDictDataOrder(
  dictData: DictDataResource,
  dictSort: number
) {
  return updateDictData(
    dictData.dict_code,
    buildDictDataPayload(dictData, { dict_sort: dictSort })
  )
}

function buildDictDataPayload(
  dictData: DictDataResource,
  overrides: Partial<DictPayload>
) {
  return {
    dict_sort: dictData.dict_sort,
    dict_label: dictData.dict_label,
    dict_value: dictData.dict_value,
    dict_type: dictData.dict_type,
    css_class: dictData.css_class,
    list_class: dictData.list_class,
    is_default: dictData.is_default,
    status: dictData.status,
    remark: dictData.remark,
    ...overrides,
  }
}

export function deleteDictData(dictCode: number) {
  return http.del<void>(`${DICT_DATA_PATH}/${dictCode}`)
}
