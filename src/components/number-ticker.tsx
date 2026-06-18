import { useLayoutEffect, useRef } from "react"
import { gsap } from "gsap"

type NumberTickerProps = {
  value: number
  formatValue?: (value: number) => string
  duration?: number
  snap?: number
  className?: string
}

const defaultFormat = (value: number) => value.toFixed(0)

export function NumberTicker({
  value,
  formatValue = defaultFormat,
  duration = 0.8,
  snap = 0.1,
  className,
}: NumberTickerProps) {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const previousValueRef = useRef(Number.isFinite(value) ? value : 0)

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) {
      return
    }

    const nextValue = Number.isFinite(value) ? value : 0
    const startValue = previousValueRef.current

    if (startValue === nextValue) {
      node.textContent = formatValue(nextValue)
      previousValueRef.current = nextValue
      return
    }

    const counter = { value: startValue }
    node.textContent = formatValue(startValue)
    const tween = gsap.to(counter, {
      value: nextValue,
      duration,
      ease: "none",
      snap: { value: snap },
      onUpdate: () => {
        node.textContent = formatValue(counter.value)
      },
      onComplete: () => {
        node.textContent = formatValue(nextValue)
      },
    })

    previousValueRef.current = nextValue

    return () => {
      tween.kill()
    }
  }, [duration, formatValue, snap, value])

  return (
    <span ref={nodeRef} className={className}>
      {formatValue(Number.isFinite(value) ? value : 0)}
    </span>
  )
}
