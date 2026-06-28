import {
  DatabaseIcon,
  KeyRoundIcon,
  MegaphoneIcon,
  ShieldIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"

import { translateText } from "@/local"
import { cn } from "@/lib/utils"
import type { ResourceGroupView, ResourceItemView } from "./resource-data"

const resourceIcons: Record<string, LucideIcon> = {
  users: UsersIcon,
  roles: ShieldIcon,
  menus: KeyRoundIcon,
  dict_types: DatabaseIcon,
  dict_data: DatabaseIcon,
  notices: MegaphoneIcon,
}

export function ResourceOverview({ groups }: { groups: ResourceGroupView[] }) {
  const { locale } = useTranslation()
  const total = groups.reduce(
    (sum, group) =>
      sum + group.items.reduce((groupSum, item) => groupSum + item.total, 0),
    0
  )
  const isLoading = groups.some((group) =>
    group.items.some((item) => item.isLoading)
  )

  return (
    <Card
      size="sm"
      className="bg-muted/20 shadow-none ring-0 [--card-spacing:--spacing(2.5)]"
    >
      <CardHeader className="gap-0.5 pb-0">
        <CardDescription className="text-xs">
          {translateText(locale, "系统资源")}
        </CardDescription>
        <CardTitle className="leading-none">
          {translateText(locale, "资源概览")}
        </CardTitle>
        <CardAction>
          <Badge variant="secondary">
            {isLoading ? "..." : total.toLocaleString()}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border bg-background/75">
          {groups.map((group) => (
            <ResourceGroupRow key={group.key} group={group} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ResourceGroupRow({ group }: { group: ResourceGroupView }) {
  const { locale } = useTranslation()
  const total = group.items.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="grid border-t first:border-t-0 md:grid-cols-[7.5rem_minmax(0,1fr)]">
      <div className="flex min-h-9 items-center justify-between gap-2 border-b bg-muted/35 px-2.5 py-1.5 md:border-r md:border-b-0">
        <div className="min-w-0 truncate text-sm font-medium">
          {translateText(locale, group.title)}
        </div>
        <div className="shrink-0 text-lg leading-none font-semibold tabular-nums">
          {total.toLocaleString()}
        </div>
      </div>
      <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {group.items.map((item) => (
          <ResourceMetric key={item.key} item={item} />
        ))}
      </div>
    </div>
  )
}

function ResourceMetric({ item }: { item: ResourceItemView }) {
  const { locale } = useTranslation()
  const Icon = resourceIcons[item.key] ?? DatabaseIcon

  return (
    <div
      title={translateText(locale, item.description)}
      className={cn(
        "flex min-h-9 items-center justify-between gap-2 px-2.5 py-1.5",
        item.error ? "bg-destructive/5" : null
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 truncate text-sm font-medium">
          {translateText(locale, item.title)}
        </div>
      </div>
      {item.isLoading ? (
        <Skeleton className="h-4 w-7" />
      ) : item.error ? (
        <Badge variant="destructive">{translateText(locale, "错误")}</Badge>
      ) : (
        <div className="shrink-0 text-lg leading-none font-semibold tabular-nums">
          {item.total.toLocaleString()}
        </div>
      )}
    </div>
  )
}
