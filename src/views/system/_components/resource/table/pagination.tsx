"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ResourceTablePaginationProps = {
  firstRow: number
  lastRow: number
  totalRows: number
  pageIndex: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  isUpdating: boolean
  showControls?: boolean
  onPageIndexChange: (value: number) => void
  onPageSizeChange: (value: number) => void
}

export function ResourceTablePagination({
  firstRow,
  lastRow,
  totalRows,
  pageIndex,
  pageSize,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  isUpdating,
  showControls = true,
  onPageIndexChange,
  onPageSizeChange,
}: ResourceTablePaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          当前显示 {firstRow}-{lastRow} 条，共 {totalRows} 条
        </span>
        {isUpdating ? <span>更新中...</span> : null}
      </div>
      {showControls ? (
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {[10, 20, 50, 100].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} 条
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageIndexChange(0)}
            disabled={!hasPreviousPage}
          >
            <ChevronsLeftIcon />
            <span className="sr-only">第一页</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageIndexChange(Math.max(pageIndex - 1, 0))}
            disabled={!hasPreviousPage}
          >
            <ChevronLeftIcon />
            <span className="sr-only">上一页</span>
          </Button>
          <div className="min-w-24 text-center text-sm text-muted-foreground">
            第 {pageIndex + 1} / {totalPages} 页
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() =>
              onPageIndexChange(Math.min(pageIndex + 1, totalPages - 1))
            }
            disabled={!hasNextPage}
          >
            <ChevronRightIcon />
            <span className="sr-only">下一页</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageIndexChange(totalPages - 1)}
            disabled={!hasNextPage}
          >
            <ChevronsRightIcon />
            <span className="sr-only">最后一页</span>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
