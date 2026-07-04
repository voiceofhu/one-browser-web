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
  ref,
  shortcut = action,
  variant,
  ...props
}: DialogActionButtonProps) {
  const tone = resolveShortcutTone(action, variant)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const composedRef = useComposedButtonRef(buttonRef, ref)

  useDialogActionShortcut({
    buttonRef,
    disabled: disabled || loading,
    shortcut,
  })

  return (
    <Button
      variant={variant ?? (action === "cancel" ? "outline" : "default")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-dialog-shortcut={shortcut === "none" ? undefined : shortcut}
      {...props}
      ref={composedRef}
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
  ref,
  shortcut = "confirm",
  variant,
  ...props
}: AlertDialogActionButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const composedRef = useComposedButtonRef(buttonRef, ref)

  useDialogActionShortcut({
    buttonRef,
    disabled: disabled || loading,
    shortcut,
  })

  return (
    <AlertDialogAction
      variant={variant}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-dialog-shortcut={shortcut === "none" ? undefined : shortcut}
      {...props}
      ref={composedRef}
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
  disabled,
  ref,
  ...props
}: AlertDialogCancelButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const composedRef = useComposedButtonRef(buttonRef, ref)

  useDialogActionShortcut({
    buttonRef,
    disabled,
    shortcut,
  })

  return (
    <AlertDialogCancel
      disabled={disabled}
      data-dialog-shortcut={shortcut === "none" ? undefined : shortcut}
      {...props}
      ref={composedRef}
    >
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

function useComposedButtonRef(
  buttonRef: React.MutableRefObject<HTMLButtonElement | null>,
  forwardedRef: React.Ref<HTMLButtonElement> | undefined
) {
  return React.useCallback(
    (node: HTMLButtonElement | null) => {
      buttonRef.current = node
      setRef(forwardedRef, node)
    },
    [buttonRef, forwardedRef]
  )
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) {
    return
  }

  if (typeof ref === "function") {
    ref(value)
    return
  }

  ref.current = value
}

function useDialogActionShortcut({
  buttonRef,
  disabled,
  shortcut,
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>
  disabled?: boolean
  shortcut: DialogShortcutKind
}) {
  React.useEffect(() => {
    if (shortcut === "none") {
      return
    }

    const activeShortcut: DialogActionKind = shortcut
    const ownerDocument = buttonRef.current?.ownerDocument ?? document
    const ownerWindow = ownerDocument.defaultView

    if (!ownerWindow) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      const button = buttonRef.current

      if (
        disabled ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        !button ||
        !matchesShortcut(event, activeShortcut) ||
        !isElementActionable(button)
      ) {
        return
      }

      const topLayer = getTopDialogLayer(ownerDocument)

      if (topLayer && !topLayer.contains(button)) {
        return
      }

      if (
        getActiveShortcutButton(ownerDocument, activeShortcut, topLayer) !==
        button
      ) {
        return
      }

      event.preventDefault()
      button.click()
    }

    ownerWindow.addEventListener("keydown", handleKeyDown)
    return () => ownerWindow.removeEventListener("keydown", handleKeyDown)
  }, [buttonRef, disabled, shortcut])
}

function matchesShortcut(event: KeyboardEvent, shortcut: DialogActionKind) {
  if (shortcut === "confirm") {
    return (event.metaKey || event.ctrlKey) && event.key === "Enter"
  }

  if (shortcut === "cancel") {
    return (
      event.key === "Escape" &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey
    )
  }

  return false
}

function getActiveShortcutButton(
  ownerDocument: Document,
  shortcut: DialogActionKind,
  topLayer: Element | null
) {
  const buttons = Array.from(
    ownerDocument.querySelectorAll<HTMLButtonElement>(
      `[data-dialog-shortcut="${shortcut}"]`
    )
  ).filter(isElementActionable)
  const scopedButtons = topLayer
    ? buttons.filter((button) => topLayer.contains(button))
    : buttons

  return scopedButtons.at(-1) ?? null
}

function getTopDialogLayer(ownerDocument: Document) {
  const layers = Array.from(
    ownerDocument.querySelectorAll<HTMLElement>(
      [
        "[data-slot='alert-dialog-content']",
        "[data-slot='dialog-content']",
        "[data-slot='drawer-content']",
      ].join(",")
    )
  ).filter(isElementVisible)

  return layers.at(-1) ?? null
}

function isElementActionable(element: HTMLButtonElement) {
  return (
    !element.disabled &&
    element.getAttribute("aria-disabled") !== "true" &&
    isElementVisible(element)
  )
}

function isElementVisible(element: Element) {
  if (!element.isConnected || element.getClientRects().length === 0) {
    return false
  }

  const style = element.ownerDocument.defaultView?.getComputedStyle(element)

  return style?.visibility !== "hidden" && style?.display !== "none"
}

export {
  AlertDialogActionButton,
  AlertDialogCancelButton,
  DialogActionButton,
  DialogShortcutHint,
}
