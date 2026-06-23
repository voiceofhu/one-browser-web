import { zodResolver } from "@hookform/resolvers/zod"
import { EyeIcon, EyeOffIcon, LogInIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { z } from "zod"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { localizedPublicPath } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type LoginFormValues = {
  username: string
  password: string
}

type LoginFormProps = Omit<React.ComponentProps<"div">, "onSubmit"> & {
  isSubmitting?: boolean
  error?: unknown
  onSubmit: (values: LoginFormValues) => Promise<void> | void
}

export function LoginForm({
  className,
  isSubmitting = false,
  error,
  onSubmit,
  ...props
}: LoginFormProps) {
  const { locale, t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [loginImageSeed] = useState(() => Math.random().toString(36).slice(2))
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
  const loginImageSrc = `https://picsum.photos/960/1280?random=${loginImageSeed}`

  return (
    <div className={cn("flex flex-col gap-5", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-none">
        <CardContent className="grid p-0 md:grid-cols-[1fr_0.84fr]">
          <form
            className="p-6 md:p-8"
            onSubmit={form.handleSubmit((values) => onSubmit(values))}
          >
            <FieldGroup>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
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
                <Input
                  id="username"
                  autoComplete="username"
                  disabled={disabled}
                  placeholder={t("login.usernamePlaceholder")}
                  aria-invalid={Boolean(form.formState.errors.username)}
                  {...form.register("username")}
                />
                <FieldError errors={[form.formState.errors.username]} />
              </Field>

              <Field
                data-invalid={Boolean(form.formState.errors.password)}
                data-disabled={disabled}
              >
                <FieldLabel htmlFor="password">
                  {t("login.password")}
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={disabled}
                    placeholder={t("login.passwordPlaceholder")}
                    aria-invalid={Boolean(form.formState.errors.password)}
                    className="pr-10"
                    {...form.register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 size-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                    disabled={disabled}
                    aria-label={
                      showPassword
                        ? t("login.hidePassword")
                        : t("login.showPassword")
                    }
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </div>
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              {error ? (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {getErrorMessage(error, t("login.fallbackError"))}
                </p>
              ) : null}

              <Field>
                <Button type="submit" disabled={disabled}>
                  {disabled ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <LogInIcon data-icon="inline-start" />
                  )}
                  {t("login.submit")}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src={loginImageSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
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
