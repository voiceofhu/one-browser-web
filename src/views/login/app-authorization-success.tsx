import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { gsap } from "gsap"

import { APP_NAME } from "@/app"
import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { wakeAppRedirect } from "@/lib/app-redirect"
import { cn } from "@/lib/utils"

const APP_RETURN_DELAY_SECONDS = 1

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
        "flex min-h-svh items-center justify-center bg-muted/40 p-4",
        className
      )}
    >
      <AuthPanel className="max-w-[21rem]">
        <div className="flex flex-col items-center px-5 py-6 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Spinner className="size-5" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-semibold tracking-normal">
              {t("appAuth.pendingTitle")}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("appAuth.pendingDescription", { appName: APP_NAME })}
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {t("appAuth.pendingHint")}
          </p>
        </div>
      </AuthPanel>
    </main>
  )
}

export function AppAuthorizationSuccess({
  appUrl,
  className,
}: AppAuthorizationSuccessProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLElement>(null)
  const [countdown, setCountdown] = useState(APP_RETURN_DELAY_SECONDS)
  const scopes = [
    t("appAuth.scopeProfile"),
    t("appAuth.scopeEmail"),
    t("appAuth.scopeAccess"),
  ]

  useAppAuthorizationReveal(rootRef)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      wakeAppRedirect(appUrl)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [appUrl])

  useEffect(() => {
    if (countdown <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setCountdown((seconds) => seconds - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [countdown])

  return (
    <main
      ref={rootRef}
      className={cn(
        "flex min-h-svh items-center justify-center bg-muted/40 p-4",
        className
      )}
    >
      <div className="w-full max-w-sm">
        <AuthPanel>
          <div className="px-5 py-6">
            <div className="relative mx-auto mb-4 flex size-16 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20"
              />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-500/15 dark:bg-emerald-500">
                <CheckIcon className="size-8" aria-hidden="true" />
              </span>
            </div>

            <div className="text-center">
              <h1 className="text-lg font-semibold text-balance text-foreground">
                {t("appAuth.successTitle")}
              </h1>
              <p className="mx-auto mt-1.5 max-w-[16rem] text-xs leading-relaxed text-pretty text-muted-foreground">
                {t("appAuth.successDescription", { appName: APP_NAME })}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
              <p className="mb-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {t("appAuth.scopeTitle", { appName: APP_NAME })}
              </p>
              <ul className="flex flex-col gap-1.5">
                {scopes.map((scope) => (
                  <li
                    key={scope}
                    className="flex items-start gap-2 text-xs text-foreground"
                  >
                    <CheckIcon
                      className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{scope}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                className="w-full"
                onClick={() => wakeAppRedirect(appUrl)}
              >
                {t("appAuth.returnToApp", { appName: APP_NAME })}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={closeAuthorizationPage}
              >
                {t("appAuth.closeNow")}
              </Button>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <ClockIcon className="size-3" aria-hidden="true" />
              <span>
                {countdown > 0
                  ? t("appAuth.closeCountdown", {
                      appName: APP_NAME,
                      seconds: countdown,
                    })
                  : t("appAuth.returningStatus", { appName: APP_NAME })}
              </span>
            </p>
          </div>
        </AuthPanel>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          {t("appAuth.closeFallback")}
        </p>
      </div>
    </main>
  )
}

function AuthPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
      data-app-auth-reveal
    >
      <div className="flex items-center justify-center gap-2 border-b border-border px-5 py-3">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheckIcon className="size-3.5" aria-hidden="true" />
        </div>
        <span className="text-xs font-medium text-foreground">
          {t("appAuth.accountCenter", { appName: APP_NAME })}
        </span>
      </div>

      {children}
    </div>
  )
}

function closeAuthorizationPage() {
  window.close()
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
