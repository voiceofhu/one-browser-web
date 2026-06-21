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

  if (mode === "drawer") {
    return (
      <DrawerContent
        className={cn("h-[90svh] max-h-[90svh] overflow-hidden p-0", className)}
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
              aria-label="关闭"
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
      className={className}
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
        "shrink-0 border-b px-4 py-2 pr-12 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left group-data-[vaul-drawer-direction=top]/drawer-content:text-left",
        className
      )}
      {...props}
    />
  ) : (
    <DialogHeader className={className} {...props} />
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
        mode === "drawer" ? "min-h-0 flex-1 overflow-y-auto p-4" : "min-h-0",
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
        "sticky bottom-0 mt-auto grid shrink-0 grid-cols-5 gap-2 border-t bg-popover p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
        "[&>*]:w-full [&>*:first-child]:order-2 [&>*:first-child]:col-span-2 [&>*:last-child]:order-1 [&>*:last-child]:col-span-3",
        className
      )}
      {...props}
    />
  ) : (
    <DialogFooter className={className} {...props} />
  )
}

function ResponsiveDialogTitle({
  ...props
}: React.ComponentProps<typeof DialogTitle> &
  React.ComponentProps<typeof DrawerTitle>) {
  const mode = useResponsiveDialogMode()

  return mode === "drawer" ? (
    <DrawerTitle {...props} />
  ) : (
    <DialogTitle {...props} />
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
    <DialogDescription className={className} {...props} />
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
