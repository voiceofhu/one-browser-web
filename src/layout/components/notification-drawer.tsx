import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { gsap } from "gsap"
import {
  BellIcon,
  CheckCheckIcon,
  CircleAlertIcon,
  RefreshCwIcon,
} from "lucide-react"
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
  AnimatedSegmentedTabs,
  type AnimatedSegmentedTabsOption,
} from "@/components/ui/animated-segmented-tabs"
import { ItemGroup } from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentUser } from "@/hooks/use-auth"
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/datetime"
import { buildQueryPath, http } from "@/lib/request"
import {
  NoticeItem,
  NotificationEmpty,
  NotificationFilterLabel,
  NotificationSkeleton,
  type NotificationFilter,
} from "@/layout/components/notification-drawer-items"

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
  const listRef = React.useRef<HTMLDivElement>(null)
  const refreshIconRef = React.useRef<SVGSVGElement>(null)
  const [filter, setFilter] = React.useState<NotificationFilter>("all")
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false)
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
    mutationFn: (noticeId: number) => markNoticeRead(noticeId, userId),
    onSuccess: (read) => {
      queryClient.setQueryData<NoticeRead[]>(
        notificationQueryKeys.reads(read.user_id),
        (current = []) => mergeReads(current, [read])
      )
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "通知标记已读失败")
    },
  })
  const markAllRead = useMutation({
    mutationFn: (noticeIds: number[]) =>
      Promise.all(
        noticeIds.map((noticeId) => markNoticeRead(noticeId, userId))
      ),
    onSuccess: (reads) => {
      queryClient.setQueryData<NoticeRead[]>(
        notificationQueryKeys.reads(userId),
        (current = []) => mergeReads(current, reads)
      )
      toast.success("未读通知已全部处理")
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
  const unreadNotices =
    noticesQuery.isSuccess && readsQuery.isSuccess
      ? notices.filter((notice) => !readNoticeIds.has(notice.notice_id))
      : []
  const unreadCount = unreadNotices.length
  const readCount =
    noticesQuery.isSuccess && readsQuery.isSuccess
      ? notices.length - unreadCount
      : 0
  const filteredNotices = filterNotices(notices, readNoticeIds, filter)
  const isLoading =
    currentUser.isPending ||
    noticesQuery.isPending ||
    (userId !== undefined && readsQuery.isPending)
  const hasError =
    currentUser.isError || noticesQuery.isError || readsQuery.isError
  const isMutating = markRead.isPending || markAllRead.isPending
  const isRefreshing =
    currentUser.isRefetching ||
    noticesQuery.isRefetching ||
    (userId !== undefined && readsQuery.isRefetching)
  const isRefreshButtonBusy = isRefreshing || isManualRefreshing
  const triggerLabel = unreadCount > 0 ? `通知，${unreadCount} 条未读` : "通知"
  const filterOptions: AnimatedSegmentedTabsOption<NotificationFilter>[] = [
    {
      label: <NotificationFilterLabel label="全部" count={notices.length} />,
      value: "all",
    },
    {
      label: <NotificationFilterLabel label="未读" count={unreadCount} />,
      value: "unread",
    },
    {
      label: <NotificationFilterLabel label="已读" count={readCount} />,
      value: "read",
    },
  ]

  React.useLayoutEffect(() => {
    const list = listRef.current

    if (!list || isLoading || hasError || prefersReducedMotion()) {
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        list.children,
        { autoAlpha: 0, y: 6 },
        {
          autoAlpha: 1,
          clearProps: "opacity,transform,visibility",
          duration: 0.2,
          ease: "power2.out",
          stagger: 0.025,
          y: 0,
        }
      )
    }, list)

    return () => ctx.revert()
  }, [filter, filteredNotices.length, hasError, isLoading])

  async function retry() {
    const requests: Array<Promise<{ isError: boolean }>> = [
      currentUser.refetch(),
      noticesQuery.refetch(),
    ]

    if (userId !== undefined) {
      requests.push(readsQuery.refetch())
    }

    try {
      const results = await Promise.all(requests)
      return !results.some((result) => result.isError)
    } catch {
      return false
    }
  }

  async function refreshWithFeedback() {
    if (isManualRefreshing) {
      return
    }

    setIsManualRefreshing(true)

    try {
      const [succeeded] = await Promise.all([
        retry(),
        rotateRefreshIcon(refreshIconRef.current),
      ])

      if (succeeded) {
        toast.success("通知已刷新")
      } else {
        toast.error("通知刷新失败")
      }
    } finally {
      setIsManualRefreshing(false)
    }
  }

  function markUnreadNoticesRead() {
    if (unreadNotices.length > 0) {
      markAllRead.mutate(unreadNotices.map((notice) => notice.notice_id))
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label={triggerLabel}
          className="relative overflow-visible"
          size="icon-sm"
          title={triggerLabel}
          variant="outline"
        >
          <BellIcon aria-hidden="true" strokeWidth={2} />
          {unreadCount > 0 ? (
            <Badge
              aria-hidden="true"
              className="pointer-events-none absolute -top-0.5 -right-0.5 z-10 h-4 min-w-4 rounded-full bg-destructive px-1 text-[10px] leading-none text-background ring-2 ring-background"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0 p-0 sm:max-w-md" side="right">
        <SheetHeader className="relative border-b px-4 pt-3 pb-2">
          <div className="flex h-7 items-center pr-24">
            <SheetTitle className="truncate text-base leading-none">
              通知中心
            </SheetTitle>
          </div>
          <div className="absolute top-3 right-12 flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="全部标记为已读"
              title="全部标记为已读"
              disabled={unreadCount === 0 || isMutating}
              onClick={markUnreadNoticesRead}
            >
              {markAllRead.isPending ? (
                <Spinner />
              ) : (
                <CheckCheckIcon data-icon="inline-start" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="刷新通知"
              title="刷新通知"
              disabled={isLoading || isRefreshButtonBusy}
              onClick={() => void refreshWithFeedback()}
            >
              <RefreshCwIcon ref={refreshIconRef} data-icon="inline-start" />
            </Button>
          </div>

          <AnimatedSegmentedTabs
            label="通知筛选"
            options={filterOptions}
            value={filter}
            onValueChange={setFilter}
            className="mt-2"
            listClassName="grid h-8 w-full grid-cols-3"
            triggerClassName="w-full gap-1.5 px-2 text-sm"
            highlightClassName="shadow-none"
          />
        </SheetHeader>

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
                  <Button
                    onClick={() => void refreshWithFeedback()}
                    size="xs"
                    variant="outline"
                  >
                    重试
                  </Button>
                </AlertAction>
              </Alert>
            </div>
          ) : filteredNotices.length === 0 ? (
            <NotificationEmpty filter={filter} />
          ) : (
            <ItemGroup ref={listRef} className="gap-0">
              {filteredNotices.map((notice) => {
                const isUnread = !readNoticeIds.has(notice.notice_id)
                const date = getNoticeDate(notice.created_at)
                const isMarkingRead =
                  (markRead.isPending &&
                    markRead.variables === notice.notice_id) ||
                  (markAllRead.isPending &&
                    markAllRead.variables?.includes(notice.notice_id))

                return (
                  <NoticeItem
                    key={notice.notice_id}
                    notice={notice}
                    date={date}
                    isUnread={isUnread}
                    isMarkingRead={Boolean(isMarkingRead)}
                    onMarkRead={() => markRead.mutate(notice.notice_id)}
                  />
                )
              })}
            </ItemGroup>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function filterNotices(
  notices: Notice[],
  readNoticeIds: Set<number>,
  filter: NotificationFilter
) {
  if (filter === "unread") {
    return notices.filter((notice) => !readNoticeIds.has(notice.notice_id))
  }

  if (filter === "read") {
    return notices.filter((notice) => readNoticeIds.has(notice.notice_id))
  }

  return notices
}

function mergeReads(current: NoticeRead[], incoming: NoticeRead[]) {
  const existingIds = new Set(current.map((item) => item.notice_id))
  const nextReads = incoming.filter((item) => !existingIds.has(item.notice_id))

  return [...nextReads, ...current]
}

function markNoticeRead(noticeId: number, userId: number | undefined) {
  if (userId === undefined) {
    throw new Error("当前用户信息尚未加载完成")
  }

  return http.post<NoticeRead>(
    buildQueryPath(`/notices/${noticeId}/read`, { user_id: userId })
  )
}

function getNoticeDate(value: string) {
  return {
    absolute: formatAbsoluteDateTime(value),
    relative: formatRelativeTime(value),
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "操作失败，请稍后重试。"
}

function rotateRefreshIcon(icon: SVGSVGElement | null) {
  if (!icon || prefersReducedMotion()) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    gsap.killTweensOf(icon)
    gsap.to(icon, {
      duration: 0.55,
      ease: "power2.inOut",
      onComplete: resolve,
      rotation: "+=360",
      transformOrigin: "50% 50%",
    })
  })
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
