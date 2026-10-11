import type { AppErrorPayload } from '@/features/browser/contracts';
import { invokeMockCommand } from '@/lib/desktop/mock';
import {
  DesktopApiError,
  type DesktopCommand,
  type DesktopCommandArgs,
  type DesktopInvokeOptions,
} from '@/lib/desktop/types';

declare global {
  interface Window {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  }
}

export async function desktopInvoke<T>(
  command: DesktopCommand,
  args?: DesktopCommandArgs,
  options: DesktopInvokeOptions = {},
): Promise<T> {
  console.info('[desktop-debug] invoke start', {
    command,
    args: summarizeDesktopArgs(args),
    runtime: getDesktopRuntimeDebugInfo(),
  });

  if (isTauriRuntime()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<T>(command, args);
      console.info('[desktop-debug] invoke success', {
        command,
        runtime: getDesktopRuntimeDebugInfo(),
      });
      return result;
    } catch (error) {
      const normalizedError = normalizeDesktopError(error);
      const logPayload = {
        command,
        error: summarizeDesktopError(error),
        runtime: getDesktopRuntimeDebugInfo(),
      };

      if (isExpectedDesktopCommandError(normalizedError)) {
        console.info('[desktop-debug] invoke rejected', logPayload);
      } else {
        console.error('[desktop-debug] invoke failed', logPayload);
      }

      throw normalizedError;
    }
  }

  if (shouldUseMock(options.mock)) {
    console.info('[desktop-debug] invoke mock', {
      command,
      runtime: getDesktopRuntimeDebugInfo(),
    });
    return invokeMockCommand<T>(command, args);
  }

  console.error('[desktop-debug] invoke unavailable', {
    command,
    runtime: getDesktopRuntimeDebugInfo(),
  });
  throw new DesktopApiError('Tauri 运行环境不可用', { code: 50101 });
}

export function isTauriRuntime() {
  return (
    typeof window !== 'undefined' &&
    (Boolean(window.__TAURI_INTERNALS__) || Boolean(window.__TAURI__))
  );
}

function getDesktopRuntimeDebugInfo() {
  if (typeof window === 'undefined') {
    return {
      isTauri: false,
      hasTauri: false,
      hasTauriInternals: false,
      origin: 'server',
      protocol: 'server',
    };
  }

  return {
    isTauri: isTauriRuntime(),
    hasTauri: Boolean(window.__TAURI__),
    hasTauriInternals: Boolean(window.__TAURI_INTERNALS__),
    origin: window.location.origin,
    protocol: window.location.protocol,
    pathname: window.location.pathname,
  };
}

function summarizeDesktopArgs(args: DesktopCommandArgs | undefined) {
  return args ? summarizeRecord(args) : null;
}

function summarizeRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      summarizeValue(key, value),
    ]),
  );
}

function summarizeValue(key: string, value: unknown): unknown {
  if (isSensitiveDesktopArgKey(key)) {
    return '[redacted]';
  }
  if (Array.isArray(value)) {
    return `[array:${value.length}]`;
  }
  if (typeof value === 'string') {
    return summarizeString(value);
  }
  if (isRecord(value)) {
    return summarizeRecord(value);
  }
  return value;
}

function isSensitiveDesktopArgKey(key: string) {
  const normalized = key.toLowerCase();
  return ['token', 'password', 'secret', 'credential'].some((part) =>
    normalized.includes(part),
  );
}

function summarizeString(value: string) {
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return `${url.origin}${url.pathname}${url.search ? '?[query]' : ''}`;
    } catch {
      return value.slice(0, 120);
    }
  }
  return value.length > 160
    ? `${value.slice(0, 80)}...[${value.length}]`
    : value;
}

function summarizeDesktopError(error: unknown) {
  if (isAppErrorPayload(error)) {
    return {
      code: error.code,
      message: error.message,
      details: error.details ?? null,
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }
  return error;
}

function shouldUseMock(option?: boolean) {
  if (option !== undefined) {
    return option;
  }
  return (
    typeof window !== 'undefined' &&
    (import.meta.env.DEV || import.meta.env.VITE_DESKTOP_API_MOCK === '1')
  );
}

function normalizeDesktopError(error: unknown) {
  if (isAppErrorPayload(error)) {
    return new DesktopApiError(error.message, error);
  }
  if (error instanceof Error) {
    return new DesktopApiError(error.message);
  }
  if (typeof error === 'string') {
    return new DesktopApiError(error);
  }
  return new DesktopApiError('桌面命令执行失败');
}

function isExpectedDesktopCommandError(error: DesktopApiError) {
  return (
    error.code === 40001 ||
    error.code === 40401 ||
    error.code === 40901 ||
    error.code === 42301 ||
    error.code === 50101
  );
}

function isAppErrorPayload(error: unknown): error is AppErrorPayload {
  return (
    isRecord(error) && 'code' in error && typeof error.message === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
