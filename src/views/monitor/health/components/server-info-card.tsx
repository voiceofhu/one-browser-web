import { MonitorSmartphoneIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { HealthResponse } from "@/types/admin"

import { InfoRow } from "./info-row"
import { formatBootTime, formatDateTime, formatDuration } from "../lib/format"

const monitorCardClass = "bg-muted/35 py-0 shadow-none ring-0"

export function ServerInfoCard({
  health,
  lastUpdated,
}: {
  health?: HealthResponse
  lastUpdated?: string
}) {
  const bootTime = health?.server?.boot_time
    ? formatDateTime(health.server.boot_time)
    : formatBootTime(
        health?.server?.current_time,
        health?.server?.uptime_seconds
      )

  return (
    <Card className={cn("h-full", monitorCardClass)}>
      <CardHeader className="gap-1.5 p-3.5 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MonitorSmartphoneIcon className="size-5 text-muted-foreground" />
          服务器与版本
        </CardTitle>
        <CardDescription className="text-sm">
          服务器级别的信息（区别于进程运行时），最近更新：
          {formatDateTime(lastUpdated)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-3.5 pt-1 text-sm">
        <InfoRow
          label="服务器名称"
          value={health?.server?.hostname ?? "暂无"}
        />
        <InfoRow
          label="服务器系统"
          value={
            health?.server
              ? `${health.server.os} · ${health.server.arch}`
              : "暂无"
          }
        />
        <InfoRow
          label="服务器运行时长"
          value={formatDuration(health?.server?.uptime_seconds)}
        />
        <InfoRow label="服务器开机时间" value={bootTime} />
        <InfoRow
          label="当前时间"
          value={formatDateTime(health?.server?.current_time)}
        />
      </CardContent>
    </Card>
  )
}
