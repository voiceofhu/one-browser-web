import { useEffect, useRef, useState } from "react"
import { CheckCircle2Icon, ExternalLinkIcon, XIcon } from "lucide-react"
import { gsap } from "gsap"

import { APP_NAME } from "@/app"
import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  APP_AUTH_CLOSE_DELAY_SECONDS,
  closeCurrentWindow,
  wakeAppRedirect,
} from "@/lib/app-redirect"
import { cn } from "@/lib/utils"
import { InteractiveGridBackground } from "./interactive-grid-background"

type AppAuthorizationSuccessProps = {
  appUrl: string
  className?: string
}

export function AppAuthorizationSuccess({
  appUrl,
  className,
}: AppAuthorizationSuccessProps) {
  const { t } = useTranslation()
  const [secondsLeft, setSecondsLeft] = useState(APP_AUTH_CLOSE_DELAY_SECONDS)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const cleanupWake = wakeAppRedirect(appUrl)
    const closeTimer = window.setTimeout(() => {
      setSecondsLeft(0)
      closeCurrentWindow()
    }, APP_AUTH_CLOSE_DELAY_SECONDS * 1000)
    const countdownTimer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(value - 1, 0))
    }, 1000)

    return () => {
      cleanupWake()
      window.clearTimeout(closeTimer)
      window.clearInterval(countdownTimer)
    }
  }, [appUrl])

  useEffect(() => {
    if (!rootRef.current || shouldReduceMotion()) {
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-app-auth-reveal]",
        { autoAlpha: 0, scale: 0.985, y: 16 },
        {
          autoAlpha: 1,
          clearProps: "opacity,transform,visibility",
          duration: 0.42,
          ease: "power3.out",
          scale: 1,
          stagger: 0.06,
          y: 0,
        }
      )
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <main
      ref={rootRef}
      className={cn(
        "relative flex min-h-svh flex-col overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8",
        className
      )}
    >
      <InteractiveGridBackground />

      <section className="relative z-10 grid flex-1 place-items-center py-8 sm:py-10 lg:py-12">
        <Card
          className="w-full max-w-md shadow-lg shadow-foreground/5"
          data-app-auth-reveal
        >
          <CardHeader className="items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2Icon />
            </div>
            <CardTitle className="text-2xl font-semibold">
              {t("appAuth.successTitle")}
            </CardTitle>
            <CardDescription>
              {t("appAuth.successDescription", { appName: APP_NAME })}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t("appAuth.openingHint", { appName: APP_NAME })}
            </p>
            <div className="flex flex-col gap-2" aria-live="polite">
              <p className="text-sm font-medium tabular-nums">
                {t("appAuth.closeCountdown", {
                  seconds: Math.max(secondsLeft, 1),
                })}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("appAuth.closeFallback")}
            </p>
          </CardContent>

          <CardFooter className="grid grid-cols-1 gap-2 border-t bg-muted/30 sm:grid-cols-2">
            <Button
              type="button"
              onClick={() =>
                wakeAppRedirect(appUrl, {
                  preservePage: false,
                })
              }
            >
              <ExternalLinkIcon data-icon="inline-start" />
              {t("appAuth.openApp")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeCurrentWindow}
            >
              <XIcon data-icon="inline-start" />
              {t("appAuth.closeNow")}
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

function shouldReduceMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}
