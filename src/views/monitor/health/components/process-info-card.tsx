import { ServerCogIcon } from "lucide-react"

import { NumberTicker } from "@/components/number-ticker"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Locale } from "@/local"
import { cn } from "@/lib/utils"

import type { HealthResponse } from "@/types/admin"

import { monitorText } from "../../_lib/i18n"
import { InfoRow } from "./info-row"
import {
  formatBytes,
  formatDateTime,
  formatDuration,
  formatInteger,
  formatPercent,
  formatSeconds,
  shortCommit,
} from "../lib/format"

const monitorCardClass = "bg-muted/35 py-0 shadow-none ring-0"

export function ProcessInfoCard({
  health,
  locale,
}: {
  health?: HealthResponse
  locale: Locale
}) {
  const mt = (key: string) => monitorText(locale, key)
  const process = health?.process
  const hasDataBytes =
    typeof process?.data_bytes === "number" &&
    Number.isFinite(process.data_bytes)
  const hasVirtualMemory =
    typeof process?.virtual_memory_bytes === "number" &&
    Number.isFinite(process.virtual_memory_bytes)
  const hasMemoryFootprint =
    typeof process?.memory_footprint_bytes === "number" &&
    Number.isFinite(process.memory_footprint_bytes)
  const memoryUsagePercent = percentOf(
    process?.rss_bytes,
    health?.system?.memory?.total_bytes
  )
  const fdUsagePercent = percentOf(process?.fd_count, process?.fd_limit)

  return (
    <Card className={cn("h-full", monitorCardClass)}>
      <CardHeader className="gap-1.5 p-3.5 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ServerCogIcon className="size-5 text-muted-foreground" />
          {mt("health.process.title")}
        </CardTitle>
        <CardDescription className="text-sm">
          {mt("health.process.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-3.5 pt-1 lg:flex-row">
        <div className="min-w-0 rounded-lg bg-background p-3 lg:w-[18rem]">
          <p className="text-sm font-medium text-muted-foreground">
            {mt("health.process.deployment")}
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            <InfoRow
              label={mt("health.process.version")}
              value={process?.version ?? mt("common.empty")}
            />
            <InfoRow
              label="Git Commit"
              value={
                process?.commit && process.commit !== "unknown" ? (
                  <span title={process.commit}>
                    {shortCommit(process.commit, locale)}
                  </span>
                ) : (
                  mt("common.empty")
                )
              }
            />
            <InfoRow
              label="PID"
              value={process?.pid ? `#${process.pid}` : mt("common.empty")}
            />
            <InfoRow
              label={mt("health.process.executable")}
              value={process?.executable ?? mt("common.empty")}
            />
            <InfoRow
              label={mt("health.process.startedAt")}
              value={formatDateTime(process?.started_at, locale)}
            />
            <InfoRow
              label={mt("health.process.uptime")}
              value={formatDuration(process?.uptime_seconds, locale)}
            />
            <InfoRow
              label={mt("health.process.runtime")}
              value={process?.runtime ?? mt("common.empty")}
            />
            <InfoRow
              label={mt("health.process.rustVersion")}
              value={
                <RustVersionValue
                  value={process?.runtime_version}
                  locale={locale}
                />
              }
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 rounded-lg bg-background p-3">
          <p className="text-sm font-medium text-muted-foreground">
            {mt("health.process.metrics")}
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <MetricRow
              label={mt("health.process.cpuUsage")}
              value={process?.cpu_usage_percent}
              formatValue={(value) => formatPercent(value, locale)}
              emptyText={mt("common.empty")}
            />
            <MetricRow
              label={mt("health.process.cpuTime")}
              value={process?.cpu_time_seconds}
              formatValue={(value) => formatSeconds(value, locale)}
              emptyText={mt("common.empty")}
            />
            <MetricRow
              label={mt("health.process.userCpu")}
              value={process?.user_cpu_seconds}
              formatValue={(value) => formatSeconds(value, locale)}
              emptyText={mt("common.empty")}
            />
            <MetricRow
              label={mt("health.process.systemCpu")}
              value={process?.system_cpu_seconds}
              formatValue={(value) => formatSeconds(value, locale)}
              emptyText={mt("common.empty")}
            />
            <MetricRow
              label={mt("health.process.rssMemory")}
              value={process?.rss_bytes}
              formatValue={(value) => formatBytes(value, locale)}
              emptyText={mt("common.empty")}
            />
            <MetricRow
              label={mt("health.process.memoryShare")}
              value={memoryUsagePercent}
              formatValue={formatTinyPercent}
              emptyText={mt("common.empty")}
            />
            <MetricRow
              label={mt("health.process.peakRss")}
              value={process?.peak_rss_bytes}
              formatValue={(value) => formatBytes(value, locale)}
              emptyText={mt("common.empty")}
            />
            {hasMemoryFootprint ? (
              <MetricRow
                label={mt("health.process.memoryFootprint")}
                value={process?.memory_footprint_bytes}
                formatValue={(value) => formatBytes(value, locale)}
                emptyText={mt("common.empty")}
              />
            ) : null}
            {hasVirtualMemory ? (
              <MetricRow
                label={mt("health.process.virtualMemory")}
                value={process?.virtual_memory_bytes}
                formatValue={(value) => formatBytes(value, locale)}
                emptyText={mt("common.empty")}
              />
            ) : null}
            {hasDataBytes ? (
              <MetricRow
                label={mt("health.process.dataMemory")}
                value={process?.data_bytes}
                formatValue={(value) => formatBytes(value, locale)}
                emptyText={mt("common.empty")}
              />
            ) : null}
            <MetricRow
              label={mt("health.process.threads")}
              value={process?.threads}
              formatValue={(value) => formatInteger(value, locale)}
              emptyText={mt("common.empty")}
            />
            <MetricRow
              label={mt("health.process.fdCount")}
              value={process?.fd_count}
              formatValue={(value) => formatInteger(value, locale)}
              emptyText={mt("common.empty")}
            />
            <MetricRow
              label={mt("health.process.fdLimit")}
              value={process?.fd_limit}
              formatValue={(value) => formatInteger(value, locale)}
              emptyText={mt("common.empty")}
            />
            <MetricRow
              label={mt("health.process.fdUsage")}
              value={fdUsagePercent}
              formatValue={(value) => formatPercent(value, locale)}
              emptyText={mt("common.empty")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RustVersionValue({
  value,
  locale,
}: {
  value?: string | null
  locale: Locale
}) {
  if (!value || value === "unknown") {
    return monitorText(locale, "common.empty")
  }

  const shortVersion = rustVersionNumber(value)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted underline-offset-4">
          {shortVersion}
        </span>
      </TooltipTrigger>
      <TooltipContent>{value}</TooltipContent>
    </Tooltip>
  )
}

function rustVersionNumber(value: string) {
  return value.replace(/^rustc\s+/i, "").split(/\s+/)[0] || value
}

function percentOf(value?: number | null, total?: number | null) {
  if (
    typeof value !== "number" ||
    typeof total !== "number" ||
    !Number.isFinite(value) ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return null
  }

  return (value / total) * 100
}

function formatTinyPercent(value: number) {
  if (value > 0 && value < 0.1) {
    return "<0.1%"
  }

  return formatPercent(value)
}

function MetricRow({
  label,
  value,
  formatValue,
  emptyText,
}: {
  label: string
  value?: number | null
  formatValue: (value: number) => string
  emptyText: string
}) {
  const hasValue = typeof value === "number" && Number.isFinite(value)

  return (
    <InfoRow
      label={label}
      value={
        hasValue ? (
          <NumberTicker
            value={value}
            formatValue={formatValue}
            className="font-semibold"
          />
        ) : (
          emptyText
        )
      }
    />
  )
}
