import { isTauriRuntime } from '@/lib/desktop';
import { http } from '@/lib/http';
import { getApiBaseUrl, toBackendUrl } from '@/lib/http/url';
import * as React from 'react';

import type { HealthSnapshot } from './types';

const HEALTH_PATH = '/system/monitor/health';

export function useHealthStream() {
  const [snapshot, setSnapshot] = React.useState<HealthSnapshot | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);
  const [connectionKey, setConnectionKey] = React.useState(0);

  React.useEffect(() => {
    let disposed = false;
    let source: EventSource | null = null;
    let pollingTimer: number | null = null;

    const applySnapshot = (next: HealthSnapshot) => {
      if (disposed) return;
      setSnapshot(next);
      setLastUpdated(Date.now());
      setError(null);
    };

    const loadSnapshot = async () => {
      const response = await http.get<HealthSnapshot>(HEALTH_PATH);
      applySnapshot(response.data);
    };

    const startDesktopPolling = () => {
      const poll = async () => {
        try {
          await loadSnapshot();
          if (!disposed) setIsConnected(true);
        } catch (pollError) {
          if (!disposed) {
            setIsConnected(false);
            setError(toErrorMessage(pollError));
          }
        } finally {
          if (!disposed) pollingTimer = window.setTimeout(poll, 1_000);
        }
      };
      pollingTimer = window.setTimeout(poll, 1_000);
    };

    const startBrowserStream = () => {
      const url = toBackendUrl(`${getApiBaseUrl()}${HEALTH_PATH}/stream`);
      source = new EventSource(url, { withCredentials: true });
      source.onopen = () => {
        if (disposed) return;
        setIsConnected(true);
        setError(null);
      };
      source.addEventListener('health', (event) => {
        try {
          applySnapshot(JSON.parse(event.data) as HealthSnapshot);
        } catch {
          setError('实时监控数据格式无效');
        }
      });
      source.onerror = () => {
        if (disposed) return;
        setIsConnected(false);
        setError('实时流连接中断，正在自动重连');
      };
    };

    const start = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadSnapshot();
        if (disposed) return;
        setIsConnected(true);
        if (isTauriRuntime()) {
          startDesktopPolling();
        } else {
          startBrowserStream();
        }
      } catch (startError) {
        if (!disposed) {
          setIsConnected(false);
          setError(toErrorMessage(startError));
        }
      } finally {
        if (!disposed) setIsLoading(false);
      }
    };

    void start();
    return () => {
      disposed = true;
      source?.close();
      if (pollingTimer !== null) window.clearTimeout(pollingTimer);
    };
  }, [connectionKey]);

  const reconnect = React.useCallback(() => {
    setIsConnected(false);
    setConnectionKey((current) => current + 1);
  }, []);

  return {
    snapshot,
    isConnected,
    isLoading,
    error,
    lastUpdated,
    reconnect,
  };
}

function toErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : '服务监控连接失败';
}
