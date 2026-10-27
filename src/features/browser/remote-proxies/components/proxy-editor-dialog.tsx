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
import type {
  CheckProxyRequest,
  ProxyCheckResult,
  ProxyConfig,
  ProxyType,
} from '@/features/browser/contracts';
import { toBrowserErrorMessage } from '@/features/browser/errors';
import { useDesktopAppGate } from '@/lib/desktop/app-gate';
import {
  ProxyEditor,
  type ProxyEditorSubmitValue,
  checkProxy as checkProxyApi,
} from '@/features/browser/proxy-core';
import * as React from 'react';
import { toast } from 'sonner';

import type {
  RemoteProxyPayload,
  RemoteProxyResource,
  RemoteProxyType,
} from '../types';

type RemoteProxyEditRecord = RemoteProxyResource & { password: string | null };

export type RemoteProxyDialogState =
  | { mode: 'create'; record?: undefined }
  | { mode: 'edit'; record: RemoteProxyEditRecord };

const editableRemoteProxyTypes = new Set<RemoteProxyType>([
  'http',
  'https',
  'socks5',
]);

export function RemoteProxyEditorDialog({
  state,
  teamId,
  isSaving,
  onOpenChange,
  onCheckResult,
  onSubmit,
}: {
  state: RemoteProxyDialogState | null;
  teamId: number | null;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckResult?: (proxyId: number, result: ProxyCheckResult) => Promise<void>;
  onSubmit: (
    payload: RemoteProxyPayload,
    checkResult: ProxyCheckResult | null,
  ) => void;
}) {
  const { requireDesktopApp } = useDesktopAppGate();
  const record = state?.mode === 'edit' ? state.record : null;
  const formId = 'remote-proxy-editor-form';
  const [checkResult, setCheckResult] = React.useState<ProxyCheckResult | null>(
    null,
  );
  const [isChecking, setIsChecking] = React.useState(false);
  const proxy = React.useMemo(() => remoteProxyToProxyConfig(record), [record]);

  async function checkProxy(request: CheckProxyRequest) {
    if (
      !requireDesktopApp({
        title: '在 App 中检测代理',
        description: '代理检测需要使用 One Browser App 的本机网络。',
      })
    ) {
      return;
    }
    setIsChecking(true);
    setCheckResult(null);

    try {
      const result = await checkProxyApi(request);
      setCheckResult(result);

      if (result.status === 'ok') {
        toast.success('代理检测通过');
      } else {
        toast.error(result.message || '代理检测未通过');
      }

      if (record) {
        await onCheckResult?.(record.proxy_id, result);
      }
    } catch (error) {
      toast.error(toBrowserErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  }

  async function submit(value: ProxyEditorSubmitValue) {
    if (!teamId) {
      toast.error('请选择团队');
      return;
    }

    if (
      !requireDesktopApp({
        title: '在 App 中保存并检测代理',
        description:
          '保存前需要通过本机网络检测代理，请在 One Browser App 中继续。',
      })
    ) {
      return;
    }

    setIsChecking(true);
    setCheckResult(null);

    try {
      const result = await checkProxyApi(
        proxyCheckRequestFromSubmitValue(value, proxy),
      );
      setCheckResult(result);

      if (result.status !== 'ok') {
        toast.error(result.message || '代理检测未通过');
        return;
      }

      onSubmit(
        remoteProxyPayloadFromSubmitValue(teamId, value, record),
        result,
      );
    } catch (error) {
      toast.error(toBrowserErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <ResponsiveDialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {state?.mode === 'edit' ? '编辑代理' : '新建代理'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            创建或编辑可复用代理配置。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <ProxyEditor
            key={
              record
                ? `${record.proxy_id}:${record.updated_at ?? 'loading'}`
                : 'create'
            }
            mode={record ? 'edit' : 'create'}
            formId={formId}
            proxy={proxy}
            checkResult={checkResult}
            isChecking={isChecking}
            passwordVisibleByDefault={Boolean(record?.password)}
            onCheck={(request) => void checkProxy(request)}
            onFormChange={() => setCheckResult(null)}
            onSubmit={submit}
          />
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            type="button"
            disabled={isSaving || isChecking}
            onClick={() => onOpenChange(false)}
          >
            取消
          </DialogActionButton>
          <DialogActionButton
            type="submit"
            form={formId}
            disabled={isSaving || isChecking}
            loading={isSaving || isChecking}
            loadingText={isChecking ? '检测中' : '保存中'}
          >
            保存
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function remoteProxyToProxyConfig(
  proxy?: RemoteProxyEditRecord | null,
): ProxyConfig | null {
  if (!proxy) {
    return null;
  }

  return {
    proxyId: proxy.proxy_key,
    name: proxy.name,
    type: editableRemoteProxyTypes.has(proxy.type) ? proxy.type : 'socks5',
    host: proxy.host,
    port: proxy.port,
    username: proxy.username,
    password: proxy.password,
    server: proxy.server,
    pacUrl: proxy.pac_url,
    bypassList: [],
    refreshUrl: proxy.refresh_url,
    ipChecker: proxy.ip_checker,
    remark: proxy.remark,
    createdAt: proxy.created_at,
    updatedAt: proxy.updated_at ?? proxy.created_at,
    lastCheck: {
      status: proxy.last_check_status,
      exitIp: proxy.last_check_exit_ip,
      countryCode: proxy.last_check_country_code,
      country: proxy.last_check_country,
      region: proxy.last_check_region,
      asn: proxy.last_check_asn,
      latencyMs: proxy.last_check_latency_ms,
      checkedAt: proxy.last_check_checked_at,
      message: proxy.last_check_message,
    },
  };
}

function remoteProxyPayloadFromSubmitValue(
  teamId: number,
  value: ProxyEditorSubmitValue,
  record?: RemoteProxyResource | null,
): RemoteProxyPayload {
  const proxyType = (value.type ?? record?.type ?? 'socks5') as ProxyType;
  const password = Object.hasOwn(value, 'password')
    ? (value.password ?? null)
    : undefined;

  return {
    team_id: teamId,
    proxy_key: record?.proxy_key ?? value.proxyId,
    name: value.name ?? record?.name ?? value.proxyId,
    type: remoteProxyType(proxyType),
    host: value.host ?? record?.host ?? null,
    port: value.port ?? record?.port ?? null,
    username: Object.hasOwn(value, 'username')
      ? (value.username ?? null)
      : (record?.username ?? null),
    ...(password !== undefined ? { password } : {}),
    server: value.server ?? record?.server ?? null,
    pac_url: value.pacUrl ?? record?.pac_url ?? null,
    refresh_url: value.refreshUrl ?? record?.refresh_url ?? null,
    ip_checker: value.ipChecker ?? record?.ip_checker ?? null,
    status: record?.status ?? '0',
    remark: value.remark ?? record?.remark ?? '',
  };
}

function proxyCheckRequestFromSubmitValue(
  value: ProxyEditorSubmitValue,
  existingProxy?: ProxyConfig | null,
): CheckProxyRequest {
  const hasSubmittedPassword = Object.hasOwn(value, 'password');
  const password = hasSubmittedPassword
    ? (value.password ?? null)
    : (existingProxy?.password ?? null);

  return {
    proxyConfig: {
      type: value.type ?? existingProxy?.type ?? 'socks5',
      host: value.host ?? existingProxy?.host ?? null,
      port: value.port ?? existingProxy?.port ?? null,
      username: Object.hasOwn(value, 'username')
        ? (value.username ?? null)
        : (existingProxy?.username ?? null),
      password,
      server: value.server ?? existingProxy?.server ?? null,
      pacUrl: value.pacUrl ?? existingProxy?.pacUrl ?? null,
      bypassList: [...(value.bypassList ?? existingProxy?.bypassList ?? [])],
    },
    ipChecker: value.ipChecker ?? existingProxy?.ipChecker ?? null,
  };
}

function remoteProxyType(type: ProxyType): RemoteProxyType {
  if (type === 'http' || type === 'https' || type === 'socks5') {
    return type;
  }

  return 'socks5';
}
