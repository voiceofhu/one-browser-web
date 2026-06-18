import { useLayoutEffect, useRef } from "react"
import { gsap } from "gsap"
import type { LucideIcon } from "lucide-react"

import { NumberTicker } from "@/components/number-ticker"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { clampPercent } from "../lib/format"

const monitorCardClass = "bg-muted/35 py-0 shadow-none ring-0"

export type QuickStatCardProps = {
  icon: LucideIcon
  label: string
  value?: number | null
  hint: string
  percent?: number | null
  formatValue: (value: number) => string
}

export function QuickStatCard({
  icon: Icon,
  label,
  value,
  hint,
  percent,
  formatValue,
}: QuickStatCardProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const clampedPercent = clampPercent(percent ?? 0)
  const hasValue = typeof value === "number" && Number.isFinite(value)

  useLayoutEffect(() => {
    const node = barRef.current
    if (!node) {
      return
    }

    const tween = gsap.to(node, {
      width: `${clampedPercent}%`,
      duration: 0.6,
      ease: "power2.out",
      overwrite: "auto",
    })

    return () => {
      tween.kill()
    }
  }, [clampedPercent])

  return (
    <Card className={cn("relative overflow-hidden", monitorCardClass)}>
      <div
        ref={barRef}
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-primary/18 via-primary/8 to-transparent"
      />
      <CardContent className="relative flex min-h-22 items-center gap-3 p-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 text-xl leading-none font-semibold">
            {hasValue ? (
              <NumberTicker value={value} formatValue={formatValue} />
            ) : (
              "暂无"
            )}
          </div>
          <div className="mt-1.5 truncate text-sm text-muted-foreground">
            {hint}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
