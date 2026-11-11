import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { DefaultUserAvatar } from '@/features/account/avatar';
import { getDefaultUserAvatarSeed } from '@/features/account/avatar';
import {
  type UpdateCurrentUserProfilePayload,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
} from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-gate';
import type { CurrentUser } from '@/features/auth/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Camera01Icon,
  FloppyDiskIcon,
  Refresh01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AvatarCropDialog } from './avatar-crop-dialog';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

const sexOptions = [
  { label: '未知', value: '0' },
  { label: '男', value: '1' },
  { label: '女', value: '2' },
] as const;

const profileSchema = z.object({
  nick_name: z
    .string()
    .trim()
    .min(1, '昵称不能为空')
    .max(64, '昵称不能超过 64 个字符'),
  phone_number: z.string().trim().max(32, '手机号不能超过 32 个字符'),
  sex: z.enum(['0', '1', '2']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function AccountProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const loadedUserIdRef = React.useRef(user.user_id);
  const pendingAvatarUrlRef = React.useRef<string | null>(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = React.useState<string | null>(
    null,
  );
  const [pendingAvatarFileName, setPendingAvatarFileName] = React.useState('');
  const [avatarCropOpen, setAvatarCropOpen] = React.useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileDefaults(user),
  });
  const nickName = useWatch({
    control: profileForm.control,
    name: 'nick_name',
  });
  const displayName = nickName || user.user_name || '账号';
  const avatar = user.avatar || '';
  const avatarSeed = getDefaultUserAvatarSeed(
    user.user_id,
    user.email,
    user.user_name,
    displayName,
  );

  const syncCurrentUser = React.useCallback(
    (updatedUser: CurrentUser) => {
      queryClient.setQueriesData<CurrentUser>(
        { queryKey: ['auth', 'me'] },
        updatedUser,
      );
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    [queryClient],
  );

  const updateProfile = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateCurrentUserProfile(
        toProfilePayload(values, user.email || '', avatar),
      ),
    onSuccess: (updatedUser) => {
      loadedUserIdRef.current = updatedUser.user_id;
      syncCurrentUser(updatedUser);
      profileForm.reset(profileDefaults(updatedUser));
      toast.success('账号信息已保存');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '账号信息保存失败');
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: uploadCurrentUserAvatar,
    onSuccess: (updatedUser) => {
      clearPendingAvatar();
      setAvatarCropOpen(false);
      syncCurrentUser(updatedUser);
      toast.success('头像已更新');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '头像上传失败');
    },
  });

  React.useEffect(() => {
    if (loadedUserIdRef.current !== user.user_id) {
      loadedUserIdRef.current = user.user_id;
      profileForm.reset(profileDefaults(user));
    }
  }, [profileForm, user]);

  React.useEffect(
    () => () => {
      if (pendingAvatarUrlRef.current) {
        URL.revokeObjectURL(pendingAvatarUrlRef.current);
      }
    },
    [],
  );

  function clearPendingAvatar() {
    if (pendingAvatarUrlRef.current) {
      URL.revokeObjectURL(pendingAvatarUrlRef.current);
      pendingAvatarUrlRef.current = null;
    }
    setPendingAvatarUrl(null);
    setPendingAvatarFileName('');
  }

  function handleChooseAvatar() {
    fileInputRef.current?.click();
  }

  function handleAvatarSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!AVATAR_ACCEPT.split(',').includes(file.type)) {
      toast.error('请选择 jpg、png、webp 或 gif 图片');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('头像不能超过 5 MB');
      return;
    }

    clearPendingAvatar();
    const avatarUrl = URL.createObjectURL(file);
    pendingAvatarUrlRef.current = avatarUrl;
    setPendingAvatarUrl(avatarUrl);
    setPendingAvatarFileName(file.name);
    setAvatarCropOpen(true);
  }

  function handleAvatarCropOpenChange(open: boolean) {
    if (uploadAvatar.isPending) {
      return;
    }

    setAvatarCropOpen(open);
    if (!open) {
      clearPendingAvatar();
    }
  }

  const profileBusy = updateProfile.isPending || uploadAvatar.isPending;

  return (
    <>
      <Card
        size="sm"
        className="overflow-visible bg-transparent p-0 shadow-none ring-0 data-[size=sm]:py-0"
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={profileForm.handleSubmit((values) =>
            updateProfile.mutate(values),
          )}
        >
          <CardContent className="flex flex-col gap-3 p-0 group-data-[size=sm]/card:px-0">
            <ProfileAvatarBlock
              avatar={avatar}
              avatarSeed={avatarSeed}
              displayName={displayName}
              isUploading={uploadAvatar.isPending}
              user={user}
              onChooseAvatar={handleChooseAvatar}
            />

            <FieldGroup className="rounded-lg border bg-card p-3 sm:p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <ReadonlyCopyField
                  label="用户名"
                  value={user.user_name || ''}
                  emptyLabel="-"
                />
                <ReadonlyCopyField
                  label="邮箱"
                  value={user.email || ''}
                  emptyLabel="未绑定邮箱"
                />
                <ProfileTextField
                  id="account-nick-name"
                  label="昵称"
                  autoComplete="name"
                  disabled={profileBusy}
                  error={profileForm.formState.errors.nick_name?.message}
                  {...profileForm.register('nick_name')}
                />
                <ProfileTextField
                  id="account-phone"
                  label="手机号"
                  autoComplete="tel"
                  disabled={profileBusy}
                  error={profileForm.formState.errors.phone_number?.message}
                  {...profileForm.register('phone_number')}
                />
              </div>

              <Controller
                control={profileForm.control}
                name="sex"
                render={({ field, fieldState }) => (
                  <FieldSet data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLegend variant="label">性别</FieldLegend>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-wrap gap-2"
                      disabled={profileBusy}
                    >
                      {sexOptions.map((option) => (
                        <Field
                          key={option.value}
                          orientation="horizontal"
                          data-checked={field.value === option.value}
                          className="h-8 w-fit cursor-pointer items-center rounded-md border border-input bg-input/20 px-3 text-xs transition-colors hover:bg-muted data-[checked=true]:border-primary data-[checked=true]:bg-primary/5"
                        >
                          <RadioGroupItem
                            id={`account-sex-${option.value}`}
                            value={option.value}
                          />
                          <FieldLabel
                            htmlFor={`account-sex-${option.value}`}
                            className="cursor-pointer font-medium"
                          >
                            {option.label}
                          </FieldLabel>
                        </Field>
                      ))}
                    </RadioGroup>
                    <FieldError errors={[fieldState.error]} />
                  </FieldSet>
                )}
              />
            </FieldGroup>
          </CardContent>

          <CardFooter className="justify-end gap-2 p-0 group-data-[size=sm]/card:px-0">
            <Button
              type="button"
              variant="outline"
              disabled={profileBusy || !profileForm.formState.isDirty}
              onClick={() => profileForm.reset(profileDefaults(user))}
            >
              <HugeiconsIcon
                icon={Refresh01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              重置
            </Button>
            <Button
              type="submit"
              disabled={profileBusy || !profileForm.formState.isDirty}
            >
              {profileBusy ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <HugeiconsIcon
                  icon={FloppyDiskIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
              )}
              保存资料
            </Button>
          </CardFooter>
        </form>
      </Card>

      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept={AVATAR_ACCEPT}
        onChange={handleAvatarSelected}
      />

      <AvatarCropDialog
        open={avatarCropOpen}
        imageUrl={pendingAvatarUrl}
        fileName={pendingAvatarFileName}
        isSubmitting={uploadAvatar.isPending}
        onOpenChange={handleAvatarCropOpenChange}
        onSelectFile={handleChooseAvatar}
        onSubmit={(file) => uploadAvatar.mutate(file)}
      />
    </>
  );
}

function ReadonlyCopyField({
  label,
  value,
  emptyLabel,
}: {
  label: string;
  value: string;
  emptyLabel: string;
}) {
  const copyText = value.trim();
  const displayText = copyText || emptyLabel;

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex h-7 min-w-0 items-center gap-2 rounded-md bg-input/20 px-2 text-xs/relaxed">
        <span
          className="min-w-0 flex-1 truncate text-muted-foreground data-[filled=true]:text-foreground"
          data-filled={Boolean(copyText)}
          title={displayText}
        >
          {displayText}
        </span>
        <CopyButton
          variant="ghost"
          size="icon-xs"
          text={copyText}
          disabled={!copyText}
          idleLabel={`复制${label}`}
          copyingLabel="正在复制..."
          copiedLabel="已复制"
          successMessage={`${label}已复制`}
          errorMessage={`${label}复制失败`}
        />
      </div>
    </Field>
  );
}

function ProfileAvatarBlock({
  avatar,
  avatarSeed,
  displayName,
  isUploading,
  onChooseAvatar,
  user,
}: {
  avatar: string;
  avatarSeed: string;
  displayName: string;
  isUploading: boolean;
  onChooseAvatar: () => void;
  user: CurrentUser;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-14" size="lg">
          <AvatarImage src={avatar || undefined} alt={displayName} />
          <AvatarFallback className="overflow-hidden p-0">
            <DefaultUserAvatar seed={avatarSeed} />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{displayName}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {user.email || '未绑定邮箱'}
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={onChooseAvatar}
      >
        {isUploading ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <HugeiconsIcon
            icon={Camera01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
        )}
        {isUploading ? '正在上传...' : '更换头像'}
      </Button>
    </div>
  );
}

function ProfileTextField({
  label,
  error,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
}) {
  return (
    <Field data-invalid={Boolean(error)} className={className}>
      <FieldLabel htmlFor={props.id}>{label}</FieldLabel>
      <Input aria-invalid={Boolean(error)} {...props} />
      <FieldError errors={[error ? { message: error } : undefined]} />
    </Field>
  );
}

function profileDefaults(user: CurrentUser): ProfileFormValues {
  return {
    nick_name: user.nick_name || user.user_name || '',
    phone_number: user.phone_number || '',
    sex: normalizeSex(user.sex),
  };
}

function toProfilePayload(
  values: ProfileFormValues,
  email: string,
  avatar: string,
): UpdateCurrentUserProfilePayload {
  return {
    nick_name: values.nick_name.trim(),
    email,
    phone_number: values.phone_number.trim(),
    sex: values.sex,
    avatar,
  };
}

function normalizeSex(value: string): ProfileFormValues['sex'] {
  return value === '1' || value === '2' ? value : '0';
}
