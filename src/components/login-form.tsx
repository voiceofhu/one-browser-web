import { zodResolver } from "@hookform/resolvers/zod"
import {
  EyeIcon,
  EyeOffIcon,
  LockKeyholeIcon,
  LogInIcon,
  UserIcon,
} from "lucide-react"
import { gsap } from "gsap"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { APP_NAME } from "@/app"
import { useTranslation } from "@/components/providers/language-context"
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/turnstile-widget"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type LoginFormValues = {
  username: string
  password: string
  turnstile_token?: string
}

type LoginFormProps = Omit<React.ComponentProps<"div">, "onSubmit"> & {
  isSubmitting?: boolean
  notice?: string | null
  error?: unknown
  googleLoginEnabled?: boolean
  onGoogleLogin?: () => void
  turnstileSiteKey?: string
  onSubmit: (values: LoginFormValues) => Promise<void> | void
}

export function LoginForm({
  className,
  isSubmitting = false,
  notice,
  error,
  googleLoginEnabled = false,
  onGoogleLogin,
  turnstileSiteKey,
  onSubmit,
  ...props
}: LoginFormProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileError, setTurnstileError] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const passwordIconRef = useRef<HTMLSpanElement>(null)
  const passwordAnimationReadyRef = useRef(false)
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const turnstileEnabled = Boolean(turnstileSiteKey)
  const loginSchema = useMemo(
    () =>
      z.object({
        username: z.string().trim().min(1, t("login.usernameRequired")),
        password: z.string().min(1, t("login.passwordRequired")),
      }),
    [t]
  )
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const disabled = isSubmitting || form.formState.isSubmitting
  const missingTurnstileToken = turnstileEnabled && !turnstileToken
  const submitBusy = disabled
  const submitDisabled = disabled || missingTurnstileToken
  const displayError =
    error || (turnstileError ? new Error(turnstileError) : null)
  const handleTurnstileTokenChange = useCallback((token: string) => {
    setTurnstileToken(token)
    if (token) {
      setTurnstileError("")
    }
  }, [])
  const handleTurnstileError = useCallback(() => {
    const message = t("login.turnstileLoadFailed")
    setTurnstileError(message)
  }, [t])

  useEffect(() => {
    if (shouldReduceMotion() || !rootRef.current) {
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-login-reveal]",
        { autoAlpha: 0, scale: 0.985, y: 18 },
        {
          autoAlpha: 1,
          clearProps: "opacity,transform,visibility",
          duration: 0.52,
          ease: "power3.out",
          scale: 1,
          stagger: 0.055,
          y: 0,
        }
      )
    }, rootRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (shouldReduceMotion()) {
      return
    }

    const submitField = rootRef.current?.querySelector<HTMLElement>(
      "[data-login-submit]"
    )
    if (!submitField) {
      return
    }

    gsap.killTweensOf(submitField)
    gsap.fromTo(
      submitField,
      { autoAlpha: 0, scale: 0.985, y: 10 },
      {
        autoAlpha: 1,
        clearProps: "opacity,transform,visibility",
        duration: 0.26,
        ease: "power2.out",
        scale: 1,
        y: 0,
      }
    )
  }, [])

  useEffect(() => {
    if (!passwordAnimationReadyRef.current) {
      passwordAnimationReadyRef.current = true
      return
    }

    if (shouldReduceMotion()) {
      return
    }

    const icon = passwordIconRef.current
    if (!icon) {
      return
    }

    const passwordGroup = rootRef.current?.querySelector<HTMLElement>(
      "[data-password-group]"
    )

    gsap.killTweensOf(icon)
    gsap.fromTo(
      icon,
      {
        autoAlpha: 0.25,
        rotate: showPassword ? -28 : 28,
        scale: 0.72,
      },
      {
        autoAlpha: 1,
        clearProps: "opacity,transform,visibility",
        duration: 0.24,
        ease: "back.out(2.4)",
        rotate: 0,
        scale: 1,
      }
    )

    if (passwordGroup) {
      gsap.killTweensOf(passwordGroup)
      gsap.fromTo(
        passwordGroup,
        { scale: 0.992 },
        {
          clearProps: "transform",
          duration: 0.18,
          ease: "power2.out",
          scale: 1,
        }
      )
    }
  }, [showPassword])

  return (
    <div
      ref={rootRef}
      className={cn("mx-auto flex flex-col gap-5", className)}
      {...props}
    >
      <Card className="relative isolate overflow-hidden border border-white/50 bg-card/70 p-0 shadow-xl shadow-foreground/10 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[linear-gradient(135deg,rgb(255_255_255/0.44),rgb(255_255_255/0.12)_38%,rgb(255_255_255/0.03)_68%,transparent)] before:opacity-80 after:pointer-events-none after:absolute after:inset-px after:z-0 after:rounded-[calc(var(--radius-xl)-1px)] after:shadow-[inset_0_1px_0_rgb(255_255_255/0.56),inset_0_-1px_0_rgb(255_255_255/0.12)] supports-backdrop-filter:bg-card/55 dark:border-white/15 dark:bg-card/50 dark:shadow-black/30 dark:before:bg-[linear-gradient(135deg,rgb(255_255_255/0.18),rgb(255_255_255/0.06)_42%,transparent_72%)] dark:after:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),inset_0_-1px_0_rgb(255_255_255/0.05)] dark:supports-backdrop-filter:bg-card/42">
        <CardContent className="relative z-10 px-5 py-6 sm:px-7 sm:py-7">
          <form
            aria-label={`${t("login.title")} ${APP_NAME}`}
            className="flex flex-col justify-center"
            onSubmit={form.handleSubmit(async (values) => {
              if (turnstileEnabled && !turnstileToken) {
                const message = t("login.turnstileRequired")
                setTurnstileError(message)
                return
              }

              setTurnstileError("")
              try {
                await onSubmit({
                  ...values,
                  turnstile_token: turnstileToken || undefined,
                })
              } finally {
                if (turnstileEnabled) {
                  turnstileRef.current?.reset()
                }
              }
            })}
          >
            <FieldGroup className="gap-3">
              <div
                data-login-reveal
                className="mb-2 flex flex-col items-center gap-2 text-center"
              >
                <img
                  src="/pwa-512x512.png"
                  alt=""
                  className="size-14 drop-shadow-[0_10px_16px_rgba(15,23,42,0.16)] dark:drop-shadow-[0_12px_18px_rgba(0,0,0,0.36)]"
                />
                <h1 className="text-[1.55rem] leading-tight font-semibold">
                  {t("login.title")} {APP_NAME}
                </h1>
              </div>

              <Field
                data-login-reveal
                data-invalid={Boolean(form.formState.errors.username)}
                data-disabled={disabled}
              >
                <FieldLabel className="sr-only" htmlFor="username">
                  {t("login.username")}
                </FieldLabel>
                <InputGroup className="h-9">
                  <InputGroupAddon>
                    <InputGroupText>
                      <UserIcon />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="username"
                    autoComplete="username"
                    disabled={disabled}
                    placeholder={t("login.usernamePlaceholder")}
                    aria-invalid={Boolean(form.formState.errors.username)}
                    {...form.register("username")}
                  />
                </InputGroup>
                <FieldError errors={[form.formState.errors.username]} />
              </Field>

              <Field
                data-login-reveal
                data-invalid={Boolean(form.formState.errors.password)}
                data-disabled={disabled}
              >
                <FieldLabel className="sr-only" htmlFor="password">
                  {t("login.password")}
                </FieldLabel>
                <InputGroup data-password-group className="h-9">
                  <InputGroupAddon>
                    <InputGroupText>
                      <LockKeyholeIcon />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={disabled}
                    placeholder={t("login.passwordPlaceholder")}
                    aria-invalid={Boolean(form.formState.errors.password)}
                    {...form.register("password")}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      disabled={disabled}
                      aria-label={
                        showPassword
                          ? t("login.hidePassword")
                          : t("login.showPassword")
                      }
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      <span ref={passwordIconRef} className="inline-flex">
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </span>
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              {turnstileSiteKey ? (
                <Field
                  data-login-reveal
                  data-disabled={disabled}
                  className="items-center"
                >
                  <FieldLabel className="sr-only">
                    {t("login.turnstile")}
                  </FieldLabel>
                  <TurnstileWidget
                    ref={turnstileRef}
                    siteKey={turnstileSiteKey}
                    appearance="always"
                    size="flexible"
                    loadingLabel={t("login.turnstileLoading")}
                    onTokenChange={handleTurnstileTokenChange}
                    onError={handleTurnstileError}
                  />
                </Field>
              ) : null}

              {notice ? (
                <Alert data-login-reveal aria-live="polite">
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              ) : null}

              {displayError ? (
                <Alert data-login-reveal variant="destructive">
                  <AlertDescription>
                    {getErrorMessage(displayError, t("login.fallbackError"))}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Field data-login-submit>
                <Button type="submit" size="lg" disabled={submitDisabled}>
                  {submitBusy ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <LogInIcon data-icon="inline-start" />
                  )}
                  {t("login.submit")}
                </Button>
              </Field>

              {googleLoginEnabled ? (
                <>
                  <div data-login-reveal className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {t("login.oauthSeparator")}
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <Field data-login-reveal>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      data-provider="google"
                      disabled={disabled}
                      onClick={onGoogleLogin}
                    >
                      <GoogleLogo data-icon="inline-start" />
                      {t("login.google")}
                    </Button>
                  </Field>
                </>
              ) : null}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function shouldReduceMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function GoogleLogo(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}
