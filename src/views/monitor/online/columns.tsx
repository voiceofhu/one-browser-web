"use client"

/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from "@tanstack/react-table"

import { useTranslation } from "@/components/providers/language-context"
import { OverflowTooltipText } from "@/components/overflow-tooltip-text"
import { Badge } from "@/components/ui/badge"
import {
  formatAbsoluteDateTime,
  formatRelativeTime,
  parseDateTime,
} from "@/lib/datetime"
import type { Locale } from "@/lib/i18n"
import type { OnlineUserResource } from "@/types/admin"
import { ResourceTableColumnHeader } from "@/views/system/_components/resource/table"

import { monitorText } from "../_lib/i18n"

export function createOnlineUserColumns(
  locale: Locale
): ColumnDef<OnlineUserResource>[] {
  return [
    textColumn(
      "user_name",
      monitorText(locale, "online.columns.loginAccount"),
      "w-40"
    ),
    textColumn(
      "ip_addr",
      monitorText(locale, "online.columns.ipAddress"),
      "w-40"
    ),
    textColumn(
      "browser",
      monitorText(locale, "online.columns.browser"),
      "min-w-40 max-w-64"
    ),
    textColumn(
      "os",
      monitorText(locale, "online.columns.os"),
      "min-w-36 max-w-56"
    ),
    {
      accessorKey: "expires_in",
      header: ({ column }) =>
        tableHeader(column, monitorText(locale, "online.columns.expiresIn")),
      cell: ({ row }) => <ExpiresInBadge seconds={row.original.expires_in} />,
      meta: {
        label: monitorText(locale, "online.columns.expiresIn"),
        cellClassName: "w-36",
      },
    },
    {
      accessorKey: "login_at",
      header: ({ column }) =>
        tableHeader(column, monitorText(locale, "online.columns.loginTime")),
      cell: ({ row }) => <DateTimeCell value={row.original.login_at} />,
      meta: {
        label: monitorText(locale, "online.columns.loginTime"),
        cellClassName: "w-44",
      },
    },
  ]
}

function textColumn<TData, TKey extends keyof TData & string>(
  key: TKey,
  label: string,
  cellClassName = "max-w-64"
): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => tableHeader(column, label),
    cell: ({ getValue }) => <TextCell value={getValue()} />,
    meta: { label, cellClassName },
  }
}

function tableHeader<TData, TValue>(
  column: Parameters<
    typeof ResourceTableColumnHeader<TData, TValue>
  >[0]["column"],
  title: string
) {
  return <ResourceTableColumnHeader column={column} title={title} />
}

function TextCell({ value }: { value: unknown }) {
  const { locale } = useTranslation()
  const isEmpty = value == null || value === ""
  const text = isEmpty ? monitorText(locale, "common.empty") : String(value)

  if (isEmpty) {
    return <span className="block truncate">{text}</span>
  }

  return <OverflowTooltipText text={text} />
}

function DateTimeCell({ value }: { value: string }) {
  const { locale } = useTranslation()

  return (
    <span
      title={formatAbsoluteDateTime(value, monitorText(locale, "common.empty"))}
    >
      {formatDateTime(value, locale)}
    </span>
  )
}

function ExpiresInBadge({ seconds }: { seconds: number }) {
  const { locale } = useTranslation()
  const expired = seconds <= 0

  return (
    <Badge variant={expired ? "destructive" : "outline"}>
      {expired
        ? monitorText(locale, "online.expired")
        : formatDuration(seconds, locale)}
    </Badge>
  )
}

function formatDuration(seconds: number, locale: Locale) {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const restSeconds = totalSeconds % 60

  if (hours > 0) {
    if (locale === "en-US") {
      return minutes > 0
        ? joinDurationParts(locale, [
            durationPart(hours, "duration.hour", locale),
            durationPart(minutes, "duration.minute", locale),
          ])
        : durationPart(hours, "duration.hour", locale)
    }

    return minutes > 0
      ? joinDurationParts(locale, [
          durationPart(hours, "duration.hour", locale),
          durationPart(minutes, "duration.minute", locale),
        ])
      : durationPart(hours, "duration.hour", locale)
  }
  if (minutes > 0) {
    if (locale === "en-US") {
      return restSeconds > 0
        ? joinDurationParts(locale, [
            durationPart(minutes, "duration.minute", locale),
            durationPart(restSeconds, "duration.second", locale),
          ])
        : durationPart(minutes, "duration.minute", locale)
    }

    return restSeconds > 0
      ? joinDurationParts(locale, [
          durationPart(minutes, "duration.minute", locale),
          durationPart(restSeconds, "duration.second", locale),
        ])
      : durationPart(minutes, "duration.minute", locale)
  }

  return durationPart(restSeconds, "duration.second", locale)
}

function durationPart(value: number, unitKey: string, locale: Locale) {
  return `${value}${monitorText(locale, unitKey)}`
}

function joinDurationParts(locale: Locale, parts: string[]) {
  return locale === "en-US" ? parts.join(" ") : parts.join("")
}

function formatDateTime(value: string, locale: Locale) {
  if (locale !== "en-US") {
    return formatRelativeTime(value, monitorText(locale, "common.empty"))
  }

  const date = parseDateTime(value)
  if (!date) {
    return value?.trim() || monitorText(locale, "common.empty")
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  if (absSeconds < 30) {
    return monitorText(locale, "time.justNow")
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
