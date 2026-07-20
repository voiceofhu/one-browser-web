"use client"

import { Dialog } from "@base-ui/react/dialog"
import { RefreshCw, X } from "lucide-react"
import * as React from "react"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
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
          initialFocus={false}
          finalFocus={false}
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50",
            "origin-bottom rounded-xl border border-border/70 bg-popover p-3.5 text-popover-foreground",
            "shadow-xl shadow-foreground/10 outline-none sm:right-5 sm:bottom-5 sm:left-auto sm:w-[25rem] sm:origin-bottom-right",
            "transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
            "data-[starting-style]:translate-y-2 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0",
            "data-[ending-style]:translate-y-2 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0"
          )}
        >
          <div className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-start gap-x-2.5 sm:grid-cols-[2rem_minmax(0,1fr)_auto_2rem]">
            <div
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 ring-inset"
              aria-hidden="true"
            >
              <RefreshCw
                className={cn(
                  "size-4",
                  updating && "animate-spin motion-reduce:animate-none"
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-sm/5 font-semibold tracking-tight">
                {t("updateAvailable.title")}
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs/5 text-muted-foreground">
                {t("updateAvailable.description")}
              </Dialog.Description>
            </div>

            <Button
              type="button"
              onClick={handleUpdate}
              disabled={updating}
              aria-busy={updating || undefined}
              className="col-start-2 col-end-4 mt-2.5 w-full sm:col-start-3 sm:col-end-4 sm:row-start-1 sm:mt-0 sm:w-auto sm:self-center"
            >
              {updating
                ? t("updateAvailable.refreshing")
                : t("updateAvailable.refresh")}
            </Button>

            <Dialog.Close
              render={<Button type="button" variant="ghost" size="icon-sm" />}
              disabled={updating}
              className="col-start-3 row-start-1 -mt-0.5 -mr-0.5 self-start text-muted-foreground sm:col-start-4"
              aria-label={t("updateAvailable.close")}
            >
              <X aria-hidden="true" />
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
