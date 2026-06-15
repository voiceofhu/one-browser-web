import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { BellIcon, BellOffIcon, CheckIcon, CircleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentUser } from "@/hooks/use-auth"
import { buildQueryPath, http } from "@/lib/request"

type Notice = {
  notice_id: number
  notice_title: string
  notice_type: "1" | "2"
  notice_content: string | null
  status: "0" | "1"
  created_at: string
  updated_at: string | null
  remark: string | null
}

type NoticeRead = {
  read_id: number
  notice_id: number
  user_id: number
  read_at: string
}

const notificationQueryKeys = {
  notices: ["notifications", "notices"] as const,
  reads: (userId: number | undefined) =>
    ["notifications", "reads", userId] as const,
}

export function NotificationDrawer() {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const userId = currentUser.data?.user_id
  const noticesQuery = useQuery({
    queryKey: notificationQueryKeys.notices,
    queryFn: () => http.get<Notice[]>("/notices"),
  })
  const readsQuery = useQuery({
    queryKey: notificationQueryKeys.reads(userId),
    queryFn: () => {
      if (userId === undefined) {
        return Promise.resolve([])
      }

      return http.get<NoticeRead[]>(`/notice-reads/users/${userId}`)
    },
    enabled: userId !== undefined,
  })
  const markRead = useMutation({
    mutationFn: (noticeId: number) => {
      if (userId === undefined) {
        throw new Error("当前用户信息尚未加载完成")
      }

      return http.post<NoticeRead>(
        buildQueryPath(`/notices/${noticeId}/read`, { user_id: userId })
      )
    },
    onSuccess: (read) => {
      queryClient.setQueryData<NoticeRead[]>(
        notificationQueryKeys.reads(read.user_id),
        (current = []) =>
          current.some((item) => item.notice_id === read.notice_id)
            ? current
            : [read, ...current]
      )
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "通知标记已读失败")
    },
  })

  const notices = (noticesQuery.data ?? []).filter(
    (notice) => notice.status === "0"
  )
  const readNoticeIds = new Set(
    (readsQuery.data ?? []).map((read) => read.notice_id)
  )
  const unreadCount =
    noticesQuery.isSuccess && readsQuery.isSuccess
      ? notices.filter((notice) => !readNoticeIds.has(notice.notice_id)).length
      : 0
  const isLoading =
    currentUser.isPending ||
    noticesQuery.isPending ||
    (userId !== undefined && readsQuery.isPending)
  const hasError =
    currentUser.isError || noticesQuery.isError || readsQuery.isError
  const triggerLabel = unreadCount > 0 ? `通知，${unreadCount} 条未读` : "通知"

  function retry() {
    void currentUser.refetch()
    void noticesQuery.refetch()
    if (userId !== undefined) {
      void readsQuery.refetch()
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label={triggerLabel}
          className="relative"
          size="icon-sm"
          title={triggerLabel}
          variant="outline"
        >
          <BellIcon aria-hidden="true" strokeWidth={2} />
          {unreadCount > 0 ? (
            <Badge
              aria-hidden="true"
              className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[10px]"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0" side="right">
        <SheetHeader className="pr-12">
          <SheetTitle>通知</SheetTitle>
          <SheetDescription>
            {isLoading
              ? "正在加载通知"
              : `共 ${notices.length} 条，${unreadCount} 条未读`}
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <NotificationSkeleton />
          ) : hasError ? (
            <div className="p-4">
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertTitle>通知加载失败</AlertTitle>
                <AlertDescription>
                  {getErrorMessage(
                    currentUser.error ?? noticesQuery.error ?? readsQuery.error
                  )}
                </AlertDescription>
                <AlertAction>
                  <Button onClick={retry} size="xs" variant="outline">
                    重试
                  </Button>
                </AlertAction>
              </Alert>
            </div>
          ) : notices.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BellOffIcon />
                </EmptyMedia>
                <EmptyTitle>暂无通知</EmptyTitle>
                <EmptyDescription>
                  当前没有可显示的通知或公告。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="gap-1 p-2">
              {notices.map((notice) => {
                const isUnread = !readNoticeIds.has(notice.notice_id)
                const date = getNoticeDate(notice.created_at)
                const isMarkingRead =
                  markRead.isPending && markRead.variables === notice.notice_id

                return (
                  <Item
                    key={notice.notice_id}
                    size="sm"
                    variant={isUnread ? "muted" : "default"}
                  >
                    <ItemContent>
                      <ItemHeader>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <ItemTitle className="min-w-0">
                            {notice.notice_title}
                          </ItemTitle>
                          <Badge variant="outline">
                            {notice.notice_type === "1" ? "通知" : "公告"}
                          </Badge>
                          {isUnread ? <Badge>未读</Badge> : null}
                        </div>
                        {isUnread ? (
                          <Button
                            aria-label={`将“${notice.notice_title}”标记为已读`}
                            disabled={isMarkingRead}
                            onClick={() => markRead.mutate(notice.notice_id)}
                            size="icon-xs"
                            title="标记为已读"
                            variant="ghost"
                          >
                            {isMarkingRead ? <Spinner /> : <CheckIcon />}
                          </Button>
                        ) : null}
                      </ItemHeader>
                      {notice.notice_content ? (
                        <ItemDescription title={notice.notice_content}>
                          {notice.notice_content}
                        </ItemDescription>
                      ) : null}
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={notice.created_at}
                        title={date.absolute}
                      >
                        {date.relative}
                      </time>
                    </ItemContent>
                  </Item>
                )
              })}
            </ItemGroup>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function NotificationSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4" aria-label="正在加载通知">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="flex flex-col gap-2" key={index}>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}

function getNoticeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { absolute: value, relative: value }
  }

  return {
    absolute: date.toLocaleString("zh-CN"),
    relative: formatDistanceToNow(date, { addSuffix: true, locale: zhCN }),
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "操作失败，请稍后重试。"
}
