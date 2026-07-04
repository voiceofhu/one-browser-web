import { useEffect, useRef, type RefObject } from "react"
import { ExternalLinkIcon } from "lucide-react"
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
import { wakeAppRedirect } from "@/lib/app-redirect"
import { cn } from "@/lib/utils"
import { InteractiveGridBackground } from "./interactive-grid-background"

type AppAuthorizationSuccessProps = {
  appUrl: string
  className?: string
}

type AppAuthorizationPendingProps = {
  className?: string
}

export function AppAuthorizationPending({
  className,
}: AppAuthorizationPendingProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLElement>(null)

  useAppAuthorizationReveal(rootRef)

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
          className="w-full max-w-sm border-border/80 bg-card/95"
          data-app-auth-reveal
        >
          <CardHeader className="items-center gap-3 px-8 pt-8 text-center">
            <CardTitle className="text-2xl font-semibold tracking-normal">
              {t("appAuth.pendingTitle")}
            </CardTitle>
            <CardDescription className="text-sm leading-6">
              {t("appAuth.pendingDescription", { appName: APP_NAME })}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 text-center">
            <p className="text-xs leading-5 text-muted-foreground">
              {t("appAuth.pendingHint")}
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

export function AppAuthorizationSuccess({
  appUrl,
  className,
}: AppAuthorizationSuccessProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLElement>(null)

  useAppAuthorizationReveal(rootRef)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      wakeAppRedirect(appUrl)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [appUrl])

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
          className="w-full max-w-md border-border/80 bg-card/95"
          data-app-auth-reveal
        >
          <CardHeader className="items-center gap-2 px-8 pt-8 text-center">
            <CardTitle className="text-2xl font-semibold tracking-normal">
              {t("appAuth.successTitle")}
            </CardTitle>
            <CardDescription className="text-base leading-7">
              {t("appAuth.successDescription", { appName: APP_NAME })}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 px-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t("appAuth.openingHint", { appName: APP_NAME })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("appAuth.closeFallback")}
            </p>
          </CardContent>

          <CardFooter className="border-t bg-transparent">
            <Button
              type="button"
              className="w-full"
              onClick={() => wakeAppRedirect(appUrl)}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              {t("appAuth.openApp")}
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

function useAppAuthorizationReveal(rootRef: RefObject<HTMLElement | null>) {
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
  }, [rootRef])
}

function shouldReduceMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}
