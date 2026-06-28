import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import { cn } from "@/lib/utils"

type TurnstileRenderOptions = {
  sitekey: string
  action?: string
  theme?: "auto" | "light" | "dark"
  size?: "normal" | "flexible" | "compact"
  appearance?: "always" | "execute" | "interaction-only"
  callback?: (token: string) => void
  "expired-callback"?: () => void
  "error-callback"?: (errorCode?: string) => void
  "timeout-callback"?: () => void
  "unsupported-callback"?: () => void
}

type TurnstileApi = {
  render: (
    container: string | HTMLElement,
    options: TurnstileRenderOptions
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export type TurnstileWidgetHandle = {
  reset: () => void
}

export type TurnstileWidgetStatus = "loading" | "ready" | "error"

type TurnstileWidgetProps = {
  siteKey: string
  action?: string
  appearance?: TurnstileRenderOptions["appearance"]
  className?: string
  size?: TurnstileRenderOptions["size"]
  loadingLabel?: string
  onTokenChange: (token: string) => void
  onError?: () => void
  onStatusChange?: (status: TurnstileWidgetStatus) => void
}

let turnstileScriptPromise: Promise<void> | null = null
const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile"
const TURNSTILE_RENDER_TIMEOUT_MS = 8000
const TURNSTILE_LOG_PREFIX = "[TurnstileWidget]"

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget(
  {
    siteKey,
    action = "login",
    appearance = "always",
    className,
    size = "normal",
    loadingLabel,
    onTokenChange,
    onError,
    onStatusChange,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [loadState, setLoadState] = useState<TurnstileWidgetStatus>("loading")

  useImperativeHandle(ref, () => ({
    reset() {
      const widgetId = widgetIdRef.current
      if (!widgetId || !window.turnstile) {
        logTurnstileDebug("reset skipped", {
          hasWidgetId: Boolean(widgetId),
          hasApi: Boolean(window.turnstile),
        })
        onTokenChange("")
        return
      }

      logTurnstileDebug("reset", { widgetId })
      window.turnstile.reset(widgetId)
      onTokenChange("")
    },
  }))

  useEffect(() => {
    logTurnstileDebug("status change", { loadState })
    onStatusChange?.(loadState)
  }, [loadState, onStatusChange])

  useEffect(() => {
    let active = true

    logTurnstileDebug("script load requested", {
      hasApi: typeof window !== "undefined" ? Boolean(window.turnstile) : false,
    })
    loadTurnstileScript()
      .then(() => {
        if (active) {
          logTurnstileDebug("script ready")
          setScriptReady(true)
          setLoadState("loading")
        }
      })
      .catch((error) => {
        if (active) {
          logTurnstileWarn("script load failed", {
            error: describeError(error),
          })
          setLoadState("error")
          onError?.()
        }
      })

    return () => {
      active = false
    }
  }, [onError])

  useEffect(() => {
    if (!scriptReady || !window.turnstile || !containerRef.current) {
      return
    }

    let active = true
    let renderErrorTimer: number | undefined
    let renderTimeoutTimer: number | undefined
    const container = containerRef.current
    const clearRenderTimers = () => {
      if (renderErrorTimer !== undefined) {
        window.clearTimeout(renderErrorTimer)
        renderErrorTimer = undefined
      }
      if (renderTimeoutTimer !== undefined) {
        window.clearTimeout(renderTimeoutTimer)
        renderTimeoutTimer = undefined
      }
    }
    const removeRenderedWidget = () => {
      const widgetId = widgetIdRef.current
      widgetIdRef.current = null

      if (!widgetId || !window.turnstile) {
        logTurnstileDebug("remove skipped", {
          hasWidgetId: Boolean(widgetId),
          hasApi: Boolean(window.turnstile),
        })
        return
      }

      try {
        logTurnstileDebug("remove", { widgetId })
        window.turnstile.remove(widgetId)
      } catch (error) {
        logTurnstileWarn("remove failed", {
          widgetId,
          error: describeError(error),
        })
        // Turnstile may already have detached a failed widget.
      }
    }
    const failWidget = () => {
      logTurnstileWarn("fail widget", snapshotContainer(container))
      clearRenderTimers()
      removeRenderedWidget()
      setLoadState("error")
      onTokenChange("")
      onError?.()
    }

    try {
      logTurnstileDebug("render start", {
        action,
        appearance,
        size,
        siteKey: maskValue(siteKey),
      })
      const widgetId = window.turnstile.render(container, {
        sitekey: siteKey,
        action,
        appearance,
        theme: "auto",
        size,
        callback: (token) => {
          if (!active) {
            logTurnstileDebug("token callback ignored after cleanup")
            return
          }

          logTurnstileDebug("token callback", {
            widgetId: widgetIdRef.current,
            tokenLength: token.length,
          })
          setLoadState("ready")
          onTokenChange(token)
        },
        "expired-callback": () => {
          if (!active) {
            logTurnstileDebug("expired callback ignored after cleanup")
            return
          }

          logTurnstileWarn("expired callback", {
            widgetId: widgetIdRef.current,
          })
          setLoadState("ready")
          onTokenChange("")
        },
        "error-callback": (errorCode) => {
          if (!active) {
            logTurnstileDebug("error callback ignored after cleanup", {
              errorCode,
            })
            return
          }

          logTurnstileWarn("error callback", {
            widgetId: widgetIdRef.current,
            errorCode,
            ...snapshotContainer(container),
          })
          setLoadState("ready")
          onTokenChange("")
        },
        "timeout-callback": () => {
          if (!active) {
            logTurnstileDebug("timeout callback ignored after cleanup")
            return
          }

          logTurnstileWarn("timeout callback", {
            widgetId: widgetIdRef.current,
            ...snapshotContainer(container),
          })
          setLoadState("ready")
          onTokenChange("")
        },
        "unsupported-callback": () => {
          if (!active) {
            logTurnstileDebug("unsupported callback ignored after cleanup")
            return
          }

          logTurnstileWarn("unsupported callback", {
            widgetId: widgetIdRef.current,
            ...snapshotContainer(container),
          })
          setLoadState("ready")
          onTokenChange("")
        },
      })
      widgetIdRef.current = widgetId
      logTurnstileDebug("render success", {
        widgetId,
        ...snapshotContainer(container),
      })
      setLoadState("ready")
      renderTimeoutTimer = window.setTimeout(() => {
        if (!active || container.querySelector("iframe")) {
          return
        }

        logTurnstileWarn("render timeout without iframe", {
          widgetId,
          ...snapshotContainer(container),
        })
        failWidget()
      }, TURNSTILE_RENDER_TIMEOUT_MS)
    } catch (error) {
      logTurnstileWarn("render threw", {
        error: describeError(error),
      })
      renderErrorTimer = window.setTimeout(() => {
        if (active) {
          failWidget()
        }
      }, 0)
    }

    return () => {
      active = false
      logTurnstileDebug("cleanup", {
        widgetId: widgetIdRef.current,
        ...snapshotContainer(container),
      })
      clearRenderTimers()
      removeRenderedWidget()
      onTokenChange("")
    }
  }, [action, appearance, onError, onTokenChange, scriptReady, siteKey, size])

  if (loadState === "error") {
    return null
  }

  const reserveWidgetSpace = appearance === "always"

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-[300px] items-center justify-center",
        reserveWidgetSpace ? "min-h-[65px]" : "min-h-0",
        className
      )}
    >
      {loadState === "loading" && loadingLabel ? (
        <span className="sr-only" role="status" aria-live="polite">
          {loadingLabel}
        </span>
      ) : null}
      <div ref={containerRef} className="relative w-full" />
    </div>
  )
})

function logTurnstileDebug(message: string, details?: Record<string, unknown>) {
  console.info(TURNSTILE_LOG_PREFIX, message, details ?? {})
}

function logTurnstileWarn(message: string, details?: Record<string, unknown>) {
  console.warn(TURNSTILE_LOG_PREFIX, message, details ?? {})
}

function snapshotContainer(container: HTMLElement) {
  const iframe = container.querySelector("iframe")

  return {
    childCount: container.childElementCount,
    hasIframe: Boolean(iframe),
    iframeOrigin: iframe?.src ? getUrlOrigin(iframe.src) : null,
  }
}

function describeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    }
  }

  return String(error)
}

function maskValue(value: string) {
  if (value.length <= 8) {
    return "***"
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

function getUrlOrigin(value: string) {
  try {
    return new URL(value).origin
  } catch {
    return "invalid-url"
  }
}

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser"))
  }

  if (window.turnstile) {
    logTurnstileDebug("script already available")
    return Promise.resolve()
  }

  if (turnstileScriptPromise) {
    logTurnstileDebug("reuse pending script promise")
    return turnstileScriptPromise
  }

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      TURNSTILE_SCRIPT_ID
    ) as HTMLScriptElement | null
    if (existing) {
      if (existing.dataset.loaded === "true") {
        logTurnstileDebug("existing script loaded")
        waitForTurnstile(resolve, reject)
        return
      }

      logTurnstileDebug("wait for existing script")
      existing.addEventListener(
        "load",
        () => {
          existing.dataset.loaded = "true"
          logTurnstileDebug("existing script load event")
          waitForTurnstile(resolve, reject)
        },
        { once: true }
      )
      existing.addEventListener(
        "error",
        () => {
          turnstileScriptPromise = null
          logTurnstileWarn("existing script error event")
          reject(new Error("failed to load Turnstile script"))
        },
        { once: true }
      )
      return
    }

    const script = document.createElement("script")
    script.id = TURNSTILE_SCRIPT_ID
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    script.async = true
    script.defer = true
    logTurnstileDebug("append script", { src: getUrlOrigin(script.src) })
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true"
        logTurnstileDebug("script load event")
        waitForTurnstile(resolve, reject)
      },
      { once: true }
    )
    script.addEventListener(
      "error",
      () => {
        turnstileScriptPromise = null
        script.remove()
        logTurnstileWarn("script error event")
        reject(new Error("failed to load Turnstile script"))
      },
      { once: true }
    )
    document.head.appendChild(script)
  })

  return turnstileScriptPromise
}

function waitForTurnstile(
  resolve: () => void,
  reject: (error: Error) => void,
  attempt = 0
) {
  if (window.turnstile) {
    logTurnstileDebug("api ready", { attempt })
    resolve()
    return
  }

  if (attempt >= 50) {
    turnstileScriptPromise = null
    logTurnstileWarn("api wait timeout", { attempt })
    reject(new Error("Turnstile API was not ready after loading"))
    return
  }

  window.setTimeout(() => waitForTurnstile(resolve, reject, attempt + 1), 20)
}
