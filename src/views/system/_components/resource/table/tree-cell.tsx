"use client"

import type * as React from "react"
import type { Row } from "@tanstack/react-table"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import { translateAdminText } from "@/lib/i18n-admin"

type ResourceTableTreeCellProps<TData> = {
  row: Row<TData>
  children: React.ReactNode
}

export function ResourceTableTreeCell<TData>({
  row,
  children,
}: ResourceTableTreeCellProps<TData>) {
  const { locale } = useTranslation()
  const canExpand = row.getCanExpand()
  const expanded = row.getIsExpanded()

  return (
    <div
      className="flex min-w-0 items-center gap-1.5"
      style={{ paddingLeft: row.depth * 20 }}
    >
      {canExpand ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={
            expanded
              ? translateAdminText(locale, "收起节点")
              : translateAdminText(locale, "展开节点")
          }
          aria-expanded={expanded}
          onClick={row.getToggleExpandedHandler()}
        >
          {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Button>
      ) : (
        <span className="size-6 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
