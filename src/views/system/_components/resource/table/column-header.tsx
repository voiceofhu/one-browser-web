import type { Column } from "@tanstack/react-table"
import { ArrowUpDownIcon } from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import { translateText } from "@/local"

export function ResourceTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>
  title: string
}) {
  const { locale } = useTranslation()
  const translatedTitle = translateText(locale, title)

  if (!column.getCanSort()) {
    return <span>{translatedTitle}</span>
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {translatedTitle}
      <ArrowUpDownIcon data-icon="inline-end" />
    </Button>
  )
}
