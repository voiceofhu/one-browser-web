import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { Collapsible } from '@/components/ui/collapsible';
import { DialogActionButton } from '@/components/ui/dialog-action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from '@/components/ui/toast';

import {
  buildProfileGroupOptions,
  normalizeProfileGroup,
} from '../profiles/group-utils';
import {
  useCreateProfileMutation,
  useProfileQuery,
  useUpdateProfileMutation,
} from '../profiles/hooks/use-profile-queries';
import { useProxiesQuery } from '../proxies/queries';
import { AdvancedSettings } from './advanced-settings';
import {
  BrowserFingerprintFields,
  BrowserSystemPicker,
} from './browser-fingerprint-fields';
import { CookieField } from './cookie-field';
import {
  fallbackFingerprintDefaults,
  readSystemFingerprintDefaults,
} from './fingerprint-defaults';
import { formToPayload, generatedProfileId, profileToForm } from './form';
import {
  localFingerprintOsConflict,
  resolveHostOperatingSystem,
} from './local-fingerprint-guard';
import { ProxySection } from './proxy-section';
import { randomFingerprintPatch } from './random-fingerprint';
import { SummaryPanel } from './summary-panel';
import {
  type ProfileEditorForm,
  type ProfileEditorProps,
  emptyForm,
} from './types';
import { profileEditorSchema } from './validation';

export function ProfileEditor({
  groupOptions = [],
  mode,
  open,
  profileId,
  onOpenChange,
}: ProfileEditorProps) {
  const isEdit = mode === 'edit';
  const profileQuery = useProfileQuery(
    { profileId: profileId ?? '' },
    open && isEdit,
  );
  const createProfileMutation = useCreateProfileMutation();
  const updateProfileMutation = useUpdateProfileMutation();
  const profileForm = useForm<ProfileEditorForm>({
    resolver: zodResolver(profileEditorSchema),
    defaultValues: emptyForm,
  });
  const { control, formState, handleSubmit, reset, setValue } = profileForm;
  const [fingerprintDefaults, setFingerprintDefaults] = useState(
    fallbackFingerprintDefaults,
  );
  const [fingerprintDefaultsStatus, setFingerprintDefaultsStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading');
  const fingerprintDefaultsLoadedRef = useRef(false);
  const isSaving =
    createProfileMutation.isPending || updateProfileMutation.isPending;
  const editorKey = !open
    ? 'closed'
    : isEdit
      ? `edit:${profileId ?? ''}:${profileQuery.data?.updatedAt ?? 'loading'}`
      : 'create';
  const nextForm = useMemo(
    () =>
      isEdit && profileQuery.data
        ? profileToForm(profileQuery.data)
        : emptyForm,
    [isEdit, profileQuery.data],
  );
  const [advancedOpenState, setAdvancedOpenState] = useState({
    editorKey: 'closed',
    open: false,
  });
  const advancedOpen =
    advancedOpenState.editorKey === editorKey ? advancedOpenState.open : false;
  const randomAction = isEdit ? undefined : generateRandomFingerprint;
  const watchedForm = useWatch({ control });
  const form = useMemo(
    () =>
      ({
        ...emptyForm,
        ...watchedForm,
      }) as ProfileEditorForm,
    [watchedForm],
  );
  const proxiesQuery = useProxiesQuery(
    undefined,
    open && form.proxyMode !== 'none',
  );
  const proxies = useMemo(
    () => proxiesQuery.data?.list ?? [],
    [proxiesQuery.data?.list],
  );

  useEffect(() => {
    if (!open || fingerprintDefaultsLoadedRef.current) {
      return;
    }

    let mounted = true;
    const timeoutId = window.setTimeout(() => {
      readSystemFingerprintDefaults()
        .then((defaults) => {
          if (mounted) {
            fingerprintDefaultsLoadedRef.current = true;
            setFingerprintDefaults(defaults);
            setFingerprintDefaultsStatus('ready');
          }
        })
        .catch(() => {
          if (mounted) {
            fingerprintDefaultsLoadedRef.current = true;
            setFingerprintDefaultsStatus('error');
          }
        });
    }, 120);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  useEffect(() => {
    reset(nextForm);
  }, [editorKey, nextForm, reset]);

  function updateField<K extends keyof ProfileEditorForm>(
    key: K,
    value: ProfileEditorForm[K],
  ) {
    setValue(key as never, value as never, {
      shouldDirty: true,
      shouldValidate: false,
      shouldTouch: true,
    });
  }

  function generateRandomFingerprint() {
    for (const [key, value] of Object.entries(
      randomFingerprintPatch(form, fingerprintDefaults),
    ) as Array<
      [keyof ProfileEditorForm, ProfileEditorForm[keyof ProfileEditorForm]]
    >) {
      setValue(key as never, value as never, {
        shouldDirty: true,
        shouldValidate: false,
        shouldTouch: true,
      });
    }

    toast.success('已生成新指纹');
  }

  function saveProfile(values: ProfileEditorForm) {
    if (fingerprintDefaultsStatus === 'loading') {
      toast.error('正在读取本机系统信息，请稍后再试');
      return;
    }

    const hostSystem =
      fingerprintDefaultsStatus === 'ready'
        ? resolveHostOperatingSystem(fingerprintDefaults)
        : null;

    if (!hostSystem) {
      toast.warning('未能识别本机系统，保存后将在启动浏览器时再次检查');
    } else {
      const osConflict = localFingerprintOsConflict(
        values,
        fingerprintDefaults,
      );

      if (osConflict) {
        toast.error(osConflict.message);
        return;
      }
    }

    const payload = formToPayload(values);
    const profileKey = payload.profileId.trim();

    if (isEdit && !profileKey) {
      toast.error('环境 ID 必填');
      return;
    }

    if (isEdit) {
      updateProfileMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('环境已更新');
          onOpenChange(false);
        },
      });
      return;
    }

    const nextProfileId = profileKey || generatedProfileId(values);
    createProfileMutation.mutate(
      {
        ...payload,
        profileId: nextProfileId,
        name: payload.name || nextProfileId,
      },
      {
        onSuccess: () => {
          toast.success('环境已创建');
          onOpenChange(false);
        },
      },
    );
  }

  function handleInvalid() {
    toast.error('请检查表单内容');
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[min(90dvh,42rem)] sm:max-w-4xl [&_[data-slot=dialog-close]]:size-7">
        <ResponsiveDialogHeader className="px-5 py-4">
          <ResponsiveDialogTitle className="truncate pr-8 text-base font-semibold">
            {isEdit ? '编辑环境' : '新建环境'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            创建或编辑隔离浏览器环境。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="px-5 py-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <FieldGroup className="min-w-0 gap-3">
              <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <GroupField
                  form={form}
                  groupOptions={groupOptions}
                  updateField={updateField}
                />
                <Field>
                  <FieldLabel className="sr-only" htmlFor="profile-editor-name">
                    环境名称
                  </FieldLabel>
                  <Input
                    id="profile-editor-name"
                    value={form.name}
                    onChange={(event) =>
                      updateField('name', event.target.value)
                    }
                    placeholder="环境名称"
                  />
                </Field>
              </div>

              <BrowserSystemPicker
                defaults={fingerprintDefaults}
                form={form}
                hostSystem={
                  fingerprintDefaultsStatus === 'ready'
                    ? resolveHostOperatingSystem(fingerprintDefaults)
                    : null
                }
                updateField={updateField}
              />

              <BrowserFingerprintFields
                defaults={fingerprintDefaults}
                form={form}
                updateField={updateField}
              />

              <CookieField
                error={formState.errors.cookies}
                value={form.cookies}
                onChange={(value) =>
                  setValue('cookies', value, {
                    shouldDirty: true,
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
              />

              <Field>
                <FieldLabel className="sr-only" htmlFor="profile-editor-remark">
                  备注
                </FieldLabel>
                <Textarea
                  id="profile-editor-remark"
                  value={form.remark}
                  onChange={(event) =>
                    updateField('remark', event.target.value)
                  }
                  className="min-h-16 resize-none"
                  placeholder="备注"
                />
              </Field>

              <Separator className="border-t border-dashed bg-transparent" />
              <ProxySection
                error={formState.errors.proxyId}
                form={form}
                proxies={proxies}
                updateField={updateField}
              />
              <Collapsible
                open={advancedOpen}
                onOpenChange={(nextOpen) =>
                  setAdvancedOpenState({ editorKey, open: nextOpen })
                }
              >
                <AdvancedSettings
                  form={form}
                  defaults={fingerprintDefaults}
                  errors={formState.errors}
                  open={advancedOpen}
                  updateField={updateField}
                />
              </Collapsible>
            </FieldGroup>
            <SummaryPanel
              form={form}
              defaults={fingerprintDefaults}
              onGenerateRandomFingerprint={randomAction}
            />
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter className="grid grid-cols-2 gap-2 px-5 py-3 sm:flex sm:justify-end">
          <DialogActionButton
            action="cancel"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            取消
          </DialogActionButton>
          <DialogActionButton
            className="w-full sm:w-auto"
            onClick={handleSubmit(saveProfile, handleInvalid)}
            disabled={isSaving || (isEdit && profileQuery.isLoading)}
            loading={isSaving}
            loadingText={isEdit ? '保存中...' : '创建中...'}
          >
            {isEdit ? '保存' : '创建'}
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function GroupField({
  form,
  groupOptions,
  updateField,
}: {
  form: ProfileEditorForm;
  groupOptions: string[];
  updateField: <K extends keyof ProfileEditorForm>(
    key: K,
    value: ProfileEditorForm[K],
  ) => void;
}) {
  const options = useMemo(
    () => buildProfileGroupOptions(groupOptions, form.groupId),
    [form.groupId, groupOptions],
  );
  const selectedGroup = normalizeProfileGroup(form.groupId);

  return (
    <Field>
      <FieldLabel className="sr-only" htmlFor="profile-editor-group">
        分组
      </FieldLabel>
      <InputGroup className="w-full">
        <InputGroupInput
          id="profile-editor-group"
          value={selectedGroup}
          onChange={(event) => updateField('groupId', event.target.value)}
          placeholder="分组，可留空"
        />
        <InputGroupAddon align="inline-end">
          {selectedGroup ? (
            <InputGroupButton
              aria-label="清除分组"
              size="icon-xs"
              variant="ghost"
              onClick={() => updateField('groupId', '')}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                className="pointer-events-none"
              />
            </InputGroupButton>
          ) : null}
          {options.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton
                  aria-label="选择分组"
                  size="icon-xs"
                  variant="ghost"
                >
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    strokeWidth={2}
                    className="pointer-events-none"
                  />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-64 min-w-40">
                <DropdownMenuRadioGroup
                  value={selectedGroup}
                  onValueChange={(value) => updateField('groupId', value)}
                >
                  {options.map((option) => (
                    <DropdownMenuRadioItem key={option} value={option}>
                      {option}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {!selectedGroup && options.length === 0 ? (
            <InputGroupButton
              aria-label="暂无分组"
              size="icon-xs"
              variant="ghost"
              disabled
            >
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                strokeWidth={2}
                className="pointer-events-none"
              />
            </InputGroupButton>
          ) : null}
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
