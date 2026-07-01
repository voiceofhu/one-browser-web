import * as React from "react"

import {
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type DialogActionKind = "confirm" | "cancel"
type DialogActionTone = DialogActionKind | "destructive"
type DialogShortcutKind = DialogActionKind | "none"

type DialogActionButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  action?: DialogActionKind
  children: React.ReactNode
  loading?: boolean
  loadingText?: React.ReactNode
  shortcut?: DialogShortcutKind
}

type AlertDialogActionButtonProps = Omit<
  React.ComponentProps<typeof AlertDialogAction>,
  "children"
> & {
  children: React.ReactNode
  loading?: boolean
  loadingText?: React.ReactNode
  shortcut?: DialogShortcutKind
}

type AlertDialogCancelButtonProps = Omit<
  React.ComponentProps<typeof AlertDialogCancel>,
  "children"
> & {
  children?: React.ReactNode
  shortcut?: DialogShortcutKind
}

function DialogActionButton({
  action = "confirm",
  children,
  disabled,
  loading,
  loadingText,
  shortcut = action,
  variant,
  ...props
}: DialogActionButtonProps) {
  const tone = resolveShortcutTone(action, variant)

  return (
    <Button
      variant={variant ?? (action === "cancel" ? "outline" : "default")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <DialogActionButtonContent
        loading={loading}
        loadingText={loadingText}
        shortcut={shortcut}
        tone={tone}
      >
        {children}
      </DialogActionButtonContent>
    </Button>
  )
}

function AlertDialogActionButton({
  children,
  disabled,
  loading,
  loadingText,
  shortcut = "confirm",
  variant,
  ...props
}: AlertDialogActionButtonProps) {
  return (
    <AlertDialogAction
      variant={variant}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <DialogActionButtonContent
        loading={loading}
        loadingText={loadingText}
        shortcut={shortcut}
        tone={resolveShortcutTone("confirm", variant)}
      >
        {children}
      </DialogActionButtonContent>
    </AlertDialogAction>
  )
}

function AlertDialogCancelButton({
  children = "取消",
  shortcut = "cancel",
  ...props
}: AlertDialogCancelButtonProps) {
  return (
    <AlertDialogCancel {...props}>
      <DialogActionButtonContent shortcut={shortcut} tone="cancel">
        {children}
      </DialogActionButtonContent>
    </AlertDialogCancel>
  )
}

function DialogActionButtonContent({
  children,
  loading,
  loadingText,
  shortcut,
  tone,
}: {
  children: React.ReactNode
  loading?: boolean
  loadingText?: React.ReactNode
  shortcut: DialogShortcutKind
  tone: DialogActionTone
}) {
  return (
    <>
      {loading ? <Spinner data-icon="inline-start" /> : null}
      {loading && loadingText ? loadingText : children}
      <DialogShortcutHint shortcut={shortcut} tone={tone} />
    </>
  )
}

function DialogShortcutHint({
  shortcut,
  tone,
}: {
  shortcut: DialogShortcutKind
  tone: DialogActionTone
}) {
  const keys = getShortcutKeys(shortcut)

  if (keys.length === 0) {
    return null
  }

  return (
    <KbdGroup className="ml-1">
      {keys.map((key) => (
        <Kbd
          key={key}
          className={cn("h-5 min-w-5 px-1 text-[0.65rem]", getKbdTone(tone))}
        >
          {key}
        </Kbd>
      ))}
    </KbdGroup>
  )
}

function resolveShortcutTone(
  action: DialogActionKind,
  variant?: React.ComponentProps<typeof Button>["variant"]
): DialogActionTone {
  if (variant === "destructive") {
    return "destructive"
  }

  return action
}

function getKbdTone(tone: DialogActionTone) {
  if (tone === "destructive") {
    return "bg-destructive/15 text-destructive"
  }

  if (tone === "confirm") {
    return "bg-primary-foreground/20 text-primary-foreground"
  }

  return "bg-muted-foreground/15 text-foreground"
}

function getShortcutKeys(shortcut: DialogShortcutKind) {
  if (shortcut === "confirm") {
    return ["⌘", "↵"]
  }

  if (shortcut === "cancel") {
    return ["Esc"]
  }

  return []
}

export {
  AlertDialogActionButton,
  AlertDialogCancelButton,
  DialogActionButton,
  DialogShortcutHint,
}
