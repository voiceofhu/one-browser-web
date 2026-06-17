"use client"

import { PlusIcon, SearchIcon } from "lucide-react"

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
  const hasActiveFilters = isFiltered || searchValue.trim().length > 0

  return (
    <Empty className="min-h-72 flex-1 rounded-none border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>{hasActiveFilters ? "没有匹配结果" : title}</EmptyTitle>
        <EmptyDescription>
          {hasActiveFilters
            ? "换个关键词或筛选条件试试，搜索会直接请求后台分页接口。"
            : description}
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
