import { useQuery } from "@tanstack/react-query"
import { NavLink } from "react-router"
import {
  ArrowRightIcon,
  DatabaseIcon,
  HeartPulseIcon,
  KeyRoundIcon,
  MegaphoneIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Skeleton } from "@/components/ui/skeleton"

import {
  getIndexOverview,
  type IndexOverviewCount,
  type IndexOverviewRecentResource,
  type OverviewSection,
} from "@/api/index"
import { indexQueryKeys } from "@/lib/query-keys"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { translateText } from "@/local"
import { cn } from "@/lib/utils"
import { APP_ROUTE_BY_ID } from "@/router/routes"
import type { CurrentUser, HealthResponse } from "@/types/admin"

type ResourceSummary = ReturnType<typeof resourceSummary>

const quickActions = [
  { label: "用户管理", routeId: "users", icon: UsersIcon },
  { label: "角色管理", routeId: "roles", icon: ShieldIcon },
  { label: "权限管理", routeId: "menus", icon: KeyRoundIcon },
  { label: "健康检查", routeId: "health", icon: HeartPulseIcon },
] as const

export default function IndexPage() {
  const { locale, t } = useTranslation()
  const overview = useOverviewData()
  const overviewData = overview.data
  const resources = overviewData?.resources
  const overviewErrorMessage = overview.error
    ? getErrorMessage(overview.error, t("common.unknownServerError"))
    : null
  const resourceCards = [
    resourceSummary(
      "用户",
      "后台账号",
      resources?.users,
      overview.isLoading,
      UsersIcon,
      overviewErrorMessage
    ),
    resourceSummary(
      "角色",
      "权限角色",
      resources?.roles,
      overview.isLoading,
      ShieldIcon,
      overviewErrorMessage
    ),
    resourceSummary(
      "权限",
      "菜单与按钮权限",
      resources?.menus,
      overview.isLoading,
      KeyRoundIcon,
      overviewErrorMessage
    ),
    resourceSummary(
      "字典类型",
      "字典定义",
      resources?.dict_types,
      overview.isLoading,
      DatabaseIcon,
      overviewErrorMessage
    ),
    resourceSummary(
      "字典数据",
      "字典键值",
      resources?.dict_data,
      overview.isLoading,
      DatabaseIcon,
      overviewErrorMessage
    ),
    resourceSummary(
      "通知",
      "通知公告",
      resources?.notices,
      overview.isLoading,
      MegaphoneIcon,
      overviewErrorMessage
    ),
  ]
  const recentItems = buildRecentItems(overviewData?.recent)

  return (
    <div className="flex flex-col gap-3 px-3 pt-3 lg:px-4">
      {overview.error ? (
        <Alert variant="destructive">
          <AlertTitle>{translateText(locale, "首页数据加载失败")}</AlertTitle>
          <AlertDescription>
            {getErrorMessage(overview.error, t("common.unknownServerError"))}
          </AlertDescription>
        </Alert>
      ) : null}

      <StatusStrip
        user={overviewData?.current_user}
        health={overviewData?.health}
      />

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid content-start gap-3">
          <ResourceOverview cards={resourceCards} />
          <RecentResources items={recentItems} />
        </div>
        <div className="grid content-start gap-3 md:grid-cols-2 xl:grid-cols-1">
          <QuickActions />
          <HealthSummary
            health={overviewData?.health}
            isLoading={overview.isLoading}
            error={overview.error}
          />
        </div>
      </div>
    </div>
  )
}

function StatusStrip({
  user,
  health,
}: {
  user?: CurrentUser
  health?: OverviewSection<HealthResponse>
}) {
  const environment = health?.data?.environment ?? "unknown"
  const serviceStatus = health?.data?.status ?? "unknown"
  const dependencyStatus = getDependencyStatus(health?.data)
  const { locale, t } = useTranslation()

  return (
    <Card size="sm" className="bg-muted/25 shadow-none ring-0">
      <CardContent className="grid gap-2 p-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatusItem
          label={translateText(locale, "当前用户")}
          value={user?.nick_name || user?.user_name || t("nav.guestName")}
        />
        <StatusItem
          label={translateText(locale, "运行环境")}
          value={environment}
        />
        <StatusItem
          label={translateText(locale, "服务状态")}
          value={translateText(locale, serviceStatus)}
        />
        <StatusItem
          label={translateText(locale, "依赖状态")}
          value={translateText(locale, dependencyStatus)}
        />
      </CardContent>
    </Card>
  )
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-background/70 px-3 py-2">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm font-semibold tabular-nums">
        {value}
      </span>
    </div>
  )
}

function ResourceOverview({ cards }: { cards: ResourceSummary[] }) {
  const { locale } = useTranslation()

  return (
    <Card size="sm" className="bg-muted/25 shadow-none ring-0">
      <CardHeader className="pb-1">
        <CardDescription>{translateText(locale, "核心资源")}</CardDescription>
        <CardTitle>{translateText(locale, "系统管理总览")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card, index) => (
          <ResourceMetricTile key={card.title} card={card} index={index} />
        ))}
      </CardContent>
    </Card>
  )
}

function ResourceMetricTile({
  card,
  index,
}: {
  card: ResourceSummary
  index: number
}) {
  const Icon = card.icon
  const { locale } = useTranslation()

  return (
    <div
      className={cn(
        "flex min-h-20 flex-col justify-between gap-3 rounded-lg border bg-background/70 p-3",
        index === 0 ? "bg-primary/5" : null,
        card.errorMessage ? "border-destructive/30 bg-destructive/5" : null
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="text-muted-foreground" />
          <span className="truncate text-sm font-medium">
            {translateText(locale, card.title)}
          </span>
        </div>
        {card.errorMessage || card.isLoading ? (
          <Badge variant={card.variant}>
            {translateText(locale, card.badge)}
          </Badge>
        ) : null}
      </div>
      <div className="flex min-w-0 items-end justify-between gap-3">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {card.errorMessage ?? translateText(locale, card.description)}
        </span>
        <span className="text-2xl leading-none font-semibold tabular-nums">
          {card.isLoading ? <Skeleton className="h-7 w-12" /> : card.value}
        </span>
      </div>
    </div>
  )
}

function QuickActions() {
  const { locale } = useTranslation()

  return (
    <Card size="sm" className="bg-muted/25 shadow-none ring-0">
      <CardHeader className="pb-1">
        <CardDescription>{translateText(locale, "常用入口")}</CardDescription>
        <CardTitle>{translateText(locale, "快捷操作")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {quickActions.map((action) => {
          const Icon = action.icon

          return (
            <Button
              key={action.routeId}
              asChild
              size="sm"
              variant="outline"
              className="justify-between bg-background/70"
            >
              <NavLink to={APP_ROUTE_BY_ID[action.routeId].path}>
                <span className="flex items-center gap-2">
                  <Icon data-icon="inline-start" />
                  {translateText(locale, action.label)}
                </span>
                <ArrowRightIcon data-icon="inline-end" />
              </NavLink>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}

function RecentResources({ items }: { items: RecentItem[] }) {
  const { locale } = useTranslation()

  return (
    <Card size="sm" className="bg-muted/25 shadow-none ring-0">
      <CardHeader className="pb-1">
        <CardDescription>{translateText(locale, "近期数据")}</CardDescription>
        <CardTitle>{translateText(locale, "最近创建的资源")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
        {items.length === 0 ? (
          <div className="col-span-full text-sm text-muted-foreground">
            {translateText(locale, "暂无可展示的近期资源。")}
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.kind}-${item.name}-${index}`}
              className="flex min-h-12 items-center gap-3 rounded-lg border bg-background/70 px-3 py-2"
            >
              <Badge variant="outline" className="h-fit">
                {translateText(locale, item.kind)}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{item.name}</div>
                <div
                  className="truncate text-xs text-muted-foreground"
                  title={formatAbsoluteDateTime(item.createdAt)}
                >
                  {formatRelativeTime(item.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function HealthSummary({
  health,
  isLoading,
  error,
}: {
  health?: OverviewSection<HealthResponse>
  isLoading: boolean
  error?: unknown
}) {
  const status = health?.data?.status ?? "unknown"
  const dependencyStatus = getDependencyStatus(health?.data)
  const { locale, t } = useTranslation()
  const errorMessage = getSectionError(
    health,
    error,
    t("common.unknownServerError")
  )

  return (
    <Card size="sm" className="bg-muted/25 shadow-none ring-0">
      <CardHeader className="pb-1">
        <CardDescription>{translateText(locale, "运行状态")}</CardDescription>
        <CardTitle>
          {isLoading
            ? translateText(locale, "检查中")
            : translateText(locale, status)}
        </CardTitle>
        <CardAction>
          <Badge variant={statusBadgeVariant(status, errorMessage)}>
            {translateText(
              locale,
              errorMessage ? "错误" : isOkStatus(status) ? "健康" : "注意"
            )}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2">
        {errorMessage ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : health?.data ? (
          <>
            <HealthStatusLine
              label={translateText(locale, "服务健康")}
              status={status}
              detail={`${health.data.service} / ${health.data.environment}`}
            />
            <div className="rounded-lg border bg-background/70 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                  {translateText(locale, "依赖健康")}
                </span>
                <Badge variant={statusBadgeVariant(dependencyStatus)}>
                  {translateText(
                    locale,
                    isOkStatus(dependencyStatus) ? "健康" : "降级"
                  )}
                </Badge>
              </div>
              <div className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
                <DependencyStatusRow
                  label="Postgres"
                  value={health.data.postgres}
                />
                <Separator />
                <DependencyStatusRow
                  label="SeaORM"
                  value={health.data.sea_orm}
                />
                <Separator />
                <DependencyStatusRow label="Redis" value={health.data.redis} />
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            {translateText(locale, "等待健康检查返回。")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function HealthStatusLine({
  label,
  status,
  detail,
}: {
  label: string
  status: string
  detail: string
}) {
  const { locale } = useTranslation()

  return (
    <div className="rounded-lg border bg-background/70 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant={statusBadgeVariant(status)}>
          {translateText(locale, isOkStatus(status) ? "健康" : "注意")}
        </Badge>
      </div>
      <div className="mt-1 truncate text-sm text-muted-foreground">
        {detail}
      </div>
    </div>
  )
}

function DependencyStatusRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="truncate font-medium text-foreground">{value}</span>
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

function resourceSummary(
  title: string,
  description: string,
  count: IndexOverviewCount | undefined,
  isLoading: boolean,
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>,
  fallbackErrorMessage: string | null
) {
  const value = count?.total ?? 0
  const errorMessage = fallbackErrorMessage ?? count?.error ?? null

  return {
    title,
    description,
    value,
    isLoading,
    errorMessage,
    icon,
    badge: errorMessage ? "错误" : isLoading ? "加载中" : "正常",
    variant: errorMessage ? "destructive" : isLoading ? "outline" : "secondary",
  } as const
}

type RecentItem = {
  kind: string
  name: string
  createdAt: string
  timestamp: number
}

function useOverviewData() {
  return useQuery({
    queryKey: indexQueryKeys.overview,
    queryFn: getIndexOverview,
  })
}

function buildRecentItems(items?: IndexOverviewRecentResource[]): RecentItem[] {
  return (items ?? [])
    .map((item) => ({
      kind: item.kind,
      name: item.name,
      createdAt: item.created_at,
      timestamp: Date.parse(item.created_at),
    }))
    .filter((item) => Number.isFinite(item.timestamp))
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 6)
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
