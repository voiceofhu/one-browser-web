import { toast } from "sonner"

export function showResourceCreateSuccess(noun: string) {
  toast.success(`${noun}创建成功`, {
    description: "数据已写入后台，列表已刷新。",
  })
}

export function showResourceUpdateSuccess(noun: string) {
  toast.success(`${noun}保存成功`, {
    description: "变更已同步到后台，列表已刷新。",
  })
}

export function showResourceDeleteSuccess(noun: string) {
  toast.success(`${noun}删除成功`, {
    description: "记录已从当前列表移除。",
  })
}

export function showResourceRefreshSuccess(noun: string) {
  toast.success(`${noun}列表已刷新`, {
    description: "已获取后台最新数据。",
  })
}

export function showResourceError(error: unknown) {
  toast.error(getErrorMessage(error), {
    description: "请检查输入内容或稍后重试。",
  })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "操作失败"
}
