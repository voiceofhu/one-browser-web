"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useTranslation } from "@/components/providers/language-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

type ResponsiveDialogMode = "dialog" | "drawer"

const ResponsiveDialogContext =
  React.createContext<ResponsiveDialogMode>("dialog")

function useResponsiveDialogMode() {
  return React.useContext(ResponsiveDialogContext)
}

function ResponsiveDialog({
  children,
  ...props
}: React.ComponentProps<typeof Dialog> & React.ComponentProps<typeof Drawer>) {
  const isMobile = useIsMobile()
  const mode: ResponsiveDialogMode = isMobile ? "drawer" : "dialog"
  const Root = isMobile ? Drawer : Dialog

  return (
    <ResponsiveDialogContext.Provider value={mode}>
      <Root {...props}>{children}</Root>
    </ResponsiveDialogContext.Provider>
  )
}

function ResponsiveDialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogTrigger> &
  React.ComponentProps<typeof DrawerTrigger>) {
  const mode = useResponsiveDialogMode()

  return mode === "drawer" ? (
    <DrawerTrigger {...props} />
  ) : (
    <DialogTrigger {...props} />
  )
}

function ResponsiveDialogClose({
  ...props
}: React.ComponentProps<typeof DialogClose> &
  React.ComponentProps<typeof DrawerClose>) {
  const mode = useResponsiveDialogMode()

  return mode === "drawer" ? (
    <DrawerClose {...props} />
  ) : (
    <DialogClose {...props} />
  )
}

function ResponsiveDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogContent> & {
  showCloseButton?: boolean
}) {
  const mode = useResponsiveDialogMode()
  const { t } = useTranslation()

  if (mode === "drawer") {
    return (
      <DrawerContent
        className={cn(
          "max-h-[90svh] overflow-hidden p-0 data-[vaul-drawer-direction=bottom]:max-h-[90svh]",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-2"
              aria-label={t("common.close")}
            >
              <XIcon />
            </Button>
          </DrawerClose>
        ) : null}
      </DrawerContent>
    )
  }

  return (
    <DialogContent
      className={cn("gap-0 overflow-hidden p-0", className)}
      showCloseButton={showCloseButton}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  const mode = useResponsiveDialogMode()

  return mode === "drawer" ? (
    <DrawerHeader
      className={cn(
        "shrink-0 gap-0.5 bg-muted/50 px-4 py-2 pr-12 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left group-data-[vaul-drawer-direction=top]/drawer-content:text-left",
        className,
        "border-b-0"
      )}
      {...props}
    />
  ) : (
    <DialogHeader
      className={cn(
        "shrink-0 gap-0.5 bg-muted/50 px-4 py-2 pr-12 text-left",
        className,
        "border-b-0"
      )}
      {...props}
    />
  )
}

function ResponsiveDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const mode = useResponsiveDialogMode()

  return (
    <div
      data-slot="responsive-dialog-body"
      className={cn(
        mode === "drawer"
          ? "min-h-0 flex-1 overflow-y-auto p-4"
          : "min-h-0 p-4",
        className
      )}
      {...props}
    />
  )
}

function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  const mode = useResponsiveDialogMode()

  return mode === "drawer" ? (
    <DrawerFooter
      className={cn(
        "sticky bottom-0 mt-auto grid shrink-0 grid-cols-5 gap-2 bg-muted/50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        "[&>*]:w-full [&>*:first-child]:order-2 [&>*:first-child]:col-span-2 [&>*:last-child]:order-1 [&>*:last-child]:col-span-3",
        className,
        "border-t-0"
      )}
      {...props}
    />
  ) : (
    <DialogFooter
      className={cn(
        "mx-0 mb-0 shrink-0 rounded-b-xl bg-muted/50 px-4 py-2",
        className,
        "border-t-0"
      )}
      {...props}
    />
  )
}

function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle> &
  React.ComponentProps<typeof DrawerTitle>) {
  const mode = useResponsiveDialogMode()

  return mode === "drawer" ? (
    <DrawerTitle className={cn("text-sm font-medium", className)} {...props} />
  ) : (
    <DialogTitle className={cn("text-sm font-medium", className)} {...props} />
  )
}

function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription> &
  React.ComponentProps<typeof DrawerDescription>) {
  const mode = useResponsiveDialogMode()

  return mode === "drawer" ? (
    <DrawerDescription className={cn("sr-only", className)} {...props} />
  ) : (
    <DialogDescription
      className={cn("text-xs/relaxed", className)}
      {...props}
    />
  )
}

export {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}
