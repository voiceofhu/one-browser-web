import { useCallback, useLayoutEffect, useMemo, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { gsap } from "gsap"
import {
  CpuIcon,
  HardDriveIcon,
  MemoryStickIcon,
  RefreshCwIcon,
} from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HEALTH_STREAM_PATH, getHealth } from "@/api/monitor/health"
import { monitorQueryKeys } from "@/lib/query-keys"
import { useSse, type SseStatus } from "@/lib/sse"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/i18n"

import type { HealthResponse } from "@/types/admin"

import { monitorText } from "../_lib/i18n"
import { ProcessInfoCard } from "./components/process-info-card"
import { QuickStatCard } from "./components/quick-stat-card"
import { ServerInfoCard } from "./components/server-info-card"
import { formatBytes, formatLoad, formatPercent } from "./lib/format"

export default function HealthPage() {
  const { locale } = useTranslation()
  const mt = useCallback((key: string) => monitorText(locale, key), [locale])
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
        formatValue: (value: number) => formatPercent(value, locale),
        hint: load
          ? `${mt("health.cpu.load")} ${formatLoad(load.one)} / ${formatLoad(load.five)} / ${formatLoad(load.fifteen)}`
          : mt("health.cpu.wait"),
        percent: cpuUsagePercent,
      },
      {
        label: mt("health.memory.label"),
        icon: MemoryStickIcon,
        value: memory?.usage_percent,
        formatValue: (value: number) => formatPercent(value, locale),
        hint:
          memory && process
            ? `${mt("health.memory.limit")} ${formatBytes(memory.total_bytes, locale)}${mt("common.metricSeparator")}${mt("health.memory.processUsage")} ${formatBytes(process.rss_bytes, locale)}`
            : mt("health.memory.wait"),
        percent: memory?.usage_percent,
      },
      {
        label: mt("health.storage.label"),
        icon: HardDriveIcon,
        value: storage?.usage_percent,
        formatValue: (value: number) => formatPercent(value, locale),
        hint:
          typeof storage?.used_bytes === "number" &&
          typeof storage.total_bytes === "number"
            ? `${formatBytes(storage.used_bytes, locale)} / ${formatBytes(storage.total_bytes, locale)}`
            : mt("health.storage.wait"),
        percent: storage?.usage_percent,
      },
    ],
    [cpuUsagePercent, load, locale, memory, process, storage, mt]
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
          className="flex items-start justify-between gap-3"
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-normal">
              {mt("health.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mt("health.description")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
            <ConnectionBadge status={healthStream.status} />
            {healthStream.status === "closed" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={healthStream.reconnect}
              >
                <RefreshCwIcon data-icon="inline-start" />
                {mt("health.reconnect")}
              </Button>
            ) : null}
          </div>
        </header>

        {healthQuery.error ? (
          <Alert data-monitor-animate variant="destructive">
            <AlertTitle>{mt("health.error.title")}</AlertTitle>
            <AlertDescription>
              {getErrorMessage(healthQuery.error, locale)}
            </AlertDescription>
          </Alert>
        ) : null}

        {healthStream.error ? (
          <Alert data-monitor-animate>
            <AlertTitle>{mt("health.stream.title")}</AlertTitle>
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
          <ServerInfoCard
            health={health}
            lastUpdated={lastUpdated}
            locale={locale}
          />
        </section>

        <section data-monitor-animate>
          <ProcessInfoCard health={health} locale={locale} />
        </section>
      </div>
    </div>
  )
}

function ConnectionBadge({ status }: { status: SseStatus }) {
  const { locale } = useTranslation()
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
      {monitorText(locale, connectionStatusKey(status))}
    </Badge>
  )
}

function connectionStatusKey(status: SseStatus) {
  switch (status) {
    case "open":
      return "health.connection.live"
    case "connecting":
      return "health.connection.connecting"
    case "error":
      return "health.connection.reconnecting"
    case "closed":
      return "health.connection.closed"
  }
}

function getErrorMessage(error: unknown, locale: Locale) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return monitorText(locale, "common.unknownServerError")
}
