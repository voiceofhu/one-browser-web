import { NavLink } from "react-router"
import {
  ArrowRightIcon,
  HeartPulseIcon,
  KeyRoundIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import type { OverviewSection } from "@/api/index"
import { APP_ROUTE_BY_ID } from "@/router/routes"
import { localizedPath, translateText } from "@/local"
import type { CurrentUser, HealthResponse } from "@/types/admin"

const quickActions = [
  { label: "用户管理", routeId: "users", icon: UsersIcon },
  { label: "角色管理", routeId: "roles", icon: ShieldIcon },
  { label: "权限管理", routeId: "menus", icon: KeyRoundIcon },
  { label: "健康检查", routeId: "health", icon: HeartPulseIcon },
] as const

export function RuntimePanel({
  user,
  health,
  isLoading,
  error,
}: {
  user?: CurrentUser
  health?: OverviewSection<HealthResponse>
  isLoading: boolean
  error?: unknown
}) {
  const { locale, t } = useTranslation()
  const errorMessage = getSectionError(
    health,
    error,
    t("common.unknownServerError")
  )
  const data = health?.data
  const serviceStatus = data?.status ?? "unknown"
  const dependencyStatus = getDependencyStatus(data)

  return (
    <Card size="sm" className="bg-muted/20 shadow-none ring-0">
      <CardHeader className="pb-1">
        <CardDescription>{translateText(locale, "运行状态")}</CardDescription>
        <CardTitle>
          {isLoading
            ? translateText(locale, "检查中")
            : formatStatusText(locale, serviceStatus)}
        </CardTitle>
        <CardAction>
          <Badge variant={statusBadgeVariant(serviceStatus, errorMessage)}>
            {translateText(
              locale,
              errorMessage
                ? "错误"
                : isOkStatus(serviceStatus)
                  ? "健康"
                  : "注意"
            )}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        {errorMessage ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-1.5 rounded-lg border bg-background/75 px-3 py-2 text-sm">
          <CompactRow
            label={translateText(locale, "当前用户")}
            value={user?.nick_name || user?.user_name || t("nav.guestName")}
          />
          <CompactRow
            label={translateText(locale, "运行环境")}
            value={displayValue(data?.environment)}
          />
        </div>

        <div className="grid gap-1.5 rounded-lg border bg-background/75 px-3 py-2 text-sm">
          <CompactRow
            label={translateText(locale, "服务健康")}
            value={
              data
                ? `${formatStatusText(locale, serviceStatus)} / ${data.service}`
                : "-"
            }
          />
          <CompactRow
            label={translateText(locale, "依赖健康")}
            value={formatStatusText(locale, dependencyStatus)}
          />
          <Separator />
          <CompactRow label="Postgres" value={displayValue(data?.postgres)} />
          <CompactRow label="SeaORM" value={displayValue(data?.sea_orm)} />
          <CompactRow label="Redis" value={displayValue(data?.redis)} />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <Button
                key={action.routeId}
                asChild
                size="xs"
                variant="outline"
                className="justify-between bg-background/75 px-2"
              >
                <NavLink
                  to={localizedPath(
                    locale,
                    APP_ROUTE_BY_ID[action.routeId].path
                  )}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Icon data-icon="inline-start" />
                    <span className="truncate">
                      {translateText(locale, action.label)}
                    </span>
                  </span>
                  <ArrowRightIcon data-icon="inline-end" />
                </NavLink>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function CompactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium tabular-nums">
        {value}
      </span>
    </div>
  )
}

function getDependencyStatus(health?: HealthResponse | null) {
  if (!health) {
    return "unknown"
  }

  const statuses = [health.postgres, health.sea_orm, health.redis]
  if (statuses.every(isOkStatus)) {
    return "ok"
  }

  return "degraded"
}

function isOkStatus(status?: string | null) {
  return status?.toLowerCase() === "ok" || status?.toLowerCase() === "healthy"
}

function statusBadgeVariant(status: string, errorMessage?: string | null) {
  return errorMessage || !isOkStatus(status) ? "destructive" : "secondary"
}

function formatStatusText(
  locale: string | null | undefined,
  status?: string | null
) {
  if (!status || status === "unknown") {
    return "-"
  }

  if (status === "degraded") {
    return translateText(locale, "降级")
  }

  return translateText(locale, status)
}

function displayValue(value?: string | null) {
  return value?.trim() || "-"
}

function getSectionError<T>(
  section: OverviewSection<T> | undefined,
  rootError: unknown | undefined,
  fallback: string
) {
  if (rootError) {
    return getErrorMessage(rootError, fallback)
  }

  return section?.error ?? null
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return fallback
}
