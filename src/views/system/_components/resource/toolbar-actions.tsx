"use client"

import { PlusIcon, RefreshCwIcon } from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ResourceToolbarActionsProps = {
  isRefreshing: boolean
  onRefresh: () => void
  onCreate?: () => void
}

export function ResourceToolbarActions({
  isRefreshing,
  onRefresh,
  onCreate,
}: ResourceToolbarActionsProps) {
  const { t } = useTranslation()

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCwIcon
          data-icon="inline-start"
          className={cn(isRefreshing && "animate-spin")}
        />
        {t("common.refresh")}
      </Button>
      {onCreate ? (
        <Button type="button" size="sm" onClick={onCreate}>
          <PlusIcon data-icon="inline-start" />
          {t("common.create")}
        </Button>
      ) : null}
    </>
  )
}
