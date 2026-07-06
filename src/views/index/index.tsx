import { useQuery } from "@tanstack/react-query"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTranslation } from "@/components/providers/language-context"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { getIndexOverview, type IndexOverviewRecentResource } from "@/api/index"
import { useAuthPermissions } from "@/hooks/use-auth"
import { hasPermission } from "@/lib/auth-permissions"
import { indexQueryKeys } from "@/lib/query-keys"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { translateText } from "@/local"
import { cn } from "@/lib/utils"
import { buildResourceGroups } from "@/views/index/resource-data"
import { ResourceOverview } from "@/views/index/resource-overview"
import { RuntimePanel } from "@/views/index/runtime-panel"

const runtimePanelPermissions = [
  "monitor:health:list",
  "system:user:list",
  "system:role:list",
  "system:menu:list",
]

export default function IndexPage() {
  const { locale, t } = useTranslation()
  const authPermissions = useAuthPermissions()
  const overview = useOverviewData()
  const overviewData = overview.data
  const overviewErrorMessage = overview.error
    ? getErrorMessage(overview.error, t("common.unknownServerError"))
    : null
  const resourceGroups = buildResourceGroups({
    groups: overviewData?.resource_groups,
    resources: overviewData?.resources,
    isLoading: overview.isLoading,
    fallbackErrorMessage: overviewErrorMessage,
  })
  const recentItems = buildRecentItems(overviewData?.recent)
  const showRuntimePanel = runtimePanelPermissions.some((permission) =>
    hasPermission(authPermissions.data, permission)
  )

  return (
    <div className="flex flex-col gap-2.5 px-3 pt-3 lg:px-4">
      {overview.error ? (
        <Alert variant="destructive">
          <AlertTitle>{translateText(locale, "首页数据加载失败")}</AlertTitle>
          <AlertDescription>
            {getErrorMessage(overview.error, t("common.unknownServerError"))}
          </AlertDescription>
        </Alert>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-1 items-start gap-2.5",
          showRuntimePanel ? "xl:grid-cols-[minmax(0,1fr)_18rem]" : null
        )}
      >
        <div className="grid min-w-0 content-start gap-2.5">
          <ResourceOverview groups={resourceGroups} />
          <RecentResources items={recentItems} />
        </div>
        {showRuntimePanel ? (
          <RuntimePanel
            authPermissions={authPermissions.data}
            user={overviewData?.current_user}
            health={overviewData?.health}
            isLoading={overview.isLoading}
            error={overview.error}
          />
        ) : null}
      </div>
    </div>
  )
}

function RecentResources({ items }: { items: RecentItem[] }) {
  const { locale } = useTranslation()

  return (
    <Card size="sm" className="bg-muted/20 shadow-none ring-0">
      <CardHeader className="pb-1">
        <CardDescription>{translateText(locale, "近期数据")}</CardDescription>
        <CardTitle>{translateText(locale, "最近变更")}</CardTitle>
        <CardAction>
          <Badge variant="outline">{items.length}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {translateText(locale, "暂无可展示的近期资源。")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-background/75">
            {items.map((item, index) => (
              <div
                key={`${item.kind}-${item.name}-${index}`}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t px-3 py-2 first:border-t-0"
              >
                <Badge variant="outline">
                  {translateText(locale, item.kind)}
                </Badge>
                <div className="min-w-0 truncate text-sm font-medium">
                  {item.name}
                </div>
                <div
                  className="text-xs whitespace-nowrap text-muted-foreground"
                  title={formatAbsoluteDateTime(item.createdAt)}
                >
                  {formatRelativeTime(item.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return fallback
}
