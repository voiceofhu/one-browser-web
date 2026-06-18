import { formatRelativeTime } from "@/lib/datetime"

export function formatBytes(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "暂无"
  }

  const units = ["B", "KB", "MB", "GB", "TB"]
  let nextValue = value
  let unitIndex = 0

  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024
    unitIndex += 1
  }

  return `${nextValue.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function formatPercent(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "暂无"
  }

  return `${value.toFixed(1)}%`
}

export function formatLoad(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0.00"
  }

  return value.toFixed(2)
}

export function formatInteger(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "暂无"
  }

  return Math.max(0, Math.round(value)).toString()
}

export function formatSeconds(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "暂无"
  }

  return `${value.toFixed(1)} s`
}

export function formatDuration(seconds?: number | null) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return "暂无"
  }

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟`
  }

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }

  if (minutes > 0) {
    return `${minutes}分钟`
  }

  return `${Math.max(0, Math.floor(seconds))}秒`
}

export function formatDateTime(value?: string | null) {
  return formatRelativeTime(value)
}

export function formatBootTime(
  currentTime?: string | null,
  uptimeSeconds?: number | null
) {
  if (!currentTime || typeof uptimeSeconds !== "number") {
    return "暂无"
  }

  const current = new Date(currentTime)
  if (Number.isNaN(current.getTime())) {
    return "暂无"
  }

  return formatDateTime(
    new Date(current.getTime() - uptimeSeconds * 1000).toISOString()
  )
}

export function shortCommit(commit?: string | null) {
  if (!commit || commit === "unknown") {
    return "暂无"
  }

  return commit.slice(0, 8)
}

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, value))
}
