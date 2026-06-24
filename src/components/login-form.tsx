import { zodResolver } from "@hookform/resolvers/zod"
import {
  EyeIcon,
  EyeOffIcon,
  LockKeyholeIcon,
  LogInIcon,
  UserIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { z } from "zod"

import { useTranslation } from "@/components/providers/language-context"
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
import { Spinner } from "@/components/ui/spinner"
import { localizedPublicPath } from "@/local"
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

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card className="p-0 shadow-lg shadow-foreground/5">
        <CardContent className="p-0">
          <form
            className="flex flex-col justify-center p-6 sm:p-8"
            onSubmit={form.handleSubmit((values) => onSubmit(values))}
          >
            <FieldGroup className="gap-4">
              <div className="mb-2 flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">{t("login.title")}</h1>
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

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {getErrorMessage(error, t("login.fallbackError"))}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Field>
                <Button className="h-10" type="submit" disabled={disabled}>
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
