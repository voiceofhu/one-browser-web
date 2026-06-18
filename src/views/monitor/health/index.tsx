import { useLayoutEffect, useMemo, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { gsap } from "gsap"
import {
  CpuIcon,
  HardDriveIcon,
  MemoryStickIcon,
  RefreshCwIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HEALTH_STREAM_PATH, getHealth } from "@/api/monitor/health"
import { monitorQueryKeys } from "@/lib/query-keys"
import { useSse, type SseStatus } from "@/lib/sse"
import { cn } from "@/lib/utils"

import type { HealthResponse } from "@/types/admin"

import { ProcessInfoCard } from "./components/process-info-card"
import { QuickStatCard } from "./components/quick-stat-card"
import { ServerInfoCard } from "./components/server-info-card"
import { formatBytes, formatLoad, formatPercent } from "./lib/format"

export default function HealthPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const healthQuery = useQuery({
    queryKey: monitorQueryKeys.health,
    queryFn: getHealth,
  })
  const healthStream = useSse<HealthResponse>({
    path: HEALTH_STREAM_PATH,
    eventName: "health",
  })

  const health = healthStream.data ?? healthQuery.data
  const load = health?.system?.load_average
  const memory = health?.system?.memory
  const storage = health?.system?.storage
  const process = health?.process
  const cpuUsagePercent = load?.usage_percent ?? 0
  const lastUpdated = health?.updated_at ?? health?.server?.current_time

  const quickStats = useMemo(
    () => [
      {
        label: "CPU",
        icon: CpuIcon,
        value: cpuUsagePercent,
        formatValue: formatPercent,
        hint: load
          ? `负载 ${formatLoad(load.one)} / ${formatLoad(load.five)} / ${formatLoad(load.fifteen)}`
          : "等待 CPU 负载返回。",
        percent: cpuUsagePercent,
      },
      {
        label: "内存",
        icon: MemoryStickIcon,
        value: memory?.usage_percent,
        formatValue: formatPercent,
        hint:
          memory && process
            ? `限制 ${formatBytes(memory.total_bytes)}，进程占用 ${formatBytes(process.rss_bytes)}`
            : "等待内存指标返回。",
        percent: memory?.usage_percent,
      },
      {
        label: "存储",
        icon: HardDriveIcon,
        value: storage?.usage_percent,
        formatValue: formatPercent,
        hint:
          typeof storage?.used_bytes === "number" &&
          typeof storage.total_bytes === "number"
            ? `${formatBytes(storage.used_bytes)} / ${formatBytes(storage.total_bytes)}`
            : "等待存储指标返回。",
        percent: storage?.usage_percent,
      },
    ],
    [cpuUsagePercent, load, memory, process, storage]
  )

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) {
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.querySelectorAll("[data-monitor-animate]"),
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.48,
          ease: "power2.out",
          stagger: 0.06,
        }
      )
    }, root)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-background">
      <div
        ref={rootRef}
        className="flex w-full flex-col gap-4 px-4 pt-4 pb-5 lg:px-5"
      >
        <header
          data-monitor-animate
          className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-normal">服务监控</h1>
            <p className="text-sm text-muted-foreground">
              聚焦后台服务器程序，CPU / 内存 / 存储。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ConnectionBadge status={healthStream.status} />
            {healthStream.status === "closed" ? (
              <Button
                type="button"
                variant="outline"
                onClick={healthStream.reconnect}
              >
                <RefreshCwIcon data-icon="inline-start" />
                重新连接
              </Button>
            ) : null}
          </div>
        </header>

        {healthQuery.error ? (
          <Alert data-monitor-animate variant="destructive">
            <AlertTitle>健康检查返回错误</AlertTitle>
            <AlertDescription>
              {getErrorMessage(healthQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {healthStream.error ? (
          <Alert data-monitor-animate>
            <AlertTitle>实时连接状态</AlertTitle>
            <AlertDescription>{healthStream.error}</AlertDescription>
          </Alert>
        ) : null}

        <section
          data-monitor-animate
          className="grid grid-cols-1 gap-3 lg:grid-cols-2"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-3">
            {quickStats.map((stat) => (
              <QuickStatCard key={stat.label} {...stat} />
            ))}
          </div>
          <ServerInfoCard health={health} lastUpdated={lastUpdated} />
        </section>

        <section data-monitor-animate>
          <ProcessInfoCard health={health} />
        </section>
      </div>
    </div>
  )
}

function ConnectionBadge({ status }: { status: SseStatus }) {
  const open = status === "open"

  return (
    <Badge
      variant={open ? "secondary" : "outline"}
      className="h-7 gap-2 rounded-full px-3"
    >
      <span
        className={cn(
          "size-2.5 rounded-full",
          open ? "animate-pulse bg-primary" : "bg-muted-foreground/50"
        )}
      />
      {connectionStatusText(status)}
    </Badge>
  )
}

function connectionStatusText(status: SseStatus) {
  switch (status) {
    case "open":
      return "实时"
    case "connecting":
      return "连接中"
    case "error":
      return "重连中"
    case "closed":
      return "已断开"
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "服务器返回了未知错误。"
}
