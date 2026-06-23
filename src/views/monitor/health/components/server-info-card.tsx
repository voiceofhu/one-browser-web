import { MonitorSmartphoneIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatAbsoluteDateTime } from "@/lib/datetime"
import type { Locale } from "@/local"

import type { HealthResponse } from "@/types/admin"

import { monitorText } from "../../_lib/i18n"
import { InfoRow } from "./info-row"
import { formatBootTime, formatDateTime, formatDuration } from "../lib/format"

const monitorCardClass = "bg-muted/35 py-0 shadow-none ring-0"

export function ServerInfoCard({
  health,
  lastUpdated,
  locale,
}: {
  health?: HealthResponse
  lastUpdated?: string
  locale: Locale
}) {
  const mt = (key: string) => monitorText(locale, key)
  const bootTime = health?.server?.boot_time
    ? formatDateTime(health.server.boot_time, locale)
    : formatBootTime(
        health?.server?.current_time,
        health?.server?.uptime_seconds,
        locale
      )

  return (
    <Card className={cn("h-full", monitorCardClass)}>
      <CardHeader className="gap-1.5 p-3.5 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MonitorSmartphoneIcon className="size-5 text-muted-foreground" />
          {mt("health.server.title")}
        </CardTitle>
        <CardDescription className="text-sm">
          {mt("health.server.descriptionPrefix")}
          {formatDateTime(lastUpdated, locale)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-3.5 pt-1 text-sm">
        <InfoRow
          label={mt("health.server.hostname")}
          value={health?.server?.hostname ?? mt("common.empty")}
        />
        <InfoRow
          label={mt("health.server.arch")}
          value={
            health?.server
              ? `${health.server.os} · ${health.server.arch}`
              : mt("common.empty")
          }
        />
        <InfoRow
          label={mt("health.server.uptime")}
          value={formatDuration(health?.server?.uptime_seconds, locale)}
        />
        <InfoRow label={mt("health.server.bootTime")} value={bootTime} />
        <InfoRow
          label={mt("health.server.currentTime")}
          value={formatAbsoluteDateTime(
            health?.server?.current_time,
            mt("common.empty")
          )}
        />
      </CardContent>
    </Card>
  )
}
