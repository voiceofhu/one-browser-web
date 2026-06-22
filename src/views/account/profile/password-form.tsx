"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { EyeIcon, EyeOffIcon, SaveIcon } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { changeCurrentUserPassword } from "@/api/auth"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "请输入当前密码"),
    new_password: z
      .string()
      .min(10, "新密码至少需要 10 位")
      .max(128, "新密码不能超过 128 位"),
    confirm_password: z.string().min(1, "请再次输入新密码"),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    path: ["confirm_password"],
    message: "两次输入的新密码不一致",
  })
  .refine((values) => values.old_password !== values.new_password, {
    path: ["new_password"],
    message: "新密码不能和当前密码相同",
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export function PasswordForm() {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  })
  const newPassword = useWatch({
    control: form.control,
    name: "new_password",
  })
  const passwordStrength = React.useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword]
  )
  const updatePassword = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      changeCurrentUserPassword({
        old_password: values.old_password,
        new_password: values.new_password,
      }),
    onSuccess: () => {
      form.reset()
      toast.success("登录密码已更新")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "密码修改失败")
    },
  })

  return (
    <Card size="sm" className="max-w-2xl bg-background shadow-none ring-0">
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={form.handleSubmit((values) => updatePassword.mutate(values))}
      >
        <CardHeader className="pb-0">
          <CardTitle>修改密码</CardTitle>
          <CardDescription>修改后请使用新密码登录当前账号。</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <FieldGroup className="gap-4">
            <PasswordField
              id="account-old-password"
              label="当前密码"
              autoComplete="current-password"
              disabled={updatePassword.isPending}
              error={form.formState.errors.old_password?.message}
              {...form.register("old_password")}
            />
            <PasswordField
              id="account-new-password"
              label="新密码"
              description="至少 10 位，建议包含大小写字母、数字或符号。"
              autoComplete="new-password"
              disabled={updatePassword.isPending}
              error={form.formState.errors.new_password?.message}
              footer={<PasswordStrengthMeter strength={passwordStrength} />}
              {...form.register("new_password")}
            />
            <PasswordField
              id="account-confirm-password"
              label="确认新密码"
              autoComplete="new-password"
              disabled={updatePassword.isPending}
              error={form.formState.errors.confirm_password?.message}
              {...form.register("confirm_password")}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="mx-3 mt-2 flex flex-col items-stretch gap-2 rounded-lg border-t-0 bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            保存后服务端会校验当前密码是否正确。
          </span>
          <div className="grid grid-cols-5 gap-2 sm:min-w-64">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="col-span-2"
              disabled={updatePassword.isPending || !form.formState.isDirty}
              onClick={() => form.reset()}
            >
              清空
            </Button>
            <Button
              type="submit"
              size="sm"
              className="col-span-3"
              disabled={updatePassword.isPending}
            >
              {updatePassword.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              保存密码
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

type PasswordFieldProps = React.ComponentProps<typeof InputGroupInput> & {
  label: string
  description?: string
  error?: string
  footer?: React.ReactNode
}

function PasswordField({
  label,
  description,
  error,
  footer,
  disabled,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false)

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={props.id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          type={visible ? "text" : "password"}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={visible ? "隐藏密码" : "显示密码"}
            aria-pressed={visible}
            disabled={disabled}
            size="icon-xs"
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {footer}
      <FieldError errors={[error ? { message: error } : undefined]} />
    </Field>
  )
}

type PasswordStrength = {
  label: string
  hint: string
  value: number
}

function PasswordStrengthMeter({ strength }: { strength: PasswordStrength }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">密码强度</span>
        <Badge variant={strength.value >= 80 ? "default" : "secondary"}>
          {strength.label}
        </Badge>
      </div>
      <Progress
        value={strength.value}
        aria-label={`密码强度：${strength.label}`}
      />
      <p className="text-xs text-muted-foreground">{strength.hint}</p>
    </div>
  )
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      label: "未输入",
      value: 0,
      hint: "输入新密码后显示强度。",
    }
  }

  let score = 0
  if (password.length >= 10) score += 1
  if (password.length >= 14) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 2) {
    return {
      label: "偏弱",
      value: 25,
      hint: "建议至少 10 位，并加入大小写、数字或符号。",
    }
  }

  if (score === 3) {
    return {
      label: "一般",
      value: 55,
      hint: "可以继续增加长度或更多字符类型。",
    }
  }

  if (score === 4) {
    return {
      label: "较强",
      value: 80,
      hint: "强度不错，继续增加长度会更稳。",
    }
  }

  return {
    label: "强",
    value: 100,
    hint: "强度良好，请妥善保存新密码。",
  }
}
