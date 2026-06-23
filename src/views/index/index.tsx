import { useQuery } from "@tanstack/react-query"
import { NavLink } from "react-router"
import {
  ArrowRightIcon,
  DatabaseIcon,
  FileTextIcon,
  HeartPulseIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
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
      "部门",
      "组织部门",
      resources?.depts,
      overview.isLoading,
      LayoutDashboardIcon,
      overviewErrorMessage
    ),
    resourceSummary(
      "岗位",
      "组织岗位",
      resources?.posts,
      overview.isLoading,
      FileTextIcon,
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
    <div className="flex flex-col gap-3 px-4 pt-4 lg:px-6">
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

      <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {resourceCards.slice(0, 4).map((card, index) => (
          <ResourceSummaryCard key={card.title} card={card} index={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="grid content-start gap-3">
          <ResourceOverview cards={resourceCards} />
          <RecentResources items={recentItems} />
        </div>
        <div className="grid content-start gap-3">
          <QuickActions />
          <HealthCard
            health={overviewData?.health}
            isLoading={overview.isLoading}
            error={overview.error}
          />
          <DependencyHealthCard
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
  const { locale, t } = useTranslation()

  return (
    <Card size="sm" className="bg-muted/40 shadow-none ring-0">
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          value={serviceStatus}
        />
        <StatusItem
          label={translateText(locale, "依赖状态")}
          value={serviceStatus}
        />
      </CardContent>
    </Card>
  )
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  )
}

function ResourceSummaryCard({
  card,
  index,
}: {
  card: ResourceSummary
  index: number
}) {
  const Icon = card.icon
  const { locale } = useTranslation()

  return (
    <Card
      size="sm"
      className={cn(
        "shadow-none ring-0",
        panelToneClass(index, Boolean(card.errorMessage))
      )}
    >
      <CardHeader className="gap-1">
        <CardDescription>
          {translateText(locale, card.description)}
        </CardDescription>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold tabular-nums">
          <Icon className="text-muted-foreground" />
          {card.isLoading ? <Skeleton className="h-8 w-16" /> : card.value}
        </CardTitle>
        <CardAction>
          <Badge variant={card.variant}>
            {translateText(locale, card.badge)}
          </Badge>
        </CardAction>
      </CardHeader>
    </Card>
  )
}

function ResourceOverview({ cards }: { cards: ResourceSummary[] }) {
  const { locale } = useTranslation()

  return (
    <Card size="sm" className="bg-muted/35 shadow-none ring-0">
      <CardHeader>
        <CardDescription>{translateText(locale, "核心资源")}</CardDescription>
        <CardTitle>{translateText(locale, "系统管理总览")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cards.map((card, index) => (
          <div
            key={card.title}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors",
              overviewToneClass(index, Boolean(card.errorMessage))
            )}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {translateText(locale, card.title)}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {card.errorMessage ?? translateText(locale, card.description)}
              </div>
            </div>
            <Badge variant={card.variant}>
              {card.isLoading ? "..." : card.value}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  const { locale } = useTranslation()

  return (
    <Card size="sm" className="bg-muted/35 shadow-none ring-0">
      <CardHeader>
        <CardDescription>{translateText(locale, "常用入口")}</CardDescription>
        <CardTitle>{translateText(locale, "快捷操作")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {quickActions.map((action, index) => {
          const Icon = action.icon

          return (
            <Button
              key={action.routeId}
              asChild
              variant="ghost"
              className={cn("justify-between", overviewToneClass(index, false))}
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

const overviewTones = [
  "bg-primary/5 hover:bg-primary/10",
  "bg-muted/60 hover:bg-muted",
  "bg-accent/45 hover:bg-accent/70",
  "bg-secondary/60 hover:bg-secondary/80",
] as const

const panelTones = [
  "bg-primary/5",
  "bg-muted/45",
  "bg-accent/35",
  "bg-secondary/55",
] as const

function overviewToneClass(index: number, isError: boolean) {
  return isError
    ? "bg-destructive/5 hover:bg-destructive/10"
    : overviewTones[index % overviewTones.length]
}

function panelToneClass(index: number, isError: boolean) {
  return isError ? "bg-destructive/5" : panelTones[index % panelTones.length]
}

function RecentResources({ items }: { items: RecentItem[] }) {
  const { locale } = useTranslation()

  return (
    <Card size="sm" className="bg-muted/35 shadow-none ring-0">
      <CardHeader>
        <CardDescription>{translateText(locale, "近期数据")}</CardDescription>
        <CardTitle>{translateText(locale, "最近创建的资源")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {translateText(locale, "暂无可展示的近期资源。")}
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.kind}-${item.name}-${index}`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5",
                overviewToneClass(index, false)
              )}
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

function HealthCard({
  health,
  isLoading,
  error,
}: {
  health?: OverviewSection<HealthResponse>
  isLoading: boolean
  error?: unknown
}) {
  const status = health?.data?.status ?? "unknown"
  const isOk = status === "ok"
  const { locale, t } = useTranslation()
  const errorMessage = getSectionError(
    health,
    error,
    t("common.unknownServerError")
  )

  return (
    <Card size="sm" className="bg-muted/35 shadow-none ring-0">
      <CardHeader>
        <CardDescription>{translateText(locale, "服务健康")}</CardDescription>
        <CardTitle>
          {isLoading
            ? translateText(locale, "检查中")
            : translateText(locale, status)}
        </CardTitle>
        <CardAction>
          <Badge variant={errorMessage || !isOk ? "destructive" : "secondary"}>
            {translateText(
              locale,
              errorMessage ? "错误" : isOk ? "健康" : "注意"
            )}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {errorMessage
          ? errorMessage
          : health?.data
            ? `${health.data.service} / ${health.data.environment}`
            : translateText(locale, "等待健康检查返回。")}
      </CardContent>
    </Card>
  )
}

function DependencyHealthCard({
  health,
  isLoading,
  error,
}: {
  health?: OverviewSection<HealthResponse>
  isLoading: boolean
  error?: unknown
}) {
  const status = health?.data?.status ?? "unknown"
  const isOk = status === "ok"
  const { locale, t } = useTranslation()
  const errorMessage = getSectionError(
    health,
    error,
    t("common.unknownServerError")
  )

  return (
    <Card size="sm" className="bg-muted/35 shadow-none ring-0">
      <CardHeader>
        <CardDescription>{translateText(locale, "依赖健康")}</CardDescription>
        <CardTitle>
          {isLoading
            ? translateText(locale, "检查中")
            : translateText(locale, status)}
        </CardTitle>
        <CardAction>
          <Badge variant={errorMessage || !isOk ? "destructive" : "secondary"}>
            {translateText(
              locale,
              errorMessage ? "错误" : isOk ? "健康" : "降级"
            )}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-muted-foreground">
        {errorMessage ? (
          errorMessage
        ) : health?.data ? (
          <>
            <div>Postgres：{health.data.postgres}</div>
            <Separator />
            <div>SeaORM：{health.data.sea_orm}</div>
            <Separator />
            <div>Redis：{health.data.redis}</div>
          </>
        ) : (
          translateText(locale, "等待健康检查返回。")
        )}
      </CardContent>
    </Card>
  )
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
