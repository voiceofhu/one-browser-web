import type {
  CreateProxyRequest,
  ProxyCheckResult,
} from '@/features/browser/contracts';
import { toBrowserErrorMessage } from '@/features/browser/errors';
import { checkProxy as checkProxyApi } from '@/features/browser/proxy-core';
import { useDesktopAppGate } from '@/lib/desktop/app-gate';
import * as React from 'react';
import { toast } from 'sonner';

import { getRemoteProxyCheckConfig } from './api';
import type { RemoteProxyDialogState } from './components/proxy-editor-dialog';
import {
  useCreateRemoteProxyMutation,
  useDeleteRemoteProxyMutation,
  useUpdateRemoteProxyCheckResultMutation,
  useUpdateRemoteProxyMutation,
} from './queries';
import {
  fallbackCopyText,
  remoteProxyCheckRequest,
  remoteProxyCheckResultPayload,
  remoteProxyCheckToLocal,
  remoteProxyDuplicatePayload,
  remoteProxyPayloadFromCreateRequest,
  remoteProxyPayloadFromResource,
  remoteProxyToListItem,
  remoteProxyToProxyConfig,
} from './remote-proxy-mappers';
import type {
  RemoteProxyPayload,
  RemoteProxyResource,
  RemoteStatusFlag,
} from './types';

export function useRemoteProxyActions({
  proxies,
  selectedTeamId,
  canCreate,
  canUpdate,
  canDelete,
  canCheck,
  refetch,
}: {
  proxies: RemoteProxyResource[];
  selectedTeamId: number | null;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canCheck: boolean;
  refetch: () => Promise<unknown>;
}) {
  const { requireDesktopApp } = useDesktopAppGate();
  const [dialogState, setDialogState] =
    React.useState<RemoteProxyDialogState | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = React.useState(false);
  const [batchImporting, setBatchImporting] = React.useState(false);
  const [checkingProxyIds, setCheckingProxyIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [localCheckResults, setLocalCheckResults] = React.useState<
    Record<string, ProxyCheckResult>
  >({});
  const [proxyStatusOverrides, setProxyStatusOverrides] = React.useState<
    Record<string, RemoteStatusFlag>
  >({});
  const [updatingStatusProxyIds, setUpdatingStatusProxyIds] = React.useState<
    Set<string>
  >(() => new Set());
  const createMutation = useCreateRemoteProxyMutation();
  const updateMutation = useUpdateRemoteProxyMutation();
  const statusMutation = useUpdateRemoteProxyMutation();
  const deleteMutation = useDeleteRemoteProxyMutation();
  const checkResultMutation = useUpdateRemoteProxyCheckResultMutation();
  const proxyRows = React.useMemo(
    () =>
      proxies.map((proxy) =>
        remoteProxyToListItem(
          proxy,
          localCheckResults[String(proxy.proxy_id)],
          proxyStatusOverrides[String(proxy.proxy_id)],
        ),
      ),
    [localCheckResults, proxies, proxyStatusOverrides],
  );
  const remoteProxyById = React.useMemo(
    () =>
      new Map(proxies.map((proxy) => [String(proxy.proxy_id), proxy] as const)),
    [proxies],
  );

  function setLocalProxyCheckResult(
    proxyId: number | string,
    result: ProxyCheckResult,
  ) {
    setLocalCheckResults((current) => ({
      ...current,
      [String(proxyId)]: result,
    }));
  }

  async function persistCheckResult(proxyId: number, result: ProxyCheckResult) {
    try {
      const proxy = await checkResultMutation.mutateAsync({
        proxyId,
        payload: remoteProxyCheckResultPayload(result),
      });
      setLocalProxyCheckResult(proxy.proxy_id, remoteProxyCheckToLocal(proxy));
    } catch (error) {
      toast.error(`检测结果同步失败：${toBrowserErrorMessage(error)}`);
    }
  }

  function submitProxy(
    payload: RemoteProxyPayload,
    checkResult: ProxyCheckResult | null,
  ) {
    if (!dialogState) {
      return;
    }
    if (dialogState.mode === 'edit') {
      if (!canUpdate) {
        return;
      }
      updateMutation.mutate(
        { proxyId: dialogState.record.proxy_id, payload },
        {
          onSuccess: async (proxy) => {
            if (checkResult) {
              setLocalProxyCheckResult(proxy.proxy_id, checkResult);
              await persistCheckResult(proxy.proxy_id, checkResult);
            }
            toast.success('代理已更新');
            setDialogState(null);
          },
        },
      );
      return;
    }
    if (!canCreate) {
      return;
    }
    createMutation.mutate(payload, {
      onSuccess: async (proxy) => {
        if (checkResult) {
          setLocalProxyCheckResult(proxy.id, checkResult);
          await persistCheckResult(proxy.id, checkResult);
        }
        toast.success('代理已创建');
        setDialogState(null);
      },
    });
  }

  async function checkProxyLocally(proxy: RemoteProxyResource) {
    if (
      !requireDesktopApp({
        title: '在 App 中检测代理',
        description: '代理检测需要使用 One Browser App 的本机网络。',
      })
    ) {
      return null;
    }
    const proxyId = String(proxy.proxy_id);
    setCheckingProxyIds((current) => new Set(current).add(proxyId));
    try {
      const checkConfig = await getRemoteProxyCheckConfig(proxy.proxy_id);
      const result = await checkProxyApi(remoteProxyCheckRequest(checkConfig));
      setLocalProxyCheckResult(proxy.proxy_id, result);
      await persistCheckResult(proxy.proxy_id, result);
      return result;
    } catch (error) {
      toast.error(toBrowserErrorMessage(error));
      return null;
    } finally {
      setCheckingProxyIds((current) => {
        const next = new Set(current);
        next.delete(proxyId);
        return next;
      });
    }
  }

  async function checkProxy(proxyId: string) {
    if (!canCheck) {
      return;
    }
    const proxy = remoteProxyById.get(proxyId);
    if (!proxy) {
      return;
    }
    const result = await checkProxyLocally(proxy);
    if (!result) {
      return;
    }
    if (result.status === 'ok') {
      toast.success('代理检测通过');
    } else {
      toast.error(result.message || '代理检测未通过');
    }
  }

  async function checkMany(proxyIds: string[]) {
    if (!canCheck || !proxyIds.length) {
      return;
    }
    let checkedCount = 0;
    for (const proxyId of proxyIds) {
      const proxy = remoteProxyById.get(proxyId);
      if (proxy && (await checkProxyLocally(proxy))) {
        checkedCount += 1;
      }
    }
    if (checkedCount) {
      toast.success(`已检测 ${checkedCount} 个代理`);
    }
  }

  async function deleteProxies(proxyIds: string[]) {
    if (!canDelete || !proxyIds.length) {
      return;
    }
    let deletedCount = 0;
    for (const proxyId of proxyIds) {
      const proxy = remoteProxyById.get(proxyId);
      if (!proxy) {
        continue;
      }
      await deleteMutation.mutateAsync(proxy.proxy_id);
      deletedCount += 1;
    }
    if (deletedCount) {
      setLocalCheckResults((current) => {
        const next = { ...current };
        proxyIds.forEach((proxyId) => delete next[proxyId]);
        return next;
      });
      toast.success(`已删除 ${deletedCount} 个代理`);
    }
  }

  async function updateRemark(proxyId: string, remark: string) {
    if (!canUpdate) {
      return;
    }
    const proxy = remoteProxyById.get(proxyId);
    if (!proxy) {
      return;
    }
    await updateMutation.mutateAsync({
      proxyId: proxy.proxy_id,
      payload: remoteProxyPayloadFromResource(proxy, { remark }),
    });
    toast.success('备注已保存');
  }

  async function updateStatus(proxyId: string, enabled: boolean) {
    if (!canUpdate || updatingStatusProxyIds.has(proxyId)) {
      return;
    }
    const proxy = remoteProxyById.get(proxyId);
    if (!proxy) {
      return;
    }
    const status: RemoteStatusFlag = enabled ? '0' : '1';
    setProxyStatusOverrides((current) => ({ ...current, [proxyId]: status }));
    setUpdatingStatusProxyIds((current) => new Set(current).add(proxyId));
    try {
      await statusMutation.mutateAsync({
        proxyId: proxy.proxy_id,
        payload: remoteProxyPayloadFromResource(proxy, { status }),
      });
      await refetch();
      toast.success(enabled ? '代理已启用' : '代理已停用');
    } catch {
      // The mutation already shows the concrete API error.
    } finally {
      setProxyStatusOverrides((current) => {
        const next = { ...current };
        delete next[proxyId];
        return next;
      });
      setUpdatingStatusProxyIds((current) => {
        const next = new Set(current);
        next.delete(proxyId);
        return next;
      });
    }
  }

  async function openEdit(proxyId: string) {
    const proxy = remoteProxyById.get(proxyId);
    if (!proxy || !canUpdate) {
      return;
    }

    if (!proxy.has_password || !canCheck) {
      setDialogState({
        mode: 'edit',
        record: { ...proxy, password: null },
      });
      if (proxy.has_password && !canCheck) {
        toast.info('当前角色没有代理检测权限，密码不会回填');
      }
      return;
    }

    try {
      const config = await getRemoteProxyCheckConfig(proxy.proxy_id);
      setDialogState({
        mode: 'edit',
        record: {
          ...proxy,
          type: config.type,
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          server: config.server,
          pac_url: config.pac_url,
          ip_checker: config.ip_checker,
        },
      });
    } catch (error) {
      setDialogState({
        mode: 'edit',
        record: { ...proxy, password: null },
      });
      toast.error(
        `代理账号密码加载失败，原密码将保持不变：${toBrowserErrorMessage(error)}`,
      );
    }
  }

  function duplicate(proxyId: string) {
    if (!canCreate || !selectedTeamId) {
      return;
    }
    const proxy = remoteProxyById.get(proxyId);
    if (!proxy) {
      return;
    }
    createMutation.mutate(remoteProxyDuplicatePayload(proxy, selectedTeamId), {
      onSuccess: () =>
        toast.success(
          proxy.has_password ? '代理已复制，请重新填写密码' : '代理已复制',
        ),
    });
  }

  async function importBatch(
    requests: CreateProxyRequest[],
    checkResults: Record<string, ProxyCheckResult> = {},
  ) {
    if (!canCreate || !selectedTeamId) {
      return [];
    }
    setBatchImporting(true);
    const savedProxyIds: string[] = [];
    try {
      for (const request of requests) {
        try {
          const created = await createMutation.mutateAsync(
            remoteProxyPayloadFromCreateRequest(selectedTeamId, request),
          );
          savedProxyIds.push(String(created.id));
          const checkResult = checkResults[request.proxyId];
          if (checkResult) {
            setLocalProxyCheckResult(created.id, checkResult);
            await persistCheckResult(created.id, checkResult);
          }
        } catch {
          // The mutation already shows a concrete error toast.
        }
      }
      if (savedProxyIds.length) {
        await refetch();
      }
      return savedProxyIds;
    } finally {
      setBatchImporting(false);
    }
  }

  async function copyText(text: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    fallbackCopyText(text);
  }

  return {
    dialogState,
    batchDialogOpen,
    batchImporting,
    checkingProxyIds,
    updatingStatusProxyIds,
    proxyRows,
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      checkResultMutation.isPending,
    isChecking: checkingProxyIds.size > 0 || checkResultMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: createMutation.isPending,
    updatingProxyId: updateMutation.variables?.proxyId
      ? String(updateMutation.variables.proxyId)
      : null,
    openCreate: () => setDialogState({ mode: 'create' }),
    openEdit: (proxyId: string) => void openEdit(proxyId),
    closeDialog: () => setDialogState(null),
    setBatchDialogOpen,
    submitProxy,
    persistCheckResult,
    checkProxy,
    checkMany,
    deleteProxies,
    updateRemark,
    updateStatus,
    duplicate,
    resolveCopyProxy: (proxyId: string) => {
      const proxy = remoteProxyById.get(proxyId);
      return proxy
        ? Promise.resolve(remoteProxyToProxyConfig(proxy))
        : Promise.reject(new Error('proxy not found'));
    },
    copyText,
    importBatch,
  };
}
