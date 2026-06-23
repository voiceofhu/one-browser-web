"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Row } from "@tanstack/react-table"
import { GripVerticalIcon } from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import { TableRow } from "@/components/ui/table"
import { translateAdminText } from "@/lib/i18n-admin"
import { cn } from "@/lib/utils"

type SortableControls = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef"
> & {
  disabled: boolean
}

const SortableRowContext = React.createContext<SortableControls | null>(null)

export function SortableResourceTableRow<TData>({
  row,
  disabled,
  children,
}: {
  row: Row<TData>
  disabled: boolean
  children: React.ReactNode
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: row.id, disabled })
  const context = React.useMemo(
    () => ({
      attributes,
      disabled,
      listeners,
      setActivatorNodeRef,
    }),
    [attributes, disabled, listeners, setActivatorNodeRef]
  )
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  }

  return (
    <SortableRowContext.Provider value={context}>
      <TableRow
        ref={setNodeRef}
        style={style}
        data-state={row.getIsSelected() ? "selected" : undefined}
        className={cn(isDragging && "relative bg-muted/80 shadow-sm")}
      >
        {children}
      </TableRow>
    </SortableRowContext.Provider>
  )
}

export function ResourceTableDragHandle({
  disabled = false,
}: {
  disabled?: boolean
}) {
  const { locale } = useTranslation()
  const controls = React.useContext(SortableRowContext)

  if (!controls) {
    return null
  }
  const {
    attributes,
    disabled: rowDisabled,
    listeners,
    setActivatorNodeRef,
  } = controls

  return (
    <Button
      ref={setActivatorNodeRef}
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled || rowDisabled}
      className="cursor-grab text-muted-foreground active:cursor-grabbing"
      aria-label={translateAdminText(locale, "拖拽调整排序")}
      {...attributes}
      {...listeners}
    >
      <GripVerticalIcon />
    </Button>
  )
}
