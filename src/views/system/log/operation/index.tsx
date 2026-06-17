import { listOperationLogs } from "@/api/system/log"
import { systemQueryKeys } from "@/lib/query-keys"
import { operationLogColumns } from "@/views/system/log/columns"
import { LogTable } from "@/views/system/log/log-table"
import type { OperationLogResource } from "@/types/admin"

export default function OperationLogPage() {
  return (
    <LogTable<OperationLogResource>
      queryKey={systemQueryKeys.operationLogs}
      list={listOperationLogs}
      columns={operationLogColumns}
      defaultColumnVisibility={{
        oper_param: false,
        json_result: false,
        error_msg: false,
      }}
      columnVisibilityResetKey="operation-log"
      getRowId={(row, index) => String(row.oper_id || index)}
      searchPlaceholder="搜索模块、人员、路径、IP..."
      emptyTitle="暂无操作日志"
      emptyDescription="系统还没有记录到任何后台操作。"
      statusFilterLabel="操作日志状态筛选"
    />
  )
}
