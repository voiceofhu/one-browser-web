"use client"

import * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type OverflowTooltipTextProps = React.HTMLAttributes<HTMLSpanElement> & {
  text: string
  tooltipClassName?: string
}

export function OverflowTooltipText({
  text,
  className,
  tooltipClassName,
  ...props
}: OverflowTooltipTextProps) {
  const textRef = React.useRef<HTMLSpanElement>(null)
  const [isOverflowing, setIsOverflowing] = React.useState(false)

  const measureOverflow = React.useCallback(() => {
    const element = textRef.current

    if (!element) {
      return
    }

    setIsOverflowing(element.scrollWidth > element.clientWidth + 1)
  }, [])

  React.useLayoutEffect(() => {
    const element = textRef.current

    if (!element) {
      return
    }

    measureOverflow()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measureOverflow)

      return () => window.removeEventListener("resize", measureOverflow)
    }

    const resizeObserver = new ResizeObserver(measureOverflow)
    resizeObserver.observe(element)

    if (element.parentElement) {
      resizeObserver.observe(element.parentElement)
    }

    return () => resizeObserver.disconnect()
  }, [measureOverflow, text])

  const content = (
    <span
      ref={textRef}
      className={cn("block max-w-full min-w-0 truncate", className)}
      {...props}
    >
      {text}
    </span>
  )

  if (!isOverflowing) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent
        className={cn(
          "max-w-md leading-relaxed break-all whitespace-normal",
          tooltipClassName
        )}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
