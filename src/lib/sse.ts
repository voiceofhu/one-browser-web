import * as React from "react"

import { getAcceptLanguageHeader } from "@/local"
import { getAccessToken } from "@/lib/auth-tokens"
import {
  buildApiUrl,
  ensureFreshAccessToken,
  HttpError,
  isUnauthorizedError,
} from "@/lib/request"

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

type SseEvent = {
  event: string
  data: string
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

    let cancelled = false
    let abortController: AbortController | null = null
    let reconnectTimer: ReturnType<typeof window.setTimeout> | null = null

    const handleOpen = () => {
      setStatus("open")
      setError(null)
    }

    const handleMessage = (rawData: string) => {
      try {
        const nextData = parse ? parse(rawData) : parseJson<T>(rawData)
        setData(nextData)
        onMessage?.(nextData)
      } catch (cause) {
        setError(getErrorMessage(cause, "实时数据解析失败"))
      }
    }

    const handleError = (event: Event, message = "实时连接异常，正在重新连接。") => {
      onError?.(event)
      if (cancelled) {
        return
      }

      abortController?.abort()
      setStatus("error")
      setError(message)
      scheduleReconnect()
    }

    const closeStream = () => {
      abortController?.abort()
    }

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimer) {
        return
      }

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null
        if (!cancelled) {
          setConnectionKey((key) => key + 1)
        }
      }, 1000)
    }

    const handleSseEvent = (event: SseEvent) => {
      if (event.event !== eventName) {
        return
      }

      handleMessage(event.data)
    }

    const openStream = async (hasRetriedAuth = false): Promise<void> => {
      setStatus("connecting")
      setError(null)
      abortController = new AbortController()

      try {
        await ensureFreshAccessToken()

        if (cancelled) {
          return
        }

        const response = await fetchSse(path, abortController.signal)

        if (response.status === 401 && !hasRetriedAuth) {
          await ensureFreshAccessToken({ force: true })
          return openStream(true)
        }

        if (!response.ok) {
          throw await parseSseError(response)
        }

        if (!response.body) {
          throw new Error("浏览器不支持实时数据流")
        }

        handleOpen()
        await readSseStream(response.body, handleSseEvent)

        if (!cancelled && !abortController.signal.aborted) {
          handleError(new Event("error"), "实时连接已断开，正在重新连接。")
        }
      } catch (cause) {
        if (cancelled || isAbortError(cause)) {
          return
        }

        if (isUnauthorizedError(cause)) {
          setStatus("closed")
          setError(getErrorMessage(cause, "实时连接认证失败"))
          return
        }

        handleError(
          new Event("error"),
          getErrorMessage(cause, "实时连接异常，正在重新连接。")
        )
      }
    }

    void openStream()
    window.addEventListener("pagehide", closeStream)

    return () => {
      cancelled = true
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
      }
      window.removeEventListener("pagehide", closeStream)
      abortController?.abort()
    }
  }, [connectionKey, enabled, eventName, onError, onMessage, parse, path])

  return {
    data,
    error,
    status: enabled ? status : "closed",
    reconnect,
  }
}

function fetchSse(path: string, signal: AbortSignal) {
  const accessToken = getAccessToken()
  const headers = new Headers()
  headers.set("Accept", "text/event-stream")
  headers.set("Accept-Language", getAcceptLanguageHeader())
  headers.set("Cache-Control", "no-cache")

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  return fetch(buildApiUrl(path), {
    credentials: "omit",
    headers,
    signal,
  })
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: SseEvent) => void
) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      buffer = drainSseBuffer(normalizeLineEndings(buffer), onEvent)
    }

    buffer += decoder.decode()
    drainSseBuffer(`${normalizeLineEndings(buffer)}\n\n`, onEvent)
  } finally {
    reader.releaseLock()
  }
}

function drainSseBuffer(
  buffer: string,
  onEvent: (event: SseEvent) => void
) {
  let boundary = buffer.indexOf("\n\n")

  while (boundary >= 0) {
    const rawEvent = buffer.slice(0, boundary)
    const event = parseSseEvent(rawEvent)
    if (event) {
      onEvent(event)
    }

    buffer = buffer.slice(boundary + 2)
    boundary = buffer.indexOf("\n\n")
  }

  return buffer
}

function parseSseEvent(rawEvent: string): SseEvent | null {
  const data: string[] = []
  let event = "message"

  rawEvent.split("\n").forEach((line) => {
    if (!line || line.startsWith(":")) {
      return
    }

    const separator = line.indexOf(":")
    const field = separator === -1 ? line : line.slice(0, separator)
    let value = separator === -1 ? "" : line.slice(separator + 1)
    if (value.startsWith(" ")) {
      value = value.slice(1)
    }

    if (field === "event") {
      event = value || "message"
    }

    if (field === "data") {
      data.push(value)
    }
  })

  if (data.length === 0) {
    return null
  }

  return { event, data: data.join("\n") }
}

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

async function parseSseError(response: Response) {
  const fallback = response.statusText || "实时连接失败"

  try {
    const body: unknown = await response.json()
    if (!isApiErrorResponse(body)) {
      return new HttpError(response.status, "HTTP_ERROR", fallback)
    }

    return new HttpError(
      response.status,
      String(body.code),
      body.message,
      body.details ?? null
    )
  } catch {
    return new HttpError(response.status, "HTTP_ERROR", fallback)
  }
}

function isApiErrorResponse(value: unknown): value is {
  code: string | number
  message: string
  details?: unknown
} {
  return (
    value !== null &&
    typeof value === "object" &&
    "code" in value &&
    "message" in value &&
    (typeof value.code === "string" || typeof value.code === "number") &&
    typeof value.message === "string"
  )
}

function parseJson<T>(data: string) {
  return JSON.parse(data) as T
}

function isAbortError(cause: unknown) {
  return cause instanceof DOMException && cause.name === "AbortError"
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
