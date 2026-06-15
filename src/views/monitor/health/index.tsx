import { useQuery } from "@tanstack/react-query"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { getHealth } from "@/api/monitor/health"
import { monitorQueryKeys } from "@/lib/query-keys"
import { DependencyHealthBody } from "@/views/system/_components/resource/columns"

export default function HealthPage() {
  const data = {
    health: useQuery({
      queryKey: monitorQueryKeys.health,
      queryFn: getHealth,
    }),
  }
  const health = data.health.data

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {data.health.error ? (
        <Alert variant="destructive">
          <AlertTitle>健康检查返回错误</AlertTitle>
          <AlertDescription>
            {getErrorMessage(data.health.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusCard
          title="服务"
          description="应用进程状态"
          badge={health?.status ?? "检查中"}
          healthy={health?.status === "ok"}
          body={
            health
              ? `${health.service} / ${health.environment}`
              : "等待服务健康检查返回。"
          }
        />
        <StatusCard
          title="依赖"
          description="数据库和缓存健康状态"
          badge={health?.status ?? "检查中"}
          healthy={health?.status === "ok"}
          body={<DependencyHealthBody health={health} />}
        />
      </div>
    </div>
  )
}

function StatusCard({
  title,
  description,
  badge,
  healthy,
  body,
}: {
  title: string
  description: string
  badge: string
  healthy: boolean
  body: React.ReactNode
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Badge variant={healthy ? "secondary" : "outline"}>{badge}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {body}
      </CardContent>
    </Card>
  )
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
