import * as React from "react"

import { buildApiUrl } from "@/lib/request"

export type SseStatus = "connecting" | "open" | "error" | "closed"

type UseSseOptions<T> = {
  path: string
  eventName?: string
  enabled?: boolean
  parse?: (data: string) => T
  onMessage?: (data: T) => void
  onError?: (event: Event) => void
}

type UseSseResult<T> = {
  data: T | null
  error: string | null
  status: SseStatus
  reconnect: () => void
}

export function useSse<T>({
  path,
  eventName = "message",
  enabled = true,
  parse,
  onMessage,
  onError,
}: UseSseOptions<T>): UseSseResult<T> {
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<SseStatus>(
    enabled ? "connecting" : "closed"
  )
  const [connectionKey, setConnectionKey] = React.useState(0)

  const reconnect = React.useCallback(() => {
    setStatus("connecting")
    setError(null)
    setConnectionKey((key) => key + 1)
  }, [])

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    const source = new EventSource(buildApiUrl(path), {
      withCredentials: true,
    })

    const handleOpen = () => {
      setStatus("open")
      setError(null)
    }

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const nextData = parse ? parse(event.data) : parseJson<T>(event.data)
        setData(nextData)
        onMessage?.(nextData)
      } catch (cause) {
        setError(getErrorMessage(cause, "实时数据解析失败"))
      }
    }

    const handleError = (event: Event) => {
      if (source.readyState === EventSource.CLOSED) {
        setStatus("closed")
        setError("实时连接已断开。")
      } else {
        setStatus("error")
        setError("实时连接异常，浏览器会尝试自动重连。")
      }
      onError?.(event)
    }

    const closeSource = () => {
      source.close()
    }

    source.addEventListener("open", handleOpen)
    source.addEventListener(eventName, handleMessage as EventListener)
    source.addEventListener("error", handleError)
    window.addEventListener("pagehide", closeSource)

    return () => {
      source.removeEventListener("open", handleOpen)
      source.removeEventListener(eventName, handleMessage as EventListener)
      source.removeEventListener("error", handleError)
      window.removeEventListener("pagehide", closeSource)
      source.close()
    }
  }, [connectionKey, enabled, eventName, onError, onMessage, parse, path])

  return {
    data,
    error,
    status: enabled ? status : "closed",
    reconnect,
  }
}

function parseJson<T>(data: string) {
  return JSON.parse(data) as T
}

function getErrorMessage(cause: unknown, fallback: string) {
  if (cause instanceof Error) {
    return cause.message
  }

  if (typeof cause === "string") {
    return cause
  }

  return fallback
}
