import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import { DialogActionButton } from '@/components/ui/dialog-action-button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type {
  CheckProxyRequest,
  CreateProxyRequest,
  ProxyCheckResult,
  ProxyListItem,
} from '@/features/browser/contracts';
import { toBrowserErrorMessage } from '@/features/browser/errors';
import { cn } from '@/lib/utils';
import { Add01Icon, Route02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';

import { CountryFlag, resolveCountryCode } from '../components/country-flag';
import {
  proxyConfigToListItem,
  proxyLocation,
} from '../profiles/model/profile-proxy-switch';
import {
  useCheckProxyMutation,
  useCreateProxyMutation,
} from '../proxies/queries';
import {
  ProxyEditor,
  type ProxyEditorSubmitValue,
  createNoProxyCheckRequest,
  formatProxyCheckLocation,
} from '../proxy-core';
import {
  isNetworkUnavailable,
  networkUnavailableMessage,
} from '../status/network-guard';
import { useAppStatusQuery } from '../status/queries';
import { CompactTabs } from './editor-controls';
import { proxyAddress } from './proxy-section-model';
import {
  type ProfileEditorForm,
  type ProxyMode,
  type UpdateProfileEditorField,
} from './types';

const proxyModeOptions: Array<{ value: ProxyMode; label: string }> = [
  { value: 'none', label: '无代理' },
  { value: 'static', label: '固定代理' },
  { value: 'rotating', label: '动态代理' },
];

export function ProxySection({
  form,
  proxies,
  updateField,
  error,
}: {
  form: ProfileEditorForm;
  proxies: ProxyListItem[];
  updateField: UpdateProfileEditorField;
  error?: { message?: string };
}) {
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false);
  const [checkResult, setCheckResult] = useState<
    ProxyListItem['lastCheck'] | null
  >(null);
  const [createdProxy, setCreatedProxy] = useState<ProxyListItem | null>(null);
  const createProxyMutation = useCreateProxyMutation();
  const checkProxyMutation = useCheckProxyMutation();
  const { data: appStatus, refetch: refetchAppStatus } = useAppStatusQuery();
  const localNetworkStartedRef = useRef(false);
  const {
    data: localNetworkResult,
    isError: isLocalNetworkError,
    isPending: isLocalNetworkPending,
    mutate: checkCurrentNetwork,
  } = useCheckProxyMutation({ invalidateOnSuccess: false });
  const availableProxies = useMemo(() => {
    if (!createdProxy) {
      return proxies;
    }

    if (proxies.some((proxy) => proxy.proxyId === createdProxy.proxyId)) {
      return proxies.map((proxy) =>
        proxy.proxyId === createdProxy.proxyId
          ? { ...proxy, lastCheck: createdProxy.lastCheck }
          : proxy,
      );
    }

    return [createdProxy, ...proxies];
  }, [createdProxy, proxies]);

  useEffect(() => {
    if (form.proxyMode === 'none' || !availableProxies.length) {
      return;
    }

    const selectedProxyExists = availableProxies.some(
      (proxy) => proxy.proxyId === form.proxyId,
    );
    const fallbackProxyId = availableProxies[0]?.proxyId;

    if (!selectedProxyExists && fallbackProxyId) {
      updateField('proxyId', fallbackProxyId);
    }
  }, [availableProxies, form.proxyId, form.proxyMode, updateField]);

  useEffect(() => {
    if (
      form.proxyMode !== 'none' ||
      !appStatus ||
      isNetworkUnavailable(appStatus) ||
      localNetworkStartedRef.current ||
      localNetworkResult ||
      isLocalNetworkPending ||
      isLocalNetworkError
    ) {
      return;
    }

    let timeoutId: number | undefined;
    let cancelled = false;

    // Let the dialog settle before starting the external IP probe.
    const frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        localNetworkStartedRef.current = true;
        checkCurrentNetwork(createNoProxyCheckRequest());
      }, 400);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    appStatus,
    checkCurrentNetwork,
    form.proxyMode,
    isLocalNetworkError,
    isLocalNetworkPending,
    localNetworkResult,
  ]);

  function updateProxyMode(value: string) {
    if (!value) {
      return;
    }

    const proxyMode = value as ProxyMode;
    updateField('proxyMode', proxyMode);

    if (proxyMode === 'none') {
      updateField('proxyId', 'none');
    } else if (
      !availableProxies.some((proxy) => proxy.proxyId === form.proxyId)
    ) {
      updateField('proxyId', availableProxies[0]?.proxyId ?? 'none');
    }

    updateField('inlineProxyEnabled', false);
  }

  function checkProxy(request: CheckProxyRequest) {
    void checkProxyWithNetworkGuard(request);
  }

  async function checkProxyWithNetworkGuard(request: CheckProxyRequest) {
    const statusResult = await refetchAppStatus();
    if (statusResult.error) {
      toast.error(toBrowserErrorMessage(statusResult.error));
      return;
    }

    if (isNetworkUnavailable(statusResult.data)) {
      toast.error(networkUnavailableMessage);
      return;
    }

    setCheckResult(null);
    checkProxyMutation.mutate(request, {
      onSuccess: (result) => setCheckResult(result),
    });
  }

  function createProxy(value: ProxyEditorSubmitValue) {
    if (checkResult?.status !== 'ok') {
      toast.error('请先检测通过代理');
      return;
    }

    const verifiedCheck = checkResult;

    createProxyMutation.mutate(value as CreateProxyRequest, {
      onSuccess: (proxy) => {
        setCreatedProxy(
          proxyConfigToListItem(proxy, verifiedCheck ?? proxy.lastCheck),
        );
        updateField('proxyMode', 'static');
        updateField('proxyId', proxy.proxyId);
        updateField('inlineProxyEnabled', false);
        setProxyDialogOpen(false);
        setCheckResult(null);
        toast.success('代理已新增并选中');
      },
    });
  }

  const selectedProxy =
    availableProxies.find((proxy) => proxy.proxyId === form.proxyId) ?? null;
  const invalid = Boolean(error);
  const proxySelectValue =
    selectedProxy?.proxyId ?? availableProxies[0]?.proxyId ?? 'empty';

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <CompactTabs
        className="h-9"
        itemClassName="h-7 min-w-20 text-xs"
        value={form.proxyMode}
        onValueChange={updateProxyMode}
        options={proxyModeOptions}
      />

      {form.proxyMode === 'none' ? (
        <LocalNetworkStatus
          isChecking={isLocalNetworkPending}
          result={localNetworkResult}
        />
      ) : (
        <div className="border-border/80 bg-muted/10 rounded-md border border-dashed p-1.5">
          <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Field data-invalid={invalid}>
              <FieldLabel className="sr-only" htmlFor="profile-editor-proxy">
                已保存代理
              </FieldLabel>
              <Select
                value={proxySelectValue}
                onValueChange={(value) => updateField('proxyId', value)}
              >
                <SelectTrigger
                  id="profile-editor-proxy"
                  aria-invalid={invalid}
                  className="h-8 w-full justify-between"
                >
                  {selectedProxy ? (
                    <SelectedProxyValue proxy={selectedProxy} />
                  ) : (
                    <span className="text-muted-foreground truncate">
                      选择已保存代理
                    </span>
                  )}
                </SelectTrigger>
                <SelectContent
                  align="start"
                  position="popper"
                  className="border-border/70 bg-popover/95 max-h-72 w-[var(--radix-select-trigger-width)] rounded-md p-0 shadow-xl backdrop-blur"
                >
                  <SelectGroup className="p-1">
                    {availableProxies.map((proxy) => (
                      <SelectItem
                        key={proxy.proxyId}
                        value={proxy.proxyId}
                        className="focus:bg-accent/70 data-[state=checked]:bg-accent/50 min-h-12 px-2.5 py-1.5 text-xs"
                        textValue={proxyAddress(proxy)}
                      >
                        <ProxyOption
                          title={proxyAddress(proxy)}
                          description={proxyLocation(proxy)}
                          proxy={proxy}
                        />
                      </SelectItem>
                    ))}
                    {!availableProxies.length ? (
                      <SelectItem
                        value="empty"
                        disabled
                        className="min-h-10 px-2.5 py-1.5 text-xs"
                      >
                        <ProxyOption
                          title="暂无已保存代理"
                          description="点击右侧新增代理后再选择"
                        />
                      </SelectItem>
                    ) : null}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[error]} />
            </Field>
            <Button
              type="button"
              variant="outline"
              className="h-8"
              onClick={() => setProxyDialogOpen(true)}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              新增代理
            </Button>
          </div>
          <ProxyLocationLine proxy={selectedProxy} />
        </div>
      )}
      <ResponsiveDialog
        open={proxyDialogOpen}
        onOpenChange={setProxyDialogOpen}
      >
        <ResponsiveDialogContent className="sm:max-w-xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>新增代理</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              填写代理地址，检测通过后保存到代理管理。
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <ProxyEditor
              mode="create"
              formId="profile-editor-new-proxy-form"
              checkResult={checkResult}
              isChecking={checkProxyMutation.isPending}
              onCheck={checkProxy}
              onFormChange={() => setCheckResult(null)}
              onSubmit={createProxy}
            />
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <DialogActionButton
              action="cancel"
              type="button"
              onClick={() => setProxyDialogOpen(false)}
            >
              取消
            </DialogActionButton>
            <DialogActionButton
              type="submit"
              form="profile-editor-new-proxy-form"
              disabled={
                createProxyMutation.isPending || checkResult?.status !== 'ok'
              }
              loading={createProxyMutation.isPending}
              loadingText="添加中..."
            >
              添加并选择
            </DialogActionButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}

function SelectedProxyValue({ proxy }: { proxy: ProxyListItem }) {
  return <span className="truncate">{proxyAddress(proxy)}</span>;
}

function ProxyLocationLine({ proxy }: { proxy: ProxyListItem | null }) {
  if (!proxy) {
    return <div className="min-h-6 px-1" />;
  }

  return (
    <div className="text-muted-foreground flex min-h-6 min-w-0 items-center gap-1.5 px-1 text-xs">
      <ProxyMarker proxy={proxy} />
      <span className="truncate">{proxyLocation(proxy)}</span>
    </div>
  );
}

function LocalNetworkStatus({
  isChecking,
  result,
}: {
  isChecking: boolean;
  result?: ProxyCheckResult;
}) {
  return (
    <div className="border-border/80 bg-muted/10 flex min-h-11 items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs sm:text-sm">
      <span className="text-foreground font-medium">本机网络:</span>
      {isChecking ? (
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Spinner className="size-3.5" />
          检测中
        </span>
      ) : result?.status === 'ok' ? (
        <span className="text-muted-foreground flex min-w-0 items-center gap-1.5">
          {resolveCountryCode(result.countryCode, result.country) ? (
            <CountryFlag code={result.countryCode} country={result.country} />
          ) : null}
          <span className="truncate">{formatProxyCheckLocation(result)}</span>
        </span>
      ) : (
        <span className="text-muted-foreground truncate">
          {result?.message || '等待检测'}
        </span>
      )}
    </div>
  );
}

function ProxyOption({
  description,
  proxy,
  title,
}: {
  description: string;
  proxy?: ProxyListItem;
  title: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 py-0.5 pr-5">
      <div className="text-foreground truncate font-medium">{title}</div>
      <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[11px]">
        {proxy ? <ProxyMarker proxy={proxy} /> : null}
        <span className="truncate">{description}</span>
      </div>
    </div>
  );
}

function ProxyMarker({
  className,
  proxy,
}: {
  className?: string;
  proxy: ProxyListItem;
}) {
  const code = resolveCountryCode(
    proxy.lastCheck.countryCode,
    proxy.lastCheck.country,
  );

  if (code) {
    return (
      <CountryFlag
        className={className}
        code={code}
        country={proxy.lastCheck.country}
      />
    );
  }

  return (
    <HugeiconsIcon
      icon={Route02Icon}
      strokeWidth={2}
      className={cn('text-muted-foreground size-3.5 shrink-0', className)}
    />
  );
}
