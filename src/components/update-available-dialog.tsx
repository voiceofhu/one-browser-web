"use client"

import { Dialog } from "@base-ui/react/dialog"
import { RefreshCw, X } from "lucide-react"
import * as React from "react"

import { useTranslation } from "@/components/providers/language-context"
import { cn } from "@/lib/utils"

export interface UpdateAvailableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function UpdateAvailableDialog({
  open,
  onOpenChange,
  onUpdate,
}: UpdateAvailableDialogProps) {
  const { t } = useTranslation()
  const [updating, setUpdating] = React.useState(false)

  function handleUpdate() {
    setUpdating(true)
    onUpdate?.()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Popup
          className={cn(
            "fixed right-4 bottom-4 left-4 z-50 rounded-xl border border-border",
            "bg-card p-4 text-card-foreground shadow-lg outline-none",
            "transition-all duration-200 ease-out sm:right-5 sm:left-auto sm:w-96",
            "data-[starting-style]:translate-y-3 data-[starting-style]:opacity-0",
            "data-[ending-style]:translate-y-3 data-[ending-style]:opacity-0"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <RefreshCw className={cn("size-4", updating && "animate-spin")} />
            </div>

            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-sm font-semibold">
                {t("updateAvailable.title")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t("updateAvailable.description")}
              </Dialog.Description>

              <button
                type="button"
                onClick={handleUpdate}
                disabled={updating}
                className={cn(
                  "mt-3 inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5",
                  "text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  "disabled:cursor-not-allowed disabled:opacity-70"
                )}
              >
                {updating
                  ? t("updateAvailable.refreshing")
                  : t("updateAvailable.refresh")}
              </button>
            </div>

            <Dialog.Close
              disabled={updating}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40"
              aria-label={t("updateAvailable.close")}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
