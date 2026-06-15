import type { Column } from "@tanstack/react-table"
import { ArrowUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ResourceTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>
  title: string
}) {
  if (!column.getCanSort()) {
    return <span>{title}</span>
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDownIcon data-icon="inline-end" />
    </Button>
  )
}
