import { useLayoutEffect, useRef, type ReactNode } from "react"
import { gsap } from "gsap"

import { notifyRouteTransitionComplete } from "@/layout/route-transition"

interface PageTransitionProps {
  children: ReactNode
  routeKey: string
  transitionKey: string
}

export function PageTransition({
  children,
  routeKey,
  transitionKey,
}: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = containerRef.current

    if (!container) {
      notifyRouteTransitionComplete(routeKey)
      return
    }

    if (prefersReducedMotion()) {
      gsap.set(container, { autoAlpha: 1, y: 0, clearProps: "all" })
      notifyRouteTransitionComplete(routeKey)
      return
    }

    const ctx = gsap.context(() => {
      gsap.killTweensOf(container)
      gsap.fromTo(
        container,
        {
          autoAlpha: 0,
          filter: "blur(1.5px)",
          y: 8,
        },
        {
          autoAlpha: 1,
          clearProps: "filter,transform,opacity,visibility",
          duration: 0.24,
          ease: "power2.out",
          filter: "blur(0px)",
          onComplete: () => notifyRouteTransitionComplete(routeKey),
          y: 0,
        }
      )
    }, container)

    return () => ctx.revert()
  }, [routeKey, transitionKey])

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto will-change-transform"
    >
      {children}
    </div>
  )
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
