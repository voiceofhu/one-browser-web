import { zodResolver } from "@hookform/resolvers/zod"
import {
  EyeIcon,
  EyeOffIcon,
  LockKeyholeIcon,
  LogInIcon,
  UserIcon,
} from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { z } from "zod"

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
  FieldDescription,
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
import { localizedPublicPath } from "@/local"
import { cn } from "@/lib/utils"

type LoginFormValues = {
  username: string
  password: string
  turnstile_token?: string
}

type LoginFormProps = Omit<React.ComponentProps<"div">, "onSubmit"> & {
  isSubmitting?: boolean
  error?: unknown
  googleLoginUrl?: string | null
  turnstileSiteKey?: string
  onSubmit: (values: LoginFormValues) => Promise<void> | void
}

export function LoginForm({
  className,
  isSubmitting = false,
  error,
  googleLoginUrl,
  turnstileSiteKey,
  onSubmit,
  ...props
}: LoginFormProps) {
  const { locale, t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileError, setTurnstileError] = useState("")
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

  const termsPath = localizedPublicPath(locale, "terms")
  const privacyPath = localizedPublicPath(locale, "privacy")
  const disabled = isSubmitting || form.formState.isSubmitting
  const waitingForTurnstile = turnstileEnabled && !turnstileToken
  const submitDisabled = disabled || waitingForTurnstile
  const displayError =
    error || (turnstileError ? new Error(turnstileError) : null)
  const handleTurnstileTokenChange = useCallback((token: string) => {
    setTurnstileToken(token)
    if (token) {
      setTurnstileError("")
    }
  }, [])
  const handleTurnstileError = useCallback(() => {
    setTurnstileError(t("login.turnstileLoadFailed"))
  }, [t])

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card className="p-0 shadow-lg shadow-foreground/5">
        <CardContent className="p-0">
          <form
            className="flex flex-col justify-center p-5 sm:p-7"
            onSubmit={form.handleSubmit(async (values) => {
              if (turnstileEnabled && !turnstileToken) {
                setTurnstileError(t("login.turnstileRequired"))
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
            <FieldGroup className="gap-3.5">
              <div className="mb-1 flex flex-col gap-1">
                <h1 className="text-3xl leading-tight font-semibold">
                  {t("login.title")}
                </h1>
              </div>

              <Field
                data-invalid={Boolean(form.formState.errors.username)}
                data-disabled={disabled}
              >
                <FieldLabel htmlFor="username">
                  {t("login.username")}
                </FieldLabel>
                <InputGroup className="h-10">
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
                data-invalid={Boolean(form.formState.errors.password)}
                data-disabled={disabled}
              >
                <FieldLabel htmlFor="password">
                  {t("login.password")}
                </FieldLabel>
                <InputGroup className="h-10">
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
                      size="icon-sm"
                      disabled={disabled}
                      aria-label={
                        showPassword
                          ? t("login.hidePassword")
                          : t("login.showPassword")
                      }
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              {turnstileSiteKey ? (
                <Field data-disabled={disabled} className="items-center">
                  <FieldLabel className="sr-only">
                    {t("login.turnstile")}
                  </FieldLabel>
                  <TurnstileWidget
                    ref={turnstileRef}
                    siteKey={turnstileSiteKey}
                    className="mt-0.5"
                    onTokenChange={handleTurnstileTokenChange}
                    onError={handleTurnstileError}
                  />
                </Field>
              ) : null}

              {displayError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {getErrorMessage(displayError, t("login.fallbackError"))}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Field>
                <Button
                  className="h-11"
                  type="submit"
                  disabled={submitDisabled}
                >
                  {disabled ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <LogInIcon data-icon="inline-start" />
                  )}
                  {t("login.submit")}
                </Button>
              </Field>

              {googleLoginUrl ? (
                <>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {t("login.oauthSeparator")}
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <Field>
                    <Button
                      asChild
                      className="h-10"
                      variant="outline"
                      data-provider="google"
                    >
                      <a href={googleLoginUrl}>
                        <GoogleLogo data-icon="inline-start" />
                        {t("login.google")}
                      </a>
                    </Button>
                  </Field>
                </>
              ) : null}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <FieldDescription className="px-2 text-center text-sm">
        {t("login.legalPrefix")}{" "}
        <Link className="underline underline-offset-4" to={termsPath}>
          {t("login.terms")}
        </Link>{" "}
        {t("login.legalConnector")}{" "}
        <Link className="underline underline-offset-4" to={privacyPath}>
          {t("login.privacy")}
        </Link>
        {t("login.legalSuffix")}
      </FieldDescription>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
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
