import { formatRelativeTime, parseDateTime } from "@/lib/datetime"
import type { Locale } from "@/local"

import { monitorText } from "../../_lib/i18n"

function emptyText(locale?: Locale) {
  return monitorText(locale, "common.empty")
}

export function formatBytes(value?: number | null, locale?: Locale) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return emptyText(locale)
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

export function formatPercent(value?: number | null, locale?: Locale) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return emptyText(locale)
  }

  return `${value.toFixed(1)}%`
}

export function formatLoad(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0.00"
  }

  return value.toFixed(2)
}

export function formatInteger(value?: number | null, locale?: Locale) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return emptyText(locale)
  }

  return Math.max(0, Math.round(value)).toString()
}

export function formatSeconds(value?: number | null, locale?: Locale) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return emptyText(locale)
  }

  return `${value.toFixed(1)} s`
}

export function formatDuration(seconds?: number | null, locale?: Locale) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return emptyText(locale)
  }

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (locale === "en-US") {
    if (days > 0) {
      return joinDurationParts(locale, [
        durationPart(days, "duration.day", locale),
        durationPart(hours, "duration.hour", locale),
        durationPart(minutes, "duration.minute", locale),
      ])
    }

    if (hours > 0) {
      return joinDurationParts(locale, [
        durationPart(hours, "duration.hour", locale),
        durationPart(minutes, "duration.minute", locale),
      ])
    }

    if (minutes > 0) {
      return durationPart(minutes, "duration.minute", locale)
    }

    return durationPart(
      Math.max(0, Math.floor(seconds)),
      "duration.second",
      locale
    )
  }

  if (days > 0) {
    return joinDurationParts(locale, [
      durationPart(days, "duration.day", locale),
      durationPart(hours, "duration.hour", locale),
      durationPart(minutes, "duration.minute", locale),
    ])
  }

  if (hours > 0) {
    return joinDurationParts(locale, [
      durationPart(hours, "duration.hour", locale),
      durationPart(minutes, "duration.minute", locale),
    ])
  }

  if (minutes > 0) {
    return durationPart(minutes, "duration.minute", locale)
  }

  return durationPart(
    Math.max(0, Math.floor(seconds)),
    "duration.second",
    locale
  )
}

export function formatDateTime(value?: string | null, locale?: Locale) {
  if (locale === "en-US") {
    return formatRelativeTimeEn(value)
  }

  return formatRelativeTime(value)
}

export function formatBootTime(
  currentTime?: string | null,
  uptimeSeconds?: number | null,
  locale?: Locale
) {
  if (!currentTime || typeof uptimeSeconds !== "number") {
    return emptyText(locale)
  }

  const current = new Date(currentTime)
  if (Number.isNaN(current.getTime())) {
    return emptyText(locale)
  }

  return formatDateTime(
    new Date(current.getTime() - uptimeSeconds * 1000).toISOString(),
    locale
  )
}

export function shortCommit(commit?: string | null, locale?: Locale) {
  if (!commit || commit === "unknown") {
    return emptyText(locale)
  }

  return commit.slice(0, 8)
}

function formatRelativeTimeEn(value?: string | null) {
  const date = parseDateTime(value)
  if (!date) {
    return value?.trim() || emptyText("en-US")
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  if (absSeconds < 30) {
    return "just now"
  }

  const units = [
    { unit: "year", seconds: 365 * 24 * 60 * 60 },
    { unit: "month", seconds: 30 * 24 * 60 * 60 },
    { unit: "day", seconds: 24 * 60 * 60 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ] as const
  const match = units.find((item) => absSeconds >= item.seconds) ?? units[5]
  const amount = Math.trunc(diffSeconds / match.seconds)

  return new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(
    amount,
    match.unit
  )
}

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, value))
}

function durationPart(value: number, unitKey: string, locale?: Locale) {
  return `${value}${monitorText(locale, unitKey)}`
}

function joinDurationParts(locale: Locale | undefined, parts: string[]) {
  return locale === "en-US" ? parts.join(" ") : parts.join("")
}
