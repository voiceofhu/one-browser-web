import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { NavLink } from "react-router"
import {
  ArrowRightIcon,
  DatabaseIcon,
  FileTextIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  MenuIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

import { getCurrentUser } from "@/api/auth"
import { getHealth } from "@/api/monitor/health"
import { listDepts } from "@/api/system/dept"
import { listDictData, listDictTypes } from "@/api/system/dict"
import { listMenus } from "@/api/system/menu"
import { listPosts } from "@/api/system/post"
import { listRoles } from "@/api/system/role"
import { listUsers } from "@/api/system/user"
import {
  authQueryKeys,
  monitorQueryKeys,
  systemQueryKeys,
} from "@/lib/query-keys"
import { cn } from "@/lib/utils"
import { APP_ROUTE_BY_ID } from "@/router/routes"
import type { CurrentUser, HealthResponse, PageResponse } from "@/types/admin"

type CountQuery = UseQueryResult<PageResponse<unknown>, Error>
type HealthQuery = UseQueryResult<HealthResponse, Error>
type ResourceSummary = ReturnType<typeof resourceSummary>

const quickActions = [
  { label: "用户管理", routeId: "users", icon: UsersIcon },
  { label: "角色管理", routeId: "roles", icon: ShieldIcon },
  { label: "菜单管理", routeId: "menus", icon: MenuIcon },
  { label: "健康检查", routeId: "health", icon: HeartPulseIcon },
] as const

export default function IndexPage() {
  const data = useOverviewData()
  const resourceCards = [
    resourceSummary("用户", "后台账号", data.users, UsersIcon),
    resourceSummary("角色", "权限角色", data.roles, ShieldIcon),
    resourceSummary("菜单", "菜单与权限项", data.menus, MenuIcon),
    resourceSummary("部门", "组织部门", data.depts, LayoutDashboardIcon),
    resourceSummary("岗位", "组织岗位", data.posts, FileTextIcon),
    resourceSummary("字典类型", "字典定义", data.dictTypes, DatabaseIcon),
    resourceSummary("字典数据", "字典键值", data.dictData, DatabaseIcon),
  ]
  const recentItems = buildRecentItems(data)

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 lg:px-6">
      {data.currentUser.error ? (
        <Alert variant="destructive">
          <AlertTitle>需要登录</AlertTitle>
          <AlertDescription>
            {getErrorMessage(data.currentUser.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <StatusStrip user={data.currentUser.data} health={data.health} />

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
          <HealthCard query={data.health} />
          <DependencyHealthCard query={data.health} />
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
  health: HealthQuery
}) {
  const environment = health.data?.environment ?? "unknown"
  const serviceStatus = health.data?.status ?? "unknown"

  return (
    <Card size="sm" className="bg-muted/40 shadow-none ring-0">
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusItem
          label="当前用户"
          value={user?.nick_name || user?.user_name || "未登录"}
        />
        <StatusItem label="运行环境" value={environment} />
        <StatusItem label="服务状态" value={serviceStatus} />
        <StatusItem label="依赖状态" value={serviceStatus} />
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

  return (
    <Card
      size="sm"
      className={cn(
        "shadow-none ring-0",
        panelToneClass(index, Boolean(card.errorMessage))
      )}
    >
      <CardHeader className="gap-1">
        <CardDescription>{card.description}</CardDescription>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold tabular-nums">
          <Icon className="text-muted-foreground" />
          {card.isLoading ? <Skeleton className="h-8 w-16" /> : card.value}
        </CardTitle>
        <CardAction>
          <Badge variant={card.variant}>{card.badge}</Badge>
        </CardAction>
      </CardHeader>
    </Card>
  )
}

function ResourceOverview({ cards }: { cards: ResourceSummary[] }) {
  return (
    <Card size="sm" className="bg-muted/35 shadow-none ring-0">
      <CardHeader>
        <CardDescription>核心资源</CardDescription>
        <CardTitle>系统管理总览</CardTitle>
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
              <div className="truncate text-sm font-medium">{card.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {card.errorMessage ?? card.description}
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
  return (
    <Card size="sm" className="bg-muted/35 shadow-none ring-0">
      <CardHeader>
        <CardDescription>常用入口</CardDescription>
        <CardTitle>快捷操作</CardTitle>
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
                  {action.label}
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
  return (
    <Card size="sm" className="bg-muted/35 shadow-none ring-0">
      <CardHeader>
        <CardDescription>近期数据</CardDescription>
        <CardTitle>最近创建的资源</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            暂无可展示的近期资源。
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
                {item.kind}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{item.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {item.createdAt}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function HealthCard({ query }: { query: HealthQuery }) {
  const status = query.data?.status ?? "unknown"
  const isOk = status === "ok"

  return (
    <Card size="sm" className="bg-muted/35 shadow-none ring-0">
      <CardHeader>
        <CardDescription>服务健康</CardDescription>
        <CardTitle>{query.isLoading ? "检查中" : status}</CardTitle>
        <CardAction>
          <Badge variant={query.error || !isOk ? "destructive" : "secondary"}>
            {query.error ? "错误" : isOk ? "健康" : "注意"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {query.error
          ? getErrorMessage(query.error)
          : query.data
            ? `${query.data.service} / ${query.data.environment}`
            : "等待健康检查返回。"}
      </CardContent>
    </Card>
  )
}

function DependencyHealthCard({ query }: { query: HealthQuery }) {
  const status = query.data?.status ?? "unknown"
  const isOk = status === "ok"

  return (
    <Card size="sm" className="bg-muted/35 shadow-none ring-0">
      <CardHeader>
        <CardDescription>依赖健康</CardDescription>
        <CardTitle>{query.isLoading ? "检查中" : status}</CardTitle>
        <CardAction>
          <Badge variant={query.error || !isOk ? "destructive" : "secondary"}>
            {query.error ? "错误" : isOk ? "健康" : "降级"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-muted-foreground">
        {query.error ? (
          getErrorMessage(query.error)
        ) : query.data ? (
          <>
            <div>Postgres：{query.data.postgres}</div>
            <Separator />
            <div>SeaORM：{query.data.sea_orm}</div>
            <Separator />
            <div>Redis：{query.data.redis}</div>
          </>
        ) : (
          "等待健康检查返回。"
        )}
      </CardContent>
    </Card>
  )
}

function resourceSummary(
  title: string,
  description: string,
  query: CountQuery,
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
) {
  const isLoading = query.isLoading || (query.isFetching && !query.data)
  const value = query.data?.total ?? 0
  const errorMessage = query.error ? getErrorMessage(query.error) : null

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

type OverviewData = ReturnType<typeof useOverviewData>

function useOverviewData() {
  const listParams = { page: 1, page_size: 100 }
  const currentUser = useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
  })
  const health = useQuery({
    queryKey: monitorQueryKeys.health,
    queryFn: getHealth,
  })
  const users = useQuery({
    queryKey: [...systemQueryKeys.users, "overview", listParams],
    queryFn: () => listUsers(listParams),
  })
  const roles = useQuery({
    queryKey: [...systemQueryKeys.roles, "overview", listParams],
    queryFn: () => listRoles(listParams),
  })
  const menus = useQuery({
    queryKey: [...systemQueryKeys.menus, "overview", listParams],
    queryFn: () => listMenus(listParams),
  })
  const depts = useQuery({
    queryKey: [...systemQueryKeys.depts, "overview", listParams],
    queryFn: () => listDepts(listParams),
  })
  const posts = useQuery({
    queryKey: [...systemQueryKeys.posts, "overview", listParams],
    queryFn: () => listPosts(listParams),
  })
  const dictTypes = useQuery({
    queryKey: [...systemQueryKeys.dictTypes, "overview", listParams],
    queryFn: () => listDictTypes(listParams),
  })
  const dictData = useQuery({
    queryKey: [...systemQueryKeys.dictData, "overview", listParams],
    queryFn: () => listDictData(listParams),
  })

  return {
    currentUser,
    health,
    users,
    roles,
    menus,
    depts,
    posts,
    dictTypes,
    dictData,
  }
}

function buildRecentItems(data: OverviewData): RecentItem[] {
  return [
    ...(data.users.data?.items ?? []).map((item) => ({
      kind: "用户",
      name: item.user_name || item.nick_name,
      createdAt: item.created_at,
      timestamp: Date.parse(item.created_at),
    })),
    ...(data.roles.data?.items ?? []).map((item) => ({
      kind: "角色",
      name: item.role_name,
      createdAt: item.created_at,
      timestamp: Date.parse(item.created_at),
    })),
    ...(data.menus.data?.items ?? []).map((item) => ({
      kind: "菜单",
      name: item.menu_name,
      createdAt: item.created_at,
      timestamp: Date.parse(item.created_at),
    })),
    ...(data.posts.data?.items ?? []).map((item) => ({
      kind: "岗位",
      name: item.post_name,
      createdAt: item.created_at,
      timestamp: Date.parse(item.created_at),
    })),
  ]
    .filter((item) => Number.isFinite(item.timestamp))
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 6)
    .map((item) => ({
      ...item,
      createdAt: formatDateTime(item.createdAt),
    }))
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
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
