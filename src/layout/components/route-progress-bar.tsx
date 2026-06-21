import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { gsap } from "gsap"
import { useLocation } from "react-router"

import { subscribeRouteTransitionComplete } from "@/layout/route-transition"

const MIN_VISIBLE_MS = 260
const FALLBACK_COMPLETE_MS = 1400

export function RouteProgressBar() {
  const location = useLocation()
  const barRef = useRef<HTMLDivElement>(null)
  const fallbackTimerRef = useRef<number | null>(null)
  const finishTimerRef = useRef<number | null>(null)
  const mountedRef = useRef(false)
  const progressActiveRef = useRef(false)
  const routeKeyRef = useRef("")
  const startedAtRef = useRef(0)
  const routeKey = useMemo(
    () => `${location.pathname}${location.search}`,
    [location.pathname, location.search]
  )

  const clearTimers = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current)
      finishTimerRef.current = null
    }
  }, [])

  const finishProgress = useCallback((finishedRouteKey: string) => {
    const bar = barRef.current

    if (
      !bar ||
      !progressActiveRef.current ||
      finishedRouteKey !== routeKeyRef.current
    ) {
      return
    }

    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    const elapsed = performance.now() - startedAtRef.current
    const wait = Math.max(MIN_VISIBLE_MS - elapsed, 0)

    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current)
    }

    finishTimerRef.current = window.setTimeout(() => {
      finishTimerRef.current = null
      gsap.killTweensOf(bar)
      gsap
        .timeline({
          onComplete: () => {
            progressActiveRef.current = false
            gsap.set(bar, { autoAlpha: 0, scaleX: 0 })
          },
        })
        .to(bar, {
          duration: prefersReducedMotion() ? 0.08 : 0.16,
          ease: "power2.out",
          scaleX: 1,
        })
        .to(bar, {
          autoAlpha: 0,
          duration: prefersReducedMotion() ? 0.06 : 0.18,
          ease: "power1.out",
        })
    }, wait)
  }, [])

  useEffect(
    () => subscribeRouteTransitionComplete(finishProgress),
    [finishProgress]
  )

  useLayoutEffect(() => {
    const bar = barRef.current

    if (!bar) {
      return
    }

    if (!mountedRef.current) {
      mountedRef.current = true
      routeKeyRef.current = routeKey
      gsap.set(bar, { autoAlpha: 0, scaleX: 0 })
      return
    }

    routeKeyRef.current = routeKey
    startedAtRef.current = performance.now()
    progressActiveRef.current = true
    clearTimers()
    gsap.killTweensOf(bar)
    gsap.set(bar, { autoAlpha: 1, scaleX: 0 })

    if (prefersReducedMotion()) {
      gsap.to(bar, { duration: 0.08, ease: "none", scaleX: 0.72 })
    } else {
      gsap
        .timeline()
        .to(bar, { duration: 0.12, ease: "power2.out", scaleX: 0.34 })
        .to(bar, { duration: 0.24, ease: "power2.out", scaleX: 0.74 })
        .to(bar, { duration: 0.72, ease: "power1.out", scaleX: 0.9 })
    }

    fallbackTimerRef.current = window.setTimeout(
      () => finishProgress(routeKey),
      FALLBACK_COMPLETE_MS
    )
  }, [clearTimers, finishProgress, routeKey])

  useEffect(() => clearTimers, [clearTimers])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-primary opacity-0"
      />
    </div>
  )
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
