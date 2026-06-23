import { BellIcon, BellOffIcon, CheckIcon, MegaphoneIcon } from "lucide-react"

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
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useTranslation } from "@/components/providers/language-context"
import { cn } from "@/lib/utils"

export type NotificationFilter = "all" | "unread" | "read"

export type NoticeListItem = {
  notice_id: number
  notice_title: string
  notice_type: "1" | "2"
  notice_content: string | null
  created_at: string
}

export type NoticeDate = {
  absolute: string
  relative: string
}

export function NotificationFilterLabel({
  label,
  count,
}: {
  label: string
  count: number
}) {
  return (
    <>
      <span>{label}</span>
      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
        {count}
      </Badge>
    </>
  )
}

export function NoticeItem({
  notice,
  date,
  isUnread,
  isMarkingRead,
  onMarkRead,
}: {
  notice: NoticeListItem
  date: NoticeDate
  isUnread: boolean
  isMarkingRead: boolean
  onMarkRead: () => void
}) {
  const { t } = useTranslation()

  return (
    <Item
      size="sm"
      variant="default"
      className={cn(
        "relative rounded-none border-x-0 border-t-0 px-4 py-4",
        isUnread ? "bg-muted/35" : "bg-background"
      )}
    >
      <ItemMedia
        variant="icon"
        className="size-9 rounded-lg bg-muted text-muted-foreground"
      >
        {notice.notice_type === "1" ? <BellIcon /> : <MegaphoneIcon />}
      </ItemMedia>
      <ItemContent className="min-w-0 gap-2 pr-5">
        <ItemHeader className="items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <ItemTitle
              className={cn(
                "line-clamp-2 w-auto",
                isUnread ? "font-semibold" : null
              )}
            >
              {notice.notice_title}
            </ItemTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">
                {notice.notice_type === "1"
                  ? t("notifications.type.notice")
                  : t("notifications.type.announcement")}
              </Badge>
              <time dateTime={notice.created_at} title={date.absolute}>
                {date.relative}
              </time>
            </div>
          </div>
          {isUnread ? (
            <Button
              aria-label={t("notifications.markRead.aria", {
                title: notice.notice_title,
              })}
              disabled={isMarkingRead}
              onClick={onMarkRead}
              size="icon-xs"
              title={t("notifications.markRead.title")}
              variant="ghost"
            >
              {isMarkingRead ? <Spinner /> : <CheckIcon />}
            </Button>
          ) : null}
        </ItemHeader>
        {notice.notice_content ? (
          <ItemDescription
            className="rounded-lg bg-muted/60 px-3 py-2"
            title={notice.notice_content}
          >
            {notice.notice_content}
          </ItemDescription>
        ) : null}
      </ItemContent>
      {isUnread ? (
        <span
          aria-hidden="true"
          className="absolute top-5 right-4 size-2 rounded-full bg-primary"
        />
      ) : null}
    </Item>
  )
}

export function NotificationEmpty({ filter }: { filter: NotificationFilter }) {
  const { t } = useTranslation()
  const title =
    filter === "unread"
      ? t("notifications.empty.unread")
      : filter === "read"
        ? t("notifications.empty.read")
        : t("notifications.empty.all")

  return (
    <Empty className="min-h-80">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BellOffIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {t("notifications.empty.description")}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function NotificationSkeleton() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col" aria-label={t("notifications.loading")}>
      {Array.from({ length: 4 }, (_, index) => (
        <div className="flex gap-3 border-b p-4" key={index}>
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
