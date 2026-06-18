import { format } from "date-fns"

const DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss"
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 365 * DAY

const relativeUnits = [
  { label: "年", ms: YEAR },
  { label: "个月", ms: MONTH },
  { label: "天", ms: DAY },
  { label: "小时", ms: HOUR },
  { label: "分钟", ms: MINUTE },
  { label: "秒", ms: SECOND },
] as const

export function parseDateTime(value?: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatAbsoluteDateTime(
  value?: string | null,
  emptyText = "暂无"
) {
  const date = parseDateTime(value)
  if (date) {
    return format(date, DATETIME_FORMAT)
  }

  return value?.trim() || emptyText
}

export function formatRelativeTime(value?: string | null, emptyText = "暂无") {
  const date = parseDateTime(value)
  if (!date) {
    return value?.trim() || emptyText
  }

  const diff = Date.now() - date.getTime()
  const absDiff = Math.abs(diff)

  if (absDiff < 30 * SECOND) {
    return "刚刚"
  }

  const unit =
    relativeUnits.find((candidate) => absDiff >= candidate.ms) ??
    relativeUnits[relativeUnits.length - 1]
  const amount = Math.max(1, Math.floor(absDiff / unit.ms))

  return `${amount}${unit.label}${diff >= 0 ? "前" : "后"}`
}
