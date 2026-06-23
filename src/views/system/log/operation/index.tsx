"use client"

import * as React from "react"

import { listOperationLogs } from "@/api/system/log"
import { useTranslation } from "@/components/providers/language-context"
import { translateAdminText } from "@/lib/i18n-admin"
import { systemQueryKeys } from "@/lib/query-keys"
import { operationLogColumns } from "@/views/system/log/columns"
import {
  LogDetailButton,
  OperationLogDetailDialog,
} from "@/views/system/log/log-detail-dialog"
import { LogTable } from "@/views/system/log/log-table"
import type { OperationLogSummaryResource } from "@/types/admin"

export default function OperationLogPage() {
  const { locale } = useTranslation()
  const tt = (text: string) => translateAdminText(locale, text)
  const [detailRecord, setDetailRecord] =
    React.useState<OperationLogSummaryResource | null>(null)

  return (
    <>
      <LogTable<OperationLogSummaryResource>
        queryKey={systemQueryKeys.operationLogs}
        list={listOperationLogs}
        columns={operationLogColumns}
        columnVisibilityResetKey="operation-log"
        getRowId={(row, index) => String(row.oper_id || index)}
        searchPlaceholder={tt("搜索模块、人员、路径、IP...")}
        emptyTitle={tt("暂无操作日志")}
        emptyDescription={tt("系统还没有记录到任何后台操作。")}
        statusFilterLabel={tt("操作日志状态筛选")}
        renderRowActions={(record) => (
          <LogDetailButton onClick={() => setDetailRecord(record)} />
        )}
      />
      <OperationLogDetailDialog
        open={Boolean(detailRecord)}
        record={detailRecord}
        onOpenChange={(open) => {
          if (!open) {
            setDetailRecord(null)
          }
        }}
      />
    </>
  )
}
