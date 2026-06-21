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
        className={cn("max-h-[90svh] overflow-hidden p-4", className)}
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
    <DrawerHeader className={cn("p-0 text-left", className)} {...props} />
  ) : (
    <DialogHeader className={className} {...props} />
  )
}

function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  const mode = useResponsiveDialogMode()

  return mode === "drawer" ? (
    <DrawerFooter className={cn("p-0", className)} {...props} />
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
  ...props
}: React.ComponentProps<typeof DialogDescription> &
  React.ComponentProps<typeof DrawerDescription>) {
  const mode = useResponsiveDialogMode()

  return mode === "drawer" ? (
    <DrawerDescription {...props} />
  ) : (
    <DialogDescription {...props} />
  )
}

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}
