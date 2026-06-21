"use client"

import * as React from "react"

import { listLoginLogs } from "@/api/system/log"
import { systemQueryKeys } from "@/lib/query-keys"
import { loginLogColumns } from "@/views/system/log/columns"
import {
  LogDetailButton,
  LoginLogDetailDialog,
} from "@/views/system/log/log-detail-dialog"
import { LogTable } from "@/views/system/log/log-table"
import type { LoginLogResource } from "@/types/admin"

export default function LoginLogPage() {
  const [detailRecord, setDetailRecord] =
    React.useState<LoginLogResource | null>(null)

  return (
    <>
      <LogTable<LoginLogResource>
        queryKey={systemQueryKeys.loginLogs}
        list={listLoginLogs}
        columns={loginLogColumns}
        defaultColumnVisibility={{
          login_location: false,
          os: false,
        }}
        columnVisibilityResetKey="login-log"
        getRowId={(row, index) => String(row.info_id || index)}
        searchPlaceholder="搜索账号、IP、浏览器、消息..."
        emptyTitle="暂无登录日志"
        emptyDescription="系统还没有记录到任何登录访问。"
        statusFilterLabel="登录日志状态筛选"
        renderRowActions={(record) => (
          <LogDetailButton onClick={() => setDetailRecord(record)} />
        )}
      />
      <LoginLogDetailDialog
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
