"use client"

import { Trash2Icon, XIcon } from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type ResourceTableBulkActionsProps<TData> = {
  selectedCount: number
  selectedRecords: TData[]
  isBulkDeleting: boolean
  onClearSelection: () => void
  onBulkDelete?: (rows: TData[], clearSelection: () => void) => void
}

export function ResourceTableBulkActions<TData>({
  selectedCount,
  selectedRecords,
  isBulkDeleting,
  onClearSelection,
  onBulkDelete,
}: ResourceTableBulkActionsProps<TData>) {
  const { t } = useTranslation()

  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-16 z-20 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10">
        <span className="text-muted-foreground">
          {t("common.selectedCount", { count: selectedCount })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          <XIcon data-icon="inline-start" />
          {t("common.cancelSelection")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isBulkDeleting}
          onClick={() => onBulkDelete?.(selectedRecords, onClearSelection)}
        >
          {isBulkDeleting ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Trash2Icon data-icon="inline-start" />
          )}
          {t("common.bulkDelete")}
        </Button>
      </div>
    </div>
  )
}
