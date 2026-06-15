import type { Column } from "@tanstack/react-table"

type ResourceColumnMeta = {
  label?: string
  cellClassName?: string
}

export function getErrorMessage(error: unknown) {
  if (!error) {
    return null
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "服务器返回了未知错误。"
}

export function getColumnMeta<TData, TValue>(column: Column<TData, TValue>) {
  return (column.columnDef.meta ?? {}) as ResourceColumnMeta
}
