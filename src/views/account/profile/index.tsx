"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CameraIcon,
  CopyIcon,
  MailIcon,
  PhoneIcon,
  RotateCcwIcon,
  SaveIcon,
  UserRoundIcon,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import { TabsContent } from "@/components/ui/tabs"
import { useTranslation } from "@/components/providers/language-context"
import { useCurrentUser } from "@/hooks/use-auth"
import { translateAdminText } from "@/local"
import type { Locale } from "@/local"
import { authQueryKeys } from "@/lib/query-keys"
import { SEX_LABELS } from "@/router/routes"
import type { CurrentUser, SexFlag } from "@/types/admin"

import { getAccountTabOptions, type AccountTab } from "./account-tabs"
import { AvatarCropDialog } from "./avatar-crop-dialog"
import { AvatarPreviewDialog } from "./avatar-preview-dialog"
import { PasswordForm } from "./password-form"
import { InfoRow, ProfileInput } from "./profile-fields"

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp,image/gif"

function createProfileSchema(locale: Locale) {
  const tt = (text: string) => translateAdminText(locale, text)

  return z.object({
    nick_name: z
      .string()
      .trim()
      .min(1, tt("昵称不能为空"))
      .max(64, tt("昵称不能超过 64 个字符")),
    email: z
      .string()
      .trim()
      .refine((value) => !value || z.email().safeParse(value).success, {
        message: tt("邮箱格式不正确"),
      }),
    phone_number: z.string().trim().max(32, tt("手机号不能超过 32 个字符")),
    sex: z.enum(["0", "1", "2"]),
    avatar: z.string().trim().max(255, tt("头像地址不能超过 255 个字符")),
  })
}

type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>

export default function AccountProfilePage() {
  const { locale } = useTranslation()
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const user = currentUser.data
  const [activeTab, setActiveTab] = React.useState<AccountTab>("profile")
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const loadedUserIdRef = React.useRef<number | null>(null)
  const pendingAvatarUrlRef = React.useRef<string | null>(null)
  const [pendingAvatarUrl, setPendingAvatarUrl] = React.useState<string | null>(
    null
  )
  const [pendingAvatarFileName, setPendingAvatarFileName] = React.useState("")
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = React.useState(false)
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = React.useState(false)
  const profileSchema = React.useMemo(
    () => createProfileSchema(locale),
    [locale]
  )
  const accountTabOptions = React.useMemo(
    () => getAccountTabOptions(locale),
    [locale]
  )
  const tt = React.useCallback(
    (text: string) => translateAdminText(locale, text),
    [locale]
  )
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileDefaults(user),
  })
  const avatar = useWatch({ control: form.control, name: "avatar" })
  const nickName = useWatch({ control: form.control, name: "nick_name" })
  const sex = useWatch({ control: form.control, name: "sex" })
  const avatarSrc = avatar
  const displayName = nickName || user?.user_name || tt("账号")
  const fallback = displayName.slice(0, 2).toUpperCase()
  const hasProfileChanges = form.formState.isDirty
  const updateProfile = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateCurrentUserProfile(toProfilePayload(values)),
    onSuccess: (updatedUser) => {
      loadedUserIdRef.current = updatedUser.user_id
      queryClient.setQueryData(authQueryKeys.currentUser, updatedUser)
      form.reset(profileDefaults(updatedUser))
      toast.success(tt("账号信息已保存"))
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : tt("账号信息保存失败")
      )
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
      toast.success(tt("头像已更新"))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : tt("头像上传失败"))
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
      toast.error(tt("请选择 jpg、png、webp 或 gif 图片"))
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error(tt("头像不能超过 5 MB"))
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

  function handlePreviewAvatar() {
    if (avatarSrc) {
      setIsAvatarPreviewOpen(true)
    }
  }

  async function handleCopyUsername() {
    const username = user?.user_name

    if (!username) {
      toast.error(tt("暂无可复制的用户名"))
      return
    }

    try {
      await navigator.clipboard.writeText(username)
      toast.success(tt("用户名已复制"))
    } catch {
      toast.error(tt("复制失败，请稍后重试"))
    }
  }

  function handleResetProfile() {
    clearPendingAvatar()
    setIsAvatarDialogOpen(false)
    form.reset(profileDefaults(user))
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 bg-muted/25 px-4 py-4 lg:px-5">
      <header className="flex flex-col gap-1">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-normal">
            {tt("个人账号")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tt("维护当前账号的头像、昵称和联系信息。")}
          </p>
        </div>
      </header>

      <AnimatedSegmentedTabs
        label={tt("账号设置")}
        options={accountTabOptions}
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-col gap-4"
        triggerClassName="min-w-20 px-4"
      >
        <TabsContent
          value="profile"
          className="grid min-h-0 gap-4 lg:grid-cols-[21rem_minmax(0,1fr)]"
        >
          <Card size="sm" className="h-fit bg-background shadow-none ring-0">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 enabled:cursor-zoom-in disabled:cursor-default"
                    aria-label={tt("查看头像大图")}
                    disabled={!avatarSrc}
                    onClick={handlePreviewAvatar}
                  >
                    <Avatar className="size-20 rounded-xl">
                      <AvatarImage
                        src={avatarSrc || undefined}
                        alt={displayName}
                      />
                      <AvatarFallback className="rounded-xl">
                        {fallback}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <Button
                    type="button"
                    size="icon-sm"
                    className="absolute -right-1 -bottom-1 size-8 rounded-full"
                    aria-label={tt("上传头像")}
                    disabled={uploadAvatar.isPending || currentUser.isLoading}
                    onClick={handleChooseAvatar}
                  >
                    {uploadAvatar.isPending ? <Spinner /> : <CameraIcon />}
                  </Button>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <CardTitle className="truncate text-base">
                    {displayName}
                  </CardTitle>
                  <CardDescription className="flex min-w-0 items-center gap-1">
                    <span className="min-w-0 truncate">
                      {user?.user_name ?? "-"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-6 text-muted-foreground"
                      aria-label={tt("复制用户名")}
                      disabled={currentUser.isLoading || !user?.user_name}
                      onClick={handleCopyUsername}
                    >
                      <CopyIcon />
                    </Button>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <input
                ref={fileInputRef}
                type="file"
                accept={AVATAR_ACCEPT}
                className="hidden"
                onChange={handleAvatarSelected}
              />
              <dl className="grid gap-2 text-sm">
                <div className="rounded-lg bg-muted/35 px-3 py-2">
                  <InfoRow
                    icon={MailIcon}
                    label={tt("邮箱")}
                    value={user?.email || "-"}
                  />
                </div>
                <div className="rounded-lg bg-muted/35 px-3 py-2">
                  <InfoRow
                    icon={PhoneIcon}
                    label={tt("手机号")}
                    value={user?.phone_number || "-"}
                  />
                </div>
                <div className="rounded-lg bg-muted/35 px-3 py-2">
                  <InfoRow
                    icon={UserRoundIcon}
                    label={tt("用户性别")}
                    value={user ? tt(SEX_LABELS[user.sex]) : "-"}
                  />
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card size="sm" className="min-h-0 bg-background shadow-none ring-0">
            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={form.handleSubmit((values) =>
                updateProfile.mutate(values)
              )}
            >
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle>{tt("个人信息")}</CardTitle>
                    <CardDescription>
                      {tt("头像、昵称和联系方式保存后立即生效。")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 pt-0">
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <ProfileInput
                    label={tt("昵称")}
                    error={form.formState.errors.nick_name?.message}
                    {...form.register("nick_name")}
                  />
                  <ProfileInput
                    label={tt("邮箱")}
                    type="email"
                    error={form.formState.errors.email?.message}
                    {...form.register("email")}
                  />
                  <ProfileInput
                    label={tt("手机号")}
                    error={form.formState.errors.phone_number?.message}
                    {...form.register("phone_number")}
                  />
                  <Field
                    data-invalid={Boolean(form.formState.errors.sex)}
                    className="pb-1 md:col-span-2"
                  >
                    <FieldLabel>{tt("性别")}</FieldLabel>
                    <RadioGroup
                      className="grid grid-cols-3 gap-2"
                      value={sex}
                      onValueChange={(value) =>
                        form.setValue("sex", value as SexFlag, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      {Object.entries(SEX_LABELS).map(([value, label]) => (
                        <FieldLabel
                          key={value}
                          htmlFor={`profile-sex-${value}`}
                          className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border px-3 font-normal has-data-checked:border-primary has-data-checked:bg-primary/5"
                        >
                          <RadioGroupItem
                            id={`profile-sex-${value}`}
                            value={value}
                            aria-invalid={Boolean(form.formState.errors.sex)}
                          />
                          {tt(label)}
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                    <FieldError errors={[form.formState.errors.sex]} />
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter className="mx-3 mt-2 flex flex-col items-stretch gap-2 rounded-lg border-t-0 bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">
                  {hasProfileChanges
                    ? tt("当前资料有修改，保存后会同步到当前账号。")
                    : tt("当前资料已和服务器保持同步。")}
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
                    {tt("重置")}
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
                    {tt("保存修改")}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <PasswordForm />
        </TabsContent>
      </AnimatedSegmentedTabs>
      {avatarSrc ? (
        <AvatarPreviewDialog
          open={isAvatarPreviewOpen}
          imageUrl={avatarSrc}
          title={displayName}
          onOpenChange={setIsAvatarPreviewOpen}
        />
      ) : null}
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
