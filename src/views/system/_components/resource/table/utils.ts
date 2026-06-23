import type { Column } from "@tanstack/react-table"

import { translate, type Locale } from "@/local"

type ResourceColumnMeta = {
  label?: string
  headerClassName?: string
  cellClassName?: string
}

export function getErrorMessage(error: unknown, locale?: Locale) {
  if (!error) {
    return null
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return translate(locale, "common.unknownServerError")
}

export function getColumnMeta<TData, TValue>(column: Column<TData, TValue>) {
  return (column.columnDef.meta ?? {}) as ResourceColumnMeta
}
