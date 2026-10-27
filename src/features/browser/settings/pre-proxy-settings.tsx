import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldDescription, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  PreProxyMode,
  PreProxyPatch,
  PreProxySettings as PreProxySettingsValue,
  PreProxyTestResult,
  PreProxyType,
} from '@/features/browser/contracts';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  useSystemProxyQuery,
  useTestPreProxyMutation,
  useUpdateSettingsMutation,
} from './queries';
import { SettingsDivider, SettingsGroup, SettingsRow } from './settings-group';

const MODE_CHOICES: {
  value: PreProxyMode;
  title: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    value: 'off',
    title: '直连',
    description: '不经过任何前置代理，从本机网络直接连接代理',
  },
  {
    value: 'system',
    title: '跟随系统代理',
    description:
      '自动使用 Clash、v2rayN 等软件开启的系统代理；未开启时直接连接',
    recommended: true,
  },
  {
    value: 'manual',
    title: '手动指定',
    description: '始终经过下方代理，连不上时阻止访问，不会退回直连',
  },
];

export function PreProxySettings({
  preProxy,
}: {
  preProxy: PreProxySettingsValue;
}) {
  const updateSettingsMutation = useUpdateSettingsMutation();
  const testMutation = useTestPreProxyMutation();
  const [mode, setMode] = useState<PreProxyMode>(preProxy.mode);
  const [type, setType] = useState<PreProxyType>(preProxy.type);
  const [host, setHost] = useState(preProxy.host ?? '');
  const [port, setPort] = useState(preProxy.port ? String(preProxy.port) : '');
  const [username, setUsername] = useState(preProxy.username ?? '');
  const [password, setPassword] = useState('');
  const [testResult, setTestResult] = useState<PreProxyTestResult | null>(null);
  const systemProxyQuery = useSystemProxyQuery(mode === 'system');

  function basePatch(nextMode: PreProxyMode): PreProxyPatch {
    const parsedPort = Number(port.trim());
    return {
      mode: nextMode,
      type,
      host: host.trim() || null,
      port:
        Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535
          ? parsedPort
          : null,
      username: username.trim() || null,
    };
  }

  function save(patch: PreProxyPatch, message: string) {
    setTestResult(null);
    updateSettingsMutation.mutate(
      { preProxy: patch },
      {
        onSuccess: () => {
          setPassword('');
          toast.success(message);
        },
      },
    );
  }

  function changeMode(value: string) {
    const nextMode = value as PreProxyMode;
    setMode(nextMode);
    // Manual mode is saved with the form so a half-filled address never
    // becomes active.
    if (nextMode !== 'manual') {
      save(basePatch(nextMode), '前置代理已更新');
    }
  }

  function saveManual() {
    const patch = basePatch('manual');
    if (!patch.host || !patch.port) {
      toast.error('请填写前置代理地址和 1-65535 的端口');
      return;
    }
    if (password) {
      patch.password = password;
    }
    save(patch, '前置代理已保存');
  }

  function clearPassword() {
    save({ ...basePatch(preProxy.mode), password: null }, '密码已清除');
  }

  function runTest() {
    setTestResult(null);
    testMutation.mutate(undefined, { onSuccess: setTestResult });
  }

  const manualDirty =
    mode === 'manual' &&
    (preProxy.mode !== 'manual' ||
      type !== preProxy.type ||
      host.trim() !== (preProxy.host ?? '') ||
      port.trim() !== (preProxy.port ? String(preProxy.port) : '') ||
      username.trim() !== (preProxy.username ?? '') ||
      password.length > 0);
  const systemProxy = systemProxyQuery.data;

  return (
    <FieldGroup className="gap-3">
      <section>
        <h3 className="mb-1 text-xs font-medium">连接方式</h3>
        <p className="text-muted-foreground mb-2 text-[12px] leading-relaxed font-normal">
          环境代理和直连环境都会先经过前置代理再连出去。在需要翻墙才能访问代理的网络里，用它代替
          TUN 模式。本机和局域网地址不经过前置代理。
        </p>

        <RadioGroup
          className="bg-card divide-border gap-0 divide-y overflow-hidden rounded-sm border"
          value={mode}
          onValueChange={changeMode}
          disabled={updateSettingsMutation.isPending}
        >
          {MODE_CHOICES.map((choice) => (
            <label
              key={choice.value}
              htmlFor={`pre-proxy-${choice.value}`}
              className="hover:bg-muted/50 grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-0.5 px-3 py-2 transition-colors"
            >
              <RadioGroupItem
                id={`pre-proxy-${choice.value}`}
                value={choice.value}
                className="data-checked:border-foreground data-checked:bg-foreground dark:data-checked:bg-foreground row-span-2"
              />
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="text-foreground text-[13px] font-medium">
                  {choice.title}
                </span>
                {choice.recommended ? (
                  <Badge
                    variant="outline"
                    className="bg-foreground/10 text-foreground h-auto border-transparent px-1.5 py-0.5 text-[11px] font-medium"
                  >
                    推荐
                  </Badge>
                ) : null}
              </span>
              <span className="text-muted-foreground col-start-2 text-xs leading-relaxed font-normal">
                {choice.description}
              </span>
            </label>
          ))}
        </RadioGroup>
      </section>

      {mode === 'system' ? (
        <SettingsGroup title="系统代理">
          <SettingsRow
            label={
              systemProxy?.proxy
                ? `${systemProxy.proxy.type === 'socks5' ? 'SOCKS5' : 'HTTP'} ${formatAddress(systemProxy.proxy.host, systemProxy.proxy.port)}`
                : '未检测到'
            }
            description={
              systemProxyQuery.isFetching
                ? '检测中...'
                : (systemProxy?.message ?? '读取操作系统的代理设置')
            }
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-[12px] font-medium"
              disabled={systemProxyQuery.isFetching}
              onClick={() => void systemProxyQuery.refetch()}
            >
              重新检测
            </Button>
          </SettingsRow>
        </SettingsGroup>
      ) : null}

      {mode === 'manual' ? (
        <SettingsGroup title="代理服务器">
          <SettingsRow
            label="协议"
            htmlFor="pre-proxy-type"
            description="本机代理软件的混合端口两种都支持"
          >
            <Select
              value={type}
              onValueChange={(value) => setType(value as PreProxyType)}
            >
              <SelectTrigger
                id="pre-proxy-type"
                className="h-7 w-full text-[12px] font-normal @md/field-group:w-36"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  <SelectItem value="socks5">SOCKS5</SelectItem>
                  <SelectItem value="http">HTTP</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow
            label="地址"
            htmlFor="pre-proxy-host"
            description="例如 127.0.0.1 端口 7890"
          >
            <div className="flex w-full shrink-0 gap-1.5 @md/field-group:w-56">
              <Input
                id="pre-proxy-host"
                value={host}
                placeholder="127.0.0.1"
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setHost(event.target.value)}
                className="h-7 min-w-0 flex-1 font-mono text-[12px] font-normal md:text-[12px]"
              />
              <Input
                aria-label="端口"
                value={port}
                placeholder="7890"
                inputMode="numeric"
                onChange={(event) => setPort(event.target.value)}
                className="h-7 w-16 shrink-0 text-center font-mono text-[12px] font-normal md:text-[12px]"
              />
            </div>
          </SettingsRow>
          <SettingsDivider />
          <SettingsRow
            label="认证"
            htmlFor="pre-proxy-username"
            description={
              preProxy.hasPassword
                ? '密码已保存在系统钥匙串，留空表示不修改'
                : '可选；密码保存在系统钥匙串'
            }
          >
            <div className="flex w-full shrink-0 gap-1.5 @md/field-group:w-56">
              <Input
                id="pre-proxy-username"
                value={username}
                placeholder="用户名"
                autoComplete="off"
                onChange={(event) => setUsername(event.target.value)}
                className="h-7 min-w-0 flex-1 text-[12px] font-normal md:text-[12px]"
              />
              <Input
                aria-label="密码"
                type="password"
                value={password}
                placeholder={preProxy.hasPassword ? '••••••' : '密码'}
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
                className="h-7 min-w-0 flex-1 text-[12px] font-normal md:text-[12px]"
              />
            </div>
          </SettingsRow>
          <SettingsDivider />
          <div className="flex items-center justify-end gap-2 px-3 py-2">
            {preProxy.hasPassword ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-[12px] font-medium"
                disabled={updateSettingsMutation.isPending}
                onClick={clearPassword}
              >
                清除密码
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              className="h-7 px-2.5 text-[12px] font-medium"
              disabled={!manualDirty || updateSettingsMutation.isPending}
              onClick={saveManual}
            >
              {updateSettingsMutation.isPending ? '保存中' : '保存'}
            </Button>
          </div>
        </SettingsGroup>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldDescription className="min-w-0 flex-1 text-[12px] leading-relaxed font-normal">
          {testResult ? (
            <span
              className={testResult.success ? undefined : 'text-destructive'}
            >
              {testResult.message}
              {testResult.latencyMs !== null
                ? ` · ${testResult.latencyMs} ms`
                : ''}
            </span>
          ) : (
            '固定服务器和 PAC 类型的环境代理由浏览器直接连接，不经过前置代理。'
          )}
        </FieldDescription>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-[12px] font-medium"
          disabled={
            preProxy.mode === 'off' || manualDirty || testMutation.isPending
          }
          onClick={runTest}
        >
          {testMutation.isPending ? '测试中' : '测试连接'}
        </Button>
      </div>
    </FieldGroup>
  );
}

function formatAddress(host: string, port: number) {
  return host.includes(':') ? `[${host}]:${port}` : `${host}:${port}`;
}
