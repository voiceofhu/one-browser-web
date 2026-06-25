import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type InteractiveGridBackgroundProps = {
  className?: string
}

export function InteractiveGridBackground({
  className,
}: InteractiveGridBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const targetPointerRef = useRef({ x: 0, y: 0 })
  const isMobile = useMediaQuery("(max-width: 767px)")
  const isCoarsePointer = useMediaQuery("(pointer: coarse)")
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const shouldSimplify = isMobile || isCoarsePointer || prefersReducedMotion

  const syncPointer = useCallback((x: number, y: number) => {
    const node = rootRef.current

    if (!node) {
      return
    }

    node.style.setProperty("--mx", `${x.toFixed(2)}px`)
    node.style.setProperty("--my", `${y.toFixed(2)}px`)
  }, [])

  const schedulePointerSync = useCallback(() => {
    if (frameRef.current !== null) {
      return
    }

    frameRef.current = window.requestAnimationFrame(() => {
      const target = targetPointerRef.current

      frameRef.current = null
      syncPointer(target.x, target.y)
    })
  }, [syncPointer])

  const setPointerTarget = useCallback(
    (x: number, y: number, immediate = false) => {
      targetPointerRef.current = { x, y }

      if (immediate) {
        syncPointer(x, y)
        return
      }

      schedulePointerSync()
    },
    [schedulePointerSync, syncPointer]
  )

  const centerPointer = useCallback(
    (immediate = false) => {
      const anchorY = shouldSimplify
        ? window.innerHeight * 0.28
        : window.innerHeight / 2

      setPointerTarget(window.innerWidth / 2, anchorY, immediate)
    },
    [setPointerTarget, shouldSimplify]
  )

  const movePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (shouldSimplify) {
        return
      }

      setPointerTarget(clientX, clientY)
    },
    [setPointerTarget, shouldSimplify]
  )

  useEffect(() => {
    centerPointer(true)

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return
      }

      movePointer(event.clientX, event.clientY)
    }
    const handlePointerLeave = () => centerPointer()
    const handleResize = () => centerPointer(true)

    window.addEventListener("resize", handleResize)
    window.addEventListener("blur", handlePointerLeave)

    if (!shouldSimplify) {
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      })
    }

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      window.removeEventListener("resize", handleResize)
      window.removeEventListener("blur", handlePointerLeave)

      if (!shouldSimplify) {
        window.removeEventListener("pointermove", handlePointerMove)
      }
    }
  }, [centerPointer, movePointer, shouldSimplify])

  return (
    <div
      aria-hidden="true"
      className={cn(
        "interactive-grid-background pointer-events-none absolute inset-0 z-0 overflow-hidden",
        shouldSimplify && "is-simplified",
        className
      )}
      ref={rootRef}
    >
      <div className="interactive-grid-background__layer interactive-grid-background__layer--base" />
      <div className="interactive-grid-background__layer interactive-grid-background__layer--active" />
      <style>{`
        .interactive-grid-background {
          --mx: 50%;
          --my: 50%;
          --grid-size: 12px;
          --dot-size: 0.82px;
          --active-dot-size: 1.08px;
          --mask-size: clamp(160px, 18vw, 260px);
          --dot-base: color-mix(in oklch, var(--foreground) 7%, transparent);
          --dot-active: color-mix(in oklch, var(--primary) 48%, transparent);
          --base-opacity: 0.56;
          --active-opacity: 0.36;
          --mask-core-alpha: 72%;
          --mask-near-alpha: 58%;
          --mask-mid-alpha: 32%;
          --mask-edge-alpha: 10%;
          --mask-will-change: mask-image;
        }

        .interactive-grid-background.is-simplified {
          --grid-size: 14px;
          --dot-size: 0.72px;
          --active-dot-size: 0.88px;
          --mask-size: clamp(88px, 22vw, 140px);
          --dot-base: color-mix(in oklch, var(--foreground) 6%, transparent);
          --dot-active: color-mix(in oklch, var(--primary) 34%, transparent);
          --base-opacity: 0.42;
          --active-opacity: 0.22;
          --mask-will-change: auto;
        }

        .dark .interactive-grid-background {
          --dot-size: 0.94px;
          --active-dot-size: 1.5px;
          --mask-size: clamp(220px, 26vw, 380px);
          --dot-base: color-mix(in oklch, var(--foreground) 18%, transparent);
          --dot-active: color-mix(
            in oklch,
            var(--primary) 72%,
            var(--foreground) 28%
          );
          --base-opacity: 0.74;
          --active-opacity: 0.88;
          --mask-core-alpha: 100%;
          --mask-near-alpha: 86%;
          --mask-mid-alpha: 56%;
          --mask-edge-alpha: 22%;
        }

        .dark .interactive-grid-background.is-simplified {
          --dot-size: 0.82px;
          --active-dot-size: 1.12px;
          --mask-size: clamp(120px, 28vw, 180px);
          --dot-base: color-mix(in oklch, var(--foreground) 14%, transparent);
          --dot-active: color-mix(
            in oklch,
            var(--primary) 66%,
            var(--foreground) 34%
          );
          --base-opacity: 0.58;
          --active-opacity: 0.58;
          --mask-core-alpha: 92%;
          --mask-near-alpha: 72%;
          --mask-mid-alpha: 42%;
          --mask-edge-alpha: 16%;
        }

        .interactive-grid-background__layer {
          position: absolute;
          inset: 0;
        }

        .interactive-grid-background__layer--base,
        .interactive-grid-background__layer--active {
          background-position: calc(var(--grid-size) / 2)
            calc(var(--grid-size) / 2);
          background-size: var(--grid-size) var(--grid-size);
          will-change: var(--mask-will-change);
        }

        .interactive-grid-background__layer--base {
          background-image: radial-gradient(
            circle,
            var(--dot-base) 0 var(--dot-size),
            transparent calc(var(--dot-size) + 0.2px)
          );
          opacity: var(--base-opacity);
        }

        .interactive-grid-background__layer--active {
          background-image: radial-gradient(
            circle,
            var(--dot-active) 0 var(--active-dot-size),
            transparent calc(var(--active-dot-size) + 0.2px)
          );
          opacity: var(--active-opacity);
          -webkit-mask-image: radial-gradient(
            circle var(--mask-size) at var(--mx) var(--my),
            rgb(0 0 0 / var(--mask-core-alpha)) 0%,
            rgb(0 0 0 / var(--mask-near-alpha)) 24%,
            rgb(0 0 0 / var(--mask-mid-alpha)) 46%,
            rgb(0 0 0 / var(--mask-edge-alpha)) 64%,
            transparent 100%
          );
          mask-image: radial-gradient(
            circle var(--mask-size) at var(--mx) var(--my),
            rgb(0 0 0 / var(--mask-core-alpha)) 0%,
            rgb(0 0 0 / var(--mask-near-alpha)) 24%,
            rgb(0 0 0 / var(--mask-mid-alpha)) 46%,
            rgb(0 0 0 / var(--mask-edge-alpha)) 64%,
            transparent 100%
          );
        }
      `}</style>
    </div>
  )
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    const updateMatches = () => setMatches(media.matches)

    updateMatches()
    media.addEventListener("change", updateMatches)

    return () => {
      media.removeEventListener("change", updateMatches)
    }
  }, [query])

  return matches
}
