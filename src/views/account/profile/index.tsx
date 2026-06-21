"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { SaveIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  updateCurrentUserProfile,
  type UpdateCurrentUserProfilePayload,
} from "@/api/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentUser } from "@/hooks/use-auth"
import { authQueryKeys } from "@/lib/query-keys"
import { SEX_LABELS } from "@/router/routes"
import type { CurrentUser, SexFlag } from "@/types/admin"

const profileSchema = z.object({
  nick_name: z.string().trim().min(1, "昵称不能为空").max(64, "昵称不能超过 64 个字符"),
  email: z
    .string()
    .trim()
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "邮箱格式不正确",
    }),
  phone_number: z.string().trim().max(32, "手机号不能超过 32 个字符"),
  sex: z.enum(["0", "1", "2"]),
  avatar: z.string().trim().max(255, "头像地址不能超过 255 个字符"),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function AccountProfilePage() {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const user = currentUser.data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileDefaults(user),
  })
  const avatar = form.watch("avatar")
  const displayName = form.watch("nick_name") || user?.user_name || "账号"
  const fallback = displayName.slice(0, 2).toUpperCase()
  const updateProfile = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateCurrentUserProfile(toProfilePayload(values)),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(authQueryKeys.currentUser, updatedUser)
      form.reset(profileDefaults(updatedUser))
      toast.success("账号信息已保存")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "账号信息保存失败")
    },
  })

  React.useEffect(() => {
    if (user) {
      form.reset(profileDefaults(user))
    }
  }, [form, user])

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-5 lg:px-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">个人账号</h1>
        <p className="text-sm text-muted-foreground">
          管理当前登录账号的基础资料。
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="h-fit shadow-none">
          <CardHeader>
            <CardTitle>账号概览</CardTitle>
            <CardDescription>当前会话绑定的后台账号。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-14 rounded-lg">
                <AvatarImage src={avatar} alt={displayName} />
                <AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-medium">{displayName}</div>
                <div className="truncate text-sm text-muted-foreground">
                  {user?.user_name ?? "-"}
                </div>
              </div>
            </div>
            <dl className="grid gap-3 text-sm">
              <InfoRow label="账号类型" value={user?.user_type ?? "-"} />
              <InfoRow label="邮箱" value={user?.email || "-"} />
              <InfoRow label="手机号" value={user?.phone_number || "-"} />
            </dl>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>资料设置</CardTitle>
            <CardDescription>用户名不可修改，其他资料保存后立即生效。</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit((values) =>
                updateProfile.mutate(values)
              )}
            >
              <FieldGroup className="grid gap-4 md:grid-cols-2">
                <ProfileInput
                  label="用户名"
                  value={user?.user_name ?? ""}
                  disabled
                  description="登录用户名由管理员维护。"
                />
                <ProfileInput
                  label="昵称"
                  error={form.formState.errors.nick_name?.message}
                  {...form.register("nick_name")}
                />
                <ProfileInput
                  label="邮箱"
                  type="email"
                  error={form.formState.errors.email?.message}
                  {...form.register("email")}
                />
                <ProfileInput
                  label="手机号"
                  error={form.formState.errors.phone_number?.message}
                  {...form.register("phone_number")}
                />
                <Field data-invalid={Boolean(form.formState.errors.sex)}>
                  <FieldLabel>性别</FieldLabel>
                  <Select
                    value={form.watch("sex")}
                    onValueChange={(value) =>
                      form.setValue("sex", value as SexFlag, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger aria-invalid={Boolean(form.formState.errors.sex)}>
                      <SelectValue placeholder="请选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.entries(SEX_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.sex]} />
                </Field>
                <ProfileInput
                  label="头像地址"
                  className="md:col-span-2"
                  error={form.formState.errors.avatar?.message}
                  {...form.register("avatar")}
                />
              </FieldGroup>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    updateProfile.isPending ||
                    currentUser.isLoading ||
                    !form.formState.isDirty
                  }
                >
                  {updateProfile.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <SaveIcon data-icon="inline-start" />
                  )}
                  保存
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProfileInput({
  label,
  description,
  error,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  description?: string
  error?: string
}) {
  return (
    <Field data-invalid={Boolean(error)} className={className}>
      <FieldLabel>{label}</FieldLabel>
      <Input aria-invalid={Boolean(error)} {...props} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={[error ? { message: error } : undefined]} />
    </Field>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate font-medium">{value}</dd>
    </div>
  )
}

function profileDefaults(user?: CurrentUser): ProfileFormValues {
  return {
    nick_name: user?.nick_name ?? "",
    email: user?.email ?? "",
    phone_number: user?.phone_number ?? "",
    sex: user?.sex ?? "2",
    avatar: user?.avatar ?? "",
  }
}

function toProfilePayload(
  values: ProfileFormValues
): UpdateCurrentUserProfilePayload {
  return {
    nick_name: values.nick_name.trim(),
    email: values.email.trim(),
    phone_number: values.phone_number.trim(),
    sex: values.sex,
    avatar: values.avatar.trim(),
  }
}
