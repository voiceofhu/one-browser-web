"use client"

import * as React from "react"

import { UpdateAvailableDialog } from "@/components/update-available-dialog"

const APP_UPDATE_CHECKER_WORKER_URL = "/app-update-checker.worker.js"

type AppUpdateCheckerWorkerMessage =
  | {
      type: "baseline" | "unchanged" | "unavailable"
      url: string
      source?: string
    }
  | {
      type: "changed"
      url: string
      source?: string
      current?: PageValidator
      previous?: PageValidator
    }
  | {
      type: "error"
      url: string
      source?: string
      message?: string
    }

type PageValidator = {
  etag: string | null
  lastModified: string | null
}

export function AppUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = React.useState(false)

  React.useEffect(() => {
    if (
      !import.meta.env.PROD ||
      typeof window === "undefined" ||
      typeof Worker === "undefined" ||
      !isHttpProtocol(window.location.protocol)
    ) {
      return
    }

    let worker: Worker

    try {
      worker = new Worker(APP_UPDATE_CHECKER_WORKER_URL, {
        name: "app-update-checker",
        type: "module",
      })
    } catch (error) {
      console.warn("App update checker worker failed to start.", error)
      return
    }

    const requestCheck = (source: string) => {
      if (document.visibilityState === "hidden") {
        return
      }

      worker.postMessage({
        type: "check",
        source,
        url: window.location.href,
      })
    }

    const handleWorkerMessage = (
      event: MessageEvent<AppUpdateCheckerWorkerMessage>
    ) => {
      const message = event.data
      if (!message) {
        return
      }

      if (message.type === "changed") {
        setUpdateAvailable(true)
        return
      }

      if (message.type === "error") {
        console.debug("App update check failed.", message.message)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestCheck("visibilitychange")
      }
    }

    worker.addEventListener("message", handleWorkerMessage)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    requestCheck("mount")

    return () => {
      worker.removeEventListener("message", handleWorkerMessage)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      worker.terminate()
    }
  }, [])

  return (
    <UpdateAvailableDialog
      open={updateAvailable}
      onOpenChange={setUpdateAvailable}
      onUpdate={reloadWithTimestamp}
    />
  )
}

function reloadWithTimestamp() {
  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.set("t", Date.now().toString())
  window.location.replace(nextUrl.toString())
}

function isHttpProtocol(protocol: string) {
  return protocol === "http:" || protocol === "https:"
}
