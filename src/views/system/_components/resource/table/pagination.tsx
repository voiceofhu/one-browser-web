"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
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
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t bg-muted px-3 py-2 sm:flex-row sm:items-center sm:justify-between lg:px-4">
      <div className="flex items-center gap-2 text-sm leading-none text-muted-foreground">
        <span>
          {t("common.pageSummary", {
            first: firstRow,
            last: lastRow,
            total: totalRows,
          })}
        </span>
        {isUpdating ? <span>{t("common.updating")}</span> : null}
      </div>
      {showControls ? (
        <div className="flex items-center gap-1.5">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger size="sm" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {[10, 20, 50, 100].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {t("common.pageSize", { count: value })}
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
            <span className="sr-only">{t("common.firstPage")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageIndexChange(Math.max(pageIndex - 1, 0))}
            disabled={!hasPreviousPage}
          >
            <ChevronLeftIcon />
            <span className="sr-only">{t("common.previousPage")}</span>
          </Button>
          <div className="min-w-20 text-center text-sm leading-none text-muted-foreground">
            {t("common.pageCount", {
              page: pageIndex + 1,
              total: totalPages,
            })}
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
            <span className="sr-only">{t("common.nextPage")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageIndexChange(totalPages - 1)}
            disabled={!hasNextPage}
          >
            <ChevronsRightIcon />
            <span className="sr-only">{t("common.lastPage")}</span>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
