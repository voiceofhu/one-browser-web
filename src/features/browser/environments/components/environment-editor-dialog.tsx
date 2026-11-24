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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from '@/components/ui/toast';

import { AdvancedSettings } from '../../profile-editor/advanced-settings';
import {
  BrowserFingerprintFields,
  BrowserSystemPicker,
} from '../../profile-editor/browser-fingerprint-fields';
import { CookieField } from '../../profile-editor/cookie-field';
import {
  fallbackFingerprintDefaults,
  readSystemFingerprintDefaults,
} from '../../profile-editor/fingerprint-defaults';
import { formToPayload, generatedProfileId } from '../../profile-editor/form';
import { randomFingerprintPatch } from '../../profile-editor/random-fingerprint';
import { SummaryPanel } from '../../profile-editor/summary-panel';
import { type ProfileEditorForm, emptyForm } from '../../profile-editor/types';
import { profileEditorSchema } from '../../profile-editor/validation';
import type { RemoteProxyResource } from '../../remote-proxies/types';
import { listChromiumVersions } from '../../status/api';
import { remoteEnvironmentToForm, remoteProxyId } from '../environment-form';
import type {
  RemoteEnvironmentPayload,
  RemoteEnvironmentResource,
} from '../types';
import { GroupField } from './environment-group-field';
import { RemoteProxySection } from './environment-proxy-section';

export type RemoteEnvironmentDialogState =
  | { mode: 'create'; record?: undefined }
  | { mode: 'edit'; record: RemoteEnvironmentResource };

const FOLLOW_LATEST_CHROMIUM_VERSION = '__follow_latest__';

export function RemoteEnvironmentEditorDialog({
  state,
  teamId,
  groupOptions: providedGroupOptions = [],
  proxies,
  proxiesLoading,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  state: RemoteEnvironmentDialogState | null;
  teamId: number | null;
  groupOptions?: string[];
  proxies: RemoteProxyResource[];
  proxiesLoading?: boolean;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: RemoteEnvironmentPayload) => void;
}) {
  const open = Boolean(state);
  const isEdit = state?.mode === 'edit';
  const record = isEdit ? state.record : null;
  const [chromiumVersion, setChromiumVersion] = React.useState(
    record?.chromium_version ?? FOLLOW_LATEST_CHROMIUM_VERSION,
  );
  const chromiumVersionsQuery = useQuery({
    queryKey: ['browser', 'chromium-versions'],
    queryFn: () => listChromiumVersions(),
    enabled: open,
    staleTime: 60_000,
  });
  const currentChromiumVersion =
    chromiumVersionsQuery.data?.find((item) => item.isCurrent)?.version ??
    chromiumVersionsQuery.data?.[0]?.version ??
    '';
  const profileForm = useForm<ProfileEditorForm>({
    resolver: zodResolver(profileEditorSchema),
    defaultValues: emptyForm,
  });
  const { control, formState, handleSubmit, reset, setValue } = profileForm;
  const [fingerprintDefaults, setFingerprintDefaults] = React.useState(
    fallbackFingerprintDefaults,
  );
  const [fingerprintDefaultsReady, setFingerprintDefaultsReady] =
    React.useState(false);
  const fingerprintDefaultsLoadedRef = React.useRef(false);
  const createFingerprintInitializedRef = React.useRef(false);
  const editorKey = !open
    ? 'closed'
    : isEdit
      ? `edit:${record?.environment_id ?? ''}:${record?.updated_at ?? record?.created_at ?? 'loading'}`
      : 'create';
  const nextForm = React.useMemo(
    () => remoteEnvironmentToForm(record),
    [record],
  );
  const [advancedOpenState, setAdvancedOpenState] = React.useState({
    editorKey: 'closed',
    open: false,
  });
  const advancedOpen =
    advancedOpenState.editorKey === editorKey ? advancedOpenState.open : false;
  const randomAction = isEdit ? undefined : generateRandomFingerprint;
  const watchedForm = useWatch({ control });
  const form = React.useMemo(
    () =>
      ({
        ...emptyForm,
        ...watchedForm,
      }) as ProfileEditorForm,
    [watchedForm],
  );
  const groupOptions = React.useMemo(() => {
    const options = new Set(providedGroupOptions);
    if (record?.group_key) {
      options.add(record.group_key);
    }
    return Array.from(options);
  }, [providedGroupOptions, record]);

  React.useEffect(() => {
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
            setFingerprintDefaultsReady(true);
          }
        })
        .catch(() => {
          if (mounted) {
            fingerprintDefaultsLoadedRef.current = true;
            setFingerprintDefaultsReady(true);
          }
        });
    }, 120);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  React.useEffect(() => {
    reset(nextForm);
  }, [editorKey, nextForm, reset]);

  React.useEffect(() => {
    if (!open || isEdit) {
      createFingerprintInitializedRef.current = false;
      return;
    }
    if (!fingerprintDefaultsReady || createFingerprintInitializedRef.current) {
      return;
    }

    createFingerprintInitializedRef.current = true;
    const currentForm = profileForm.getValues();
    reset({
      ...currentForm,
      ...randomFingerprintPatch(currentForm, fingerprintDefaults),
    });
  }, [
    fingerprintDefaults,
    fingerprintDefaultsReady,
    isEdit,
    open,
    profileForm,
    reset,
  ]);

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

  function saveEnvironment(values: ProfileEditorForm) {
    const targetTeamId = record?.team_id ?? teamId;
    if (!targetTeamId) {
      toast.error('请选择团队');
      return;
    }

    const payload = formToPayload(values);
    const environmentKey =
      payload.profileId.trim() || generatedProfileId(values);
    const proxyId = remoteProxyId(payload.proxyId);

    onSubmit({
      team_id: targetTeamId,
      environment_key: environmentKey,
      environment_no: payload.profileNo,
      name: payload.name || environmentKey,
      group_key: payload.groupId,
      chromium_version:
        chromiumVersion === FOLLOW_LATEST_CHROMIUM_VERSION
          ? null
          : chromiumVersion,
      mode: payload.mode,
      status: record?.status ?? '0',
      proxy_id: proxyId,
      remark: payload.remark,
      fingerprint_config: payload.fingerprintConfig,
      advanced: payload.advanced,
    });
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
                  <FieldLabel className="sr-only" htmlFor="remote-env-name">
                    环境名称
                  </FieldLabel>
                  <Input
                    id="remote-env-name"
                    value={form.name}
                    onChange={(event) =>
                      updateField('name', event.target.value)
                    }
                    placeholder="环境名称"
                    disabled={isSaving}
                  />
                </Field>
              </div>

              <BrowserSystemPicker
                defaults={fingerprintDefaults}
                form={form}
                updateField={updateField}
              />

              <Field>
                <FieldLabel htmlFor="remote-env-chromium-version">
                  浏览器构建版本
                </FieldLabel>
                <Select
                  value={chromiumVersion}
                  onValueChange={setChromiumVersion}
                  disabled={
                    isSaving ||
                    chromiumVersionsQuery.isLoading ||
                    !chromiumVersionsQuery.data?.length
                  }
                >
                  <SelectTrigger id="remote-env-chromium-version">
                    <SelectValue
                      placeholder={
                        chromiumVersionsQuery.isLoading
                          ? '正在加载版本'
                          : '请选择版本'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={FOLLOW_LATEST_CHROMIUM_VERSION}>
                        {currentChromiumVersion
                          ? `跟随最新（当前 ${currentChromiumVersion}）`
                          : '跟随最新'}
                      </SelectItem>
                      {record?.chromium_version &&
                      !chromiumVersionsQuery.data?.some(
                        (item) => item.version === record.chromium_version,
                      ) ? (
                        <SelectItem value={record.chromium_version}>
                          {record.chromium_version}（当前环境）
                        </SelectItem>
                      ) : null}
                      {chromiumVersionsQuery.data?.map((item) => (
                        <SelectItem key={item.version} value={item.version}>
                          {item.version}
                          {item.isCurrent ? '（当前发布）' : ''}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

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
                <FieldLabel className="sr-only" htmlFor="remote-env-remark">
                  备注
                </FieldLabel>
                <Textarea
                  id="remote-env-remark"
                  value={form.remark}
                  onChange={(event) =>
                    updateField('remark', event.target.value)
                  }
                  className="min-h-16 resize-none"
                  placeholder="备注"
                  disabled={isSaving}
                />
              </Field>

              <Separator className="border-t border-dashed bg-transparent" />
              <RemoteProxySection
                error={formState.errors.proxyId}
                form={form}
                proxies={proxies}
                proxiesLoading={proxiesLoading}
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
            disabled={isSaving}
          >
            取消
          </DialogActionButton>
          <DialogActionButton
            className="w-full sm:w-auto"
            onClick={handleSubmit(saveEnvironment, handleInvalid)}
            disabled={isSaving}
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
