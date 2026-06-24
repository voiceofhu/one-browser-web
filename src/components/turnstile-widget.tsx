import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type TurnstileRenderOptions = {
  sitekey: string
  action?: string
  theme?: "auto" | "light" | "dark"
  size?: "normal" | "flexible" | "compact"
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

type TurnstileWidgetProps = {
  siteKey: string
  action?: string
  className?: string
  size?: TurnstileRenderOptions["size"]
  onTokenChange: (token: string) => void
  onError?: () => void
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
    className,
    size = "normal",
    onTokenChange,
    onError,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading"
  )

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
    if (
      !scriptReady ||
      loadState === "error" ||
      !window.turnstile ||
      !containerRef.current
    ) {
      return
    }

    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: "auto",
      size,
      callback: onTokenChange,
      "expired-callback": () => onTokenChange(""),
      "error-callback": () => {
        setLoadState("error")
        onTokenChange("")
        onError?.()
      },
    })
    widgetIdRef.current = widgetId
    setLoadState("ready")

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current)
      }
      widgetIdRef.current = null
      onTokenChange("")
    }
  }, [action, loadState, onError, onTokenChange, scriptReady, siteKey, size])

  if (loadState === "error") {
    return null
  }

  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-[65px] w-full max-w-[300px] items-center justify-center",
        className
      )}
    >
      {loadState === "loading" ? (
        <Skeleton className="absolute inset-0 rounded-md" />
      ) : null}
      <div
        ref={containerRef}
        className={cn(
          "transition-opacity duration-200",
          loadState === "ready"
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        )}
      />
    </div>
  )
})

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
