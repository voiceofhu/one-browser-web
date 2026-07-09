"use client"

import * as React from "react"
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react"

import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import { cn } from "@/lib/utils"

import { useTheme } from "./provider"
import {
  type Theme,
  type ThemeName,
  applyThemeToRoot,
  getDomTheme,
  getSystemTheme,
} from "./shared"

type ThemePointer = { x: number; y: number }

type ViewTransition = {
  ready: Promise<void>
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => ViewTransition
}

const themeModes = [
  { value: "system", labelKey: "theme.system", Icon: LaptopIcon },
  { value: "light", labelKey: "theme.light", Icon: SunIcon },
  { value: "dark", labelKey: "theme.dark", Icon: MoonIcon },
] as const satisfies ReadonlyArray<{
  value: Theme
  labelKey: "theme.system" | "theme.light" | "theme.dark"
  Icon: typeof LaptopIcon
}>

const THEME_TOGGLE_VIEW_TRANSITION_CSS = `
  @supports (view-transition-name: none) {
    :root {
      view-transition-name: root;
    }

    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none;
      mix-blend-mode: normal;
    }

    ::view-transition-old(root) {
      z-index: 1;
    }

    ::view-transition-new(root) {
      z-index: 9999;
    }

    [data-theme-switching='dark']::view-transition-old(root) {
      z-index: 9999;
    }

    [data-theme-switching='dark']::view-transition-new(root) {
      z-index: 1;
    }
  }
`

function isTheme(value: string | undefined): value is Theme {
  return value === "system" || value === "light" || value === "dark"
}

function resolveThemeMode(theme: Theme): ThemeName {
  return theme === "system" ? getSystemTheme() : theme
}

function ThemeToggleViewTransitionStyles() {
  return <style>{THEME_TOGGLE_VIEW_TRANSITION_CSS}</style>
}

export function ThemeModeToggle({
  className,
  label,
  labels,
}: {
  className?: string
  label?: string
  labels: Record<(typeof themeModes)[number]["labelKey"], string>
}) {
  const { theme, setTheme } = useTheme()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const pointerRef = React.useRef<ThemePointer | null>(null)
  const transitionFrameRef = React.useRef<number | null>(null)
  const options = React.useMemo(
    () =>
      themeModes.map((mode) => {
        const label = labels[mode.labelKey]

        return {
          value: mode.value,
          tooltip: label,
          label: (
            <>
              <mode.Icon aria-hidden="true" strokeWidth={2} />
              <span className="sr-only">{label}</span>
            </>
          ),
        }
      }),
    [labels]
  )

  React.useEffect(() => {
    return () => {
      if (transitionFrameRef.current !== null) {
        window.cancelAnimationFrame(transitionFrameRef.current)
      }
    }
  }, [])

  function updateTheme(nextMode: Theme, nextResolvedTheme: ThemeName) {
    applyThemeToRoot(nextResolvedTheme)
    setTheme(nextMode)
  }

  function getTransitionOrigin(): ThemePointer {
    const pointer = pointerRef.current

    if (pointer) {
      return pointer
    }

    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) {
      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }
    }

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }

  function startThemeTransition(nextTheme: Theme, origin: ThemePointer) {
    const nextResolvedTheme = resolveThemeMode(nextTheme)
    if (getDomTheme() === nextResolvedTheme) {
      updateTheme(nextTheme, nextResolvedTheme)
      return
    }

    const transitionDocument = document as DocumentWithViewTransition
    const supportsTransition =
      typeof transitionDocument.startViewTransition === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!supportsTransition) {
      updateTheme(nextTheme, nextResolvedTheme)
      return
    }

    const { x, y } = origin
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    if (nextResolvedTheme === "dark") {
      document.documentElement.dataset.themeSwitching = "dark"
    } else {
      delete document.documentElement.dataset.themeSwitching
    }

    const transition = transitionDocument.startViewTransition(() => {
      updateTheme(nextTheme, nextResolvedTheme)
    })

    void transition.ready
      .then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ]

        document.documentElement.animate(
          {
            clipPath:
              nextResolvedTheme === "dark" ? [...clipPath].reverse() : clipPath,
          },
          {
            duration: 500,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "forwards",
            pseudoElement:
              nextResolvedTheme === "dark"
                ? "::view-transition-old(root)"
                : "::view-transition-new(root)",
          }
        )
      })
      .catch(() => {
        delete document.documentElement.dataset.themeSwitching
      })

    void Promise.all([
      transition.ready,
      new Promise<void>((resolve) => setTimeout(resolve, 550)),
    ])
      .catch(() => undefined)
      .then(() => {
        delete document.documentElement.dataset.themeSwitching
      })
  }

  function handleThemeChange(nextTheme: Theme) {
    if (nextTheme === theme) {
      return
    }

    const origin = getTransitionOrigin()

    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current)
    }

    transitionFrameRef.current = window.requestAnimationFrame(() => {
      transitionFrameRef.current = window.requestAnimationFrame(() => {
        transitionFrameRef.current = null
        startThemeTransition(nextTheme, origin)
      })
    })
  }

  return (
    <div
      ref={rootRef}
      className={cn("inline-flex shrink-0", className)}
      onPointerDownCapture={(event) => {
        pointerRef.current = { x: event.clientX, y: event.clientY }
      }}
    >
      <ThemeToggleViewTransitionStyles />
      <AnimatedSegmentedTabs
        label={label ?? labels["theme.system"]}
        options={options}
        value={theme}
        onValueChange={(nextTheme) => {
          if (isTheme(nextTheme)) {
            handleThemeChange(nextTheme)
          }
        }}
        listClassName="h-6 rounded-md p-0.5"
        triggerClassName="min-w-6 px-1.5"
      />
    </div>
  )
}
