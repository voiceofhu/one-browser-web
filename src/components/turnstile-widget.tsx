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
  "error-callback"?: () => void
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
        onTokenChange("")
        return
      }

      window.turnstile.reset(widgetId)
      onTokenChange("")
    },
  }))

  useEffect(() => {
    onStatusChange?.(loadState)
  }, [loadState, onStatusChange])

  useEffect(() => {
    let active = true

    loadTurnstileScript()
      .then(() => {
        if (active) {
          setScriptReady(true)
          setLoadState("loading")
        }
      })
      .catch(() => {
        if (active) {
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
    let cleanupFrameWatcher: (() => void) | undefined
    const container = containerRef.current

    try {
      setLoadState("loading")
      const widgetId = window.turnstile.render(container, {
        sitekey: siteKey,
        action,
        appearance,
        theme: "auto",
        size,
        callback: (token) => {
          setLoadState("ready")
          onTokenChange(token)
        },
        "expired-callback": () => {
          setLoadState("ready")
          onTokenChange("")
        },
        "error-callback": () => {
          setLoadState("error")
          onTokenChange("")
          onError?.()
        },
      })
      widgetIdRef.current = widgetId
      cleanupFrameWatcher = watchTurnstileFrame(container, () => {
        if (active) {
          setLoadState("ready")
        }
      })
    } catch {
      if (active) {
        setLoadState("error")
        onTokenChange("")
        onError?.()
      }
    }

    return () => {
      active = false
      cleanupFrameWatcher?.()
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current)
      }
      widgetIdRef.current = null
      onTokenChange("")
    }
  }, [action, appearance, onError, onTokenChange, scriptReady, siteKey, size])

  if (loadState === "error") {
    return null
  }

  const reserveWidgetSpace = appearance === "always"
  const revealWidget = reserveWidgetSpace || loadState === "ready"

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
      <div
        ref={containerRef}
        className={cn(
          "transition-opacity duration-200",
          revealWidget
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        )}
      />
    </div>
  )
})

function watchTurnstileFrame(container: HTMLElement, onReady: () => void) {
  let frame: HTMLIFrameElement | null = null
  let observer: MutationObserver | null = null

  function cleanup() {
    observer?.disconnect()
    frame?.removeEventListener("load", handleReady)
  }

  function handleReady() {
    cleanup()
    onReady()
  }

  function attachFrameListener() {
    const nextFrame = container.querySelector("iframe")
    if (!(nextFrame instanceof HTMLIFrameElement)) {
      return false
    }

    frame = nextFrame
    frame.addEventListener("load", handleReady, { once: true })
    return true
  }

  observer = new MutationObserver(() => {
    if (attachFrameListener()) {
      observer?.disconnect()
    }
  })

  if (!attachFrameListener()) {
    observer.observe(container, { childList: true, subtree: true })
  }

  return cleanup
}

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser"))
  }

  if (window.turnstile) {
    return Promise.resolve()
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise
  }

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      TURNSTILE_SCRIPT_ID
    ) as HTMLScriptElement | null
    if (existing) {
      if (existing.dataset.loaded === "true") {
        waitForTurnstile(resolve, reject)
        return
      }

      existing.addEventListener(
        "load",
        () => {
          existing.dataset.loaded = "true"
          waitForTurnstile(resolve, reject)
        },
        { once: true }
      )
      existing.addEventListener(
        "error",
        () => {
          turnstileScriptPromise = null
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
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true"
        waitForTurnstile(resolve, reject)
      },
      { once: true }
    )
    script.addEventListener(
      "error",
      () => {
        turnstileScriptPromise = null
        script.remove()
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
    resolve()
    return
  }

  if (attempt >= 50) {
    turnstileScriptPromise = null
    reject(new Error("Turnstile API was not ready after loading"))
    return
  }

  window.setTimeout(() => waitForTurnstile(resolve, reject, attempt + 1), 20)
}
