import { DesktopApiError } from '@/lib/desktop';
import { toast } from '@/components/ui/toast';

const fallbackMessage = '桌面命令执行失败';

const errorMessages: Record<number, string> = {
  40001: '请求参数不正确',
  40401: '环境或代理不存在',
  40901: '环境正在运行或状态冲突',
  42301: '该环境已有操作正在执行',
  50101: '当前桌面能力不可用',
  50001: '桌面服务执行失败',
};

export function toBrowserErrorMessage(error: unknown) {
  if (error instanceof DesktopApiError) {
    return (
      error.message ||
      (error.code ? errorMessages[error.code] : undefined) ||
      fallbackMessage
    );
  }

  if (error instanceof Error) return error.message;
  return fallbackMessage;
}

export function toastBrowserError(error: unknown) {
  const message = toBrowserErrorMessage(error);
  toast.error(message);
  return message;
}
