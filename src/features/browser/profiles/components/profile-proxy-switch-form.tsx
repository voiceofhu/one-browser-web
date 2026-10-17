import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { DialogActionButton } from '@/components/ui/dialog-action-button';
import { AnimatedSegmentedTabs } from '@/components/ui/animated-segmented-tabs';
import type {
  CheckProxyRequest,
  CreateProxyRequest,
  ProfileListItem,
  ProxyListItem,
} from '@/features/browser/contracts';
import { toBrowserErrorMessage } from '@/features/browser/errors';
import {
  ProxyEditor,
  type ProxyEditorSubmitValue,
  createNoProxyCheckRequest,
} from '@/features/browser/proxy-core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  useCheckProxyMutation,
  useCreateProxyMutation,
} from '../../proxies/queries';
import {
  isNetworkUnavailable,
  networkUnavailableMessage,
} from '../../status/network-guard';
import { useAppStatusQuery } from '../../status/queries';
import {
  type ProxySwitchMode,
  emptyProxyValue,
  noProxyValue,
  proxyConfigToListItem,
  proxyModeOptions,
} from '../model/profile-proxy-switch';
import {
  LocalNetworkStatus,
  SavedProxyPanel,
} from './profile-proxy-switch-parts';

export function ProfileProxySwitchForm({
  isLoading,
  isPending,
  onCancel,
  onSubmit,
  profile,
  proxies,
}: {
  isLoading?: boolean;
  isPending?: boolean;
  onCancel: () => void;
  onSubmit: (proxyId: string | null) => void;
  profile: ProfileListItem;
  proxies: ProxyListItem[];
}) {
  const [mode, setMode] = useState<ProxySwitchMode>(
    profile.proxyId ? 'static' : 'none',
  );
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false);
  const [createdProxy, setCreatedProxy] = useState<ProxyListItem | null>(null);
  const [checkResult, setCheckResult] = useState<
    ProxyListItem['lastCheck'] | null
  >(null);
  const [selectedProxyId, setSelectedProxyId] = useState(
    profile.proxyId ?? noProxyValue,
  );
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
    if (!createdProxy) return proxies;
    if (proxies.some((proxy) => proxy.proxyId === createdProxy.proxyId)) {
      return proxies.map((proxy) =>
        proxy.proxyId === createdProxy.proxyId
          ? { ...proxy, lastCheck: createdProxy.lastCheck }
          : proxy,
      );
    }
    return [createdProxy, ...proxies];
  }, [createdProxy, proxies]);
  const selectedProxy = useMemo(
    () =>
      availableProxies.find((proxy) => proxy.proxyId === selectedProxyId) ??
      null,
    [availableProxies, selectedProxyId],
  );
  const canSave =
    mode === 'none' ||
    (selectedProxyId !== noProxyValue && selectedProxyId !== emptyProxyValue);

  useEffect(() => {
    if (
      mode !== 'none' ||
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
    const frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        localNetworkStartedRef.current = true;
        checkCurrentNetwork(createNoProxyCheckRequest());
      }, 400);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [
    appStatus,
    checkCurrentNetwork,
    isLocalNetworkError,
    isLocalNetworkPending,
    localNetworkResult,
    mode,
  ]);

  function updateMode(value: string) {
    if (!value) return;
    const nextMode = value as ProxySwitchMode;
    setMode(nextMode);
    if (nextMode === 'none') {
      setSelectedProxyId(noProxyValue);
      return;
    }
    if (
      selectedProxyId === noProxyValue ||
      selectedProxyId === emptyProxyValue
    ) {
      setSelectedProxyId(availableProxies[0]?.proxyId ?? emptyProxyValue);
    }
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
        setMode('static');
        setSelectedProxyId(proxy.proxyId);
        setProxyDialogOpen(false);
        setCheckResult(null);
        toast.success('代理已新增并选中');
      },
    });
  }

  return (
    <>
      <ResponsiveDialogBody className="flex flex-col gap-3">
        <AnimatedSegmentedTabs
          label="代理来源"
          className="w-full"
          listClassName="grid w-full grid-cols-3"
          triggerClassName="h-6 min-w-0 text-xs"
          value={mode}
          onValueChange={updateMode}
          options={proxyModeOptions.map((option) => ({
            ...option,
            label: <span className="truncate">{option.label}</span>,
          }))}
        />
        {mode === 'none' ? (
          <LocalNetworkStatus
            isChecking={
              isLocalNetworkPending ||
              (!localNetworkResult && !isLocalNetworkError)
            }
            isError={isLocalNetworkError}
            result={localNetworkResult}
          />
        ) : (
          <SavedProxyPanel
            currentProxyUrl={profile.proxyUrl}
            isLoading={isLoading}
            mode={mode}
            onAddProxy={() => setProxyDialogOpen(true)}
            proxies={availableProxies}
            selectedProxy={selectedProxy}
            selectedProxyId={selectedProxyId}
            setSelectedProxyId={setSelectedProxyId}
          />
        )}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <DialogActionButton action="cancel" type="button" onClick={onCancel}>
          取消
        </DialogActionButton>
        <DialogActionButton
          type="button"
          disabled={isPending || isLoading || !canSave}
          loading={isPending}
          loadingText="保存中..."
          onClick={() => onSubmit(mode === 'none' ? null : selectedProxyId)}
        >
          保存
        </DialogActionButton>
      </ResponsiveDialogFooter>
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
              formId="profile-proxy-switch-new-proxy-form"
              checkResult={checkResult}
              isChecking={checkProxyMutation.isPending}
              onCheck={(request) => void checkProxyWithNetworkGuard(request)}
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
              form="profile-proxy-switch-new-proxy-form"
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
    </>
  );
}
