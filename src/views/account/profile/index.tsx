"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  IdCardIcon,
  ImageUpIcon,
  MailIcon,
  PhoneIcon,
  RotateCcwIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
  type UpdateCurrentUserProfilePayload,
} from "@/api/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentUser } from "@/hooks/use-auth"
import { authQueryKeys } from "@/lib/query-keys"
import { SEX_LABELS } from "@/router/routes"
import type { CurrentUser, SexFlag } from "@/types/admin"

import { AvatarCropDialog } from "./avatar-crop-dialog"
import { InfoRow, ProfileInput } from "./profile-fields"

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp,image/gif"

const profileSchema = z.object({
  nick_name: z
    .string()
    .trim()
    .min(1, "昵称不能为空")
    .max(64, "昵称不能超过 64 个字符"),
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
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const loadedUserIdRef = React.useRef<number | null>(null)
  const pendingAvatarUrlRef = React.useRef<string | null>(null)
  const [pendingAvatarUrl, setPendingAvatarUrl] = React.useState<string | null>(
    null
  )
  const [pendingAvatarFileName, setPendingAvatarFileName] = React.useState("")
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = React.useState(false)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileDefaults(user),
  })
  const avatar = useWatch({ control: form.control, name: "avatar" })
  const nickName = useWatch({ control: form.control, name: "nick_name" })
  const sex = useWatch({ control: form.control, name: "sex" })
  const avatarSrc = avatar
  const displayName = nickName || user?.user_name || "账号"
  const fallback = displayName.slice(0, 2).toUpperCase()
  const hasProfileChanges = form.formState.isDirty
  const updateProfile = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateCurrentUserProfile(toProfilePayload(values)),
    onSuccess: (updatedUser) => {
      loadedUserIdRef.current = updatedUser.user_id
      queryClient.setQueryData(authQueryKeys.currentUser, updatedUser)
      form.reset(profileDefaults(updatedUser))
      toast.success("账号信息已保存")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "账号信息保存失败")
    },
  })
  const uploadAvatar = useMutation({
    mutationFn: uploadCurrentUserAvatar,
    onSuccess: (updatedUser) => {
      clearPendingAvatar()
      setIsAvatarDialogOpen(false)
      queryClient.setQueryData(authQueryKeys.currentUser, updatedUser)
      form.setValue("avatar", updatedUser.avatar, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      })
      toast.success("头像已更新")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "头像上传失败")
    },
  })
  const isProfileBusy =
    updateProfile.isPending || uploadAvatar.isPending || currentUser.isLoading

  React.useEffect(() => {
    if (user && loadedUserIdRef.current !== user.user_id) {
      loadedUserIdRef.current = user.user_id
      form.reset(profileDefaults(user))
    }
  }, [form, user])

  React.useEffect(
    () => () => {
      if (pendingAvatarUrlRef.current) {
        URL.revokeObjectURL(pendingAvatarUrlRef.current)
      }
    },
    []
  )

  function clearPendingAvatar() {
    if (pendingAvatarUrlRef.current) {
      URL.revokeObjectURL(pendingAvatarUrlRef.current)
      pendingAvatarUrlRef.current = null
    }
    setPendingAvatarUrl(null)
    setPendingAvatarFileName("")
  }

  function handleChooseAvatar() {
    fileInputRef.current?.click()
  }

  function handleAvatarSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!AVATAR_ACCEPT.split(",").includes(file.type)) {
      toast.error("请选择 jpg、png、webp 或 gif 图片")
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("头像不能超过 5 MB")
      return
    }

    clearPendingAvatar()
    const avatarUrl = URL.createObjectURL(file)
    pendingAvatarUrlRef.current = avatarUrl
    setPendingAvatarUrl(avatarUrl)
    setPendingAvatarFileName(file.name)
    setIsAvatarDialogOpen(true)
  }

  function handleAvatarDialogOpenChange(open: boolean) {
    if (uploadAvatar.isPending) {
      return
    }

    setIsAvatarDialogOpen(open)

    if (!open) {
      clearPendingAvatar()
    }
  }

  function handleSubmitAvatar(file: File) {
    uploadAvatar.mutate(file)
  }

  function handleClearAvatar() {
    clearPendingAvatar()
    setIsAvatarDialogOpen(false)
    form.setValue("avatar", "", {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  function handleResetProfile() {
    clearPendingAvatar()
    setIsAvatarDialogOpen(false)
    form.reset(profileDefaults(user))
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 px-4 py-4 lg:px-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-normal">个人账号</h1>
          <p className="text-sm text-muted-foreground">
            维护当前账号的头像、昵称和联系信息。
          </p>
        </div>
        <Badge variant={hasProfileChanges ? "default" : "secondary"}>
          {hasProfileChanges ? "有未保存修改" : "资料已同步"}
        </Badge>
      </header>

      <div className="grid min-h-0 gap-4 lg:grid-cols-[18.5rem_minmax(0,1fr)]">
        <Card size="sm" className="h-fit bg-muted/35 shadow-none ring-0">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-16 rounded-xl">
                <AvatarImage src={avatarSrc || undefined} alt={displayName} />
                <AvatarFallback className="rounded-xl">
                  {fallback}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <CardTitle className="truncate text-base">
                  {displayName}
                </CardTitle>
                <CardDescription className="truncate">
                  {user?.user_name ?? "-"}
                </CardDescription>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="secondary">已登录</Badge>
                  <Badge variant="outline">{user?.user_type || "system"}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={handleAvatarSelected}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadAvatar.isPending || currentUser.isLoading}
                onClick={handleChooseAvatar}
              >
                {uploadAvatar.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <ImageUpIcon data-icon="inline-start" />
                )}
                上传头像
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!avatar || uploadAvatar.isPending}
                onClick={handleClearAvatar}
              >
                <XIcon data-icon="inline-start" />
                移除
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              支持 jpg、png、webp、gif，最大 5 MB。
            </p>
            <Separator />
            <dl className="grid gap-2 text-sm">
              <InfoRow
                icon={IdCardIcon}
                label="账号 ID"
                value={user ? String(user.user_id) : "-"}
              />
              <InfoRow
                icon={ShieldCheckIcon}
                label="账号类型"
                value={user?.user_type ?? "-"}
              />
              <InfoRow
                icon={MailIcon}
                label="邮箱"
                value={user?.email || "-"}
              />
              <InfoRow
                icon={PhoneIcon}
                label="手机号"
                value={user?.phone_number || "-"}
              />
              <InfoRow
                icon={UserRoundIcon}
                label="用户性别"
                value={user ? SEX_LABELS[user.sex] : "-"}
              />
            </dl>
          </CardContent>
        </Card>

        <Card size="sm" className="min-h-0 bg-muted/35 shadow-none ring-0">
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit((values) =>
              updateProfile.mutate(values)
            )}
          >
            <CardHeader className="gap-2 border-b pb-3">
              <CardTitle>资料设置</CardTitle>
              <CardDescription>
                用户名不可修改，其他资料保存后立即生效。
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 pt-3">
              <FieldGroup className="grid gap-3 md:grid-cols-2">
                <ProfileInput
                  label="用户名"
                  value={user?.user_name ?? ""}
                  disabled
                  readOnly
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
                    value={sex}
                    onValueChange={(value) =>
                      form.setValue("sex", value as SexFlag, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      aria-invalid={Boolean(form.formState.errors.sex)}
                    >
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
                  description="也可以粘贴外部图片地址；上传头像会自动填充这里。"
                  {...form.register("avatar")}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                {hasProfileChanges
                  ? "当前资料有修改，保存后会同步到当前账号。"
                  : "当前资料已和服务器保持同步。"}
              </span>
              <div className="grid grid-cols-5 gap-2 sm:min-w-64">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="col-span-2"
                  disabled={!hasProfileChanges || isProfileBusy}
                  onClick={handleResetProfile}
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  重置
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="col-span-3"
                  disabled={isProfileBusy || !hasProfileChanges}
                >
                  {updateProfile.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <SaveIcon data-icon="inline-start" />
                  )}
                  保存修改
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
      <AvatarCropDialog
        open={isAvatarDialogOpen}
        imageUrl={pendingAvatarUrl}
        fileName={pendingAvatarFileName}
        isSubmitting={uploadAvatar.isPending}
        onOpenChange={handleAvatarDialogOpenChange}
        onSelectFile={handleChooseAvatar}
        onSubmit={handleSubmitAvatar}
      />
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
