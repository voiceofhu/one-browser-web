import { zodResolver } from "@hookform/resolvers/zod"
import { EyeIcon, EyeOffIcon, LogInIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginFormProps = {
  className?: string
  isSubmitting?: boolean
  error?: unknown
  onSubmit: (values: LoginFormValues) => Promise<void> | void
}

export function LoginForm({
  className,
  isSubmitting = false,
  error,
  onSubmit,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const errorMessage = getErrorMessage(error)
  const disabled = isSubmitting || form.formState.isSubmitting

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">后台登录</CardTitle>
          <CardDescription>
            使用管理员账号登录 One Browser 管理后台。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit((values) => onSubmit(values))}>
            <FieldGroup>
              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertTitle>登录失败</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <Field
                data-invalid={Boolean(form.formState.errors.username)}
                data-disabled={disabled}
              >
                <FieldLabel htmlFor="login-form-username">用户名</FieldLabel>
                <Input
                  id="login-form-username"
                  autoComplete="username"
                  disabled={disabled}
                  aria-invalid={Boolean(form.formState.errors.username)}
                  placeholder="请输入用户名"
                  {...form.register("username")}
                />
                <FieldError errors={[form.formState.errors.username]} />
              </Field>

              <Field
                data-invalid={Boolean(form.formState.errors.password)}
                data-disabled={disabled}
              >
                <FieldLabel htmlFor="login-form-password">密码</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="login-form-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={disabled}
                    aria-invalid={Boolean(form.formState.errors.password)}
                    placeholder="请输入密码"
                    {...form.register("password")}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label={showPassword ? "隐藏密码" : "显示密码"}
                      aria-pressed={showPassword}
                      disabled={disabled}
                      size="icon-xs"
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              <Field>
                <Button type="submit" disabled={disabled}>
                  {disabled ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <LogInIcon data-icon="inline-start" />
                  )}
                  登录
                </Button>
                <FieldDescription>
                  请使用后端已创建的管理员账号登录。
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        如无法登录，请联系系统管理员重置账号或密码。
      </FieldDescription>
    </div>
  )
}

function getErrorMessage(error: unknown) {
  if (!error) {
    return null
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "登录失败，请检查用户名和密码。"
}
