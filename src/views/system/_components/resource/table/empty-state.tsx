"use client"

import { PlusIcon, SearchIcon } from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type ResourceTableEmptyStateProps = {
  searchValue: string
  title: string
  description: string
  actionLabel?: string
  isFiltered?: boolean
  onAction?: () => void
}

export function ResourceTableEmptyState({
  searchValue,
  title,
  description,
  actionLabel,
  isFiltered = false,
  onAction,
}: ResourceTableEmptyStateProps) {
  const { t } = useTranslation()
  const hasActiveFilters = isFiltered || searchValue.trim().length > 0

  return (
    <Empty className="min-h-72 flex-1 rounded-none border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>
          {hasActiveFilters ? t("common.noResults") : title}
        </EmptyTitle>
        <EmptyDescription>
          {hasActiveFilters ? t("common.retrySearch") : description}
        </EmptyDescription>
      </EmptyHeader>
      {!hasActiveFilters && onAction && actionLabel ? (
        <EmptyContent>
          <Button type="button" size="sm" onClick={onAction}>
            <PlusIcon data-icon="inline-start" />
            {actionLabel}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
