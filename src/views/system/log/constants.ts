export const LOG_STATUS_LABELS = {
  "0": "成功",
  "1": "失败",
} as const

const BUSINESS_TYPE_LABELS: Record<number, string> = {
  0: "其他",
  1: "新增",
  2: "修改",
  3: "删除",
  4: "授权",
}

export function businessTypeLabel(value: number) {
  return BUSINESS_TYPE_LABELS[value] ?? String(value)
}
