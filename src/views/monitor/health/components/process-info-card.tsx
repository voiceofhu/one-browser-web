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
import { cn } from "@/lib/utils"

import type { HealthResponse } from "@/types/admin"

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

export function ProcessInfoCard({ health }: { health?: HealthResponse }) {
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
          后端进程
        </CardTitle>
        <CardDescription className="text-sm">
          所有运行指标均来自当前 one-browser-server 后端进程。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-3.5 pt-1 lg:flex-row">
        <div className="min-w-0 rounded-lg bg-background p-3 lg:w-[18rem]">
          <p className="text-sm font-medium text-muted-foreground">部署信息</p>
          <div className="mt-3 flex flex-col gap-2.5">
            <InfoRow label="版本号" value={process?.version ?? "暂无"} />
            <InfoRow
              label="Git Commit"
              value={
                process?.commit && process.commit !== "unknown" ? (
                  <span title={process.commit}>
                    {shortCommit(process.commit)}
                  </span>
                ) : (
                  "暂无"
                )
              }
            />
            <InfoRow
              label="PID"
              value={process?.pid ? `#${process.pid}` : "暂无"}
            />
            <InfoRow label="可执行文件" value={process?.executable ?? "暂无"} />
            <InfoRow
              label="启动时间"
              value={formatDateTime(process?.started_at)}
            />
            <InfoRow
              label="进程运行时长"
              value={formatDuration(process?.uptime_seconds)}
            />
            <InfoRow label="运行时" value={process?.runtime ?? "暂无"} />
            <InfoRow
              label="Rust 版本"
              value={<RustVersionValue value={process?.runtime_version} />}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 rounded-lg bg-background p-3">
          <p className="text-sm font-medium text-muted-foreground">运行指标</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <MetricRow
              label="CPU 占用"
              value={process?.cpu_usage_percent}
              formatValue={formatPercent}
            />
            <MetricRow
              label="CPU 时间"
              value={process?.cpu_time_seconds}
              formatValue={formatSeconds}
            />
            <MetricRow
              label="用户态 CPU"
              value={process?.user_cpu_seconds}
              formatValue={formatSeconds}
            />
            <MetricRow
              label="内核态 CPU"
              value={process?.system_cpu_seconds}
              formatValue={formatSeconds}
            />
            <MetricRow
              label="RSS 内存"
              value={process?.rss_bytes}
              formatValue={formatBytes}
            />
            <MetricRow
              label="内存占比"
              value={memoryUsagePercent}
              formatValue={formatTinyPercent}
            />
            <MetricRow
              label="峰值 RSS"
              value={process?.peak_rss_bytes}
              formatValue={formatBytes}
            />
            {hasMemoryFootprint ? (
              <MetricRow
                label="内存足迹"
                value={process?.memory_footprint_bytes}
                formatValue={formatBytes}
              />
            ) : null}
            {hasVirtualMemory ? (
              <MetricRow
                label="虚拟内存"
                value={process?.virtual_memory_bytes}
                formatValue={formatBytes}
              />
            ) : null}
            {hasDataBytes ? (
              <MetricRow
                label="Data 内存"
                value={process?.data_bytes}
                formatValue={formatBytes}
              />
            ) : null}
            <MetricRow
              label="线程数"
              value={process?.threads}
              formatValue={formatInteger}
            />
            <MetricRow
              label="FD 数"
              value={process?.fd_count}
              formatValue={formatInteger}
            />
            <MetricRow
              label="FD 上限"
              value={process?.fd_limit}
              formatValue={formatInteger}
            />
            <MetricRow
              label="FD 使用率"
              value={fdUsagePercent}
              formatValue={formatPercent}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RustVersionValue({ value }: { value?: string | null }) {
  if (!value || value === "unknown") {
    return "暂无"
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
}: {
  label: string
  value?: number | null
  formatValue: (value: number) => string
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
          "暂无"
        )
      }
    />
  )
}
