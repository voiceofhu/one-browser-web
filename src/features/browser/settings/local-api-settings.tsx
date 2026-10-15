import { Badge } from '@/components/ui/badge';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { AppSettings } from '@/features/browser/contracts';
import { useState } from 'react';
import { toast } from 'sonner';

import { useUpdateSettingsMutation } from './queries';
import { SettingsDivider, SettingsGroup, SettingsRow } from './settings-group';

export function LocalApiSettings({ settings }: { settings: AppSettings }) {
  const updateSettingsMutation = useUpdateSettingsMutation();
  const [apiEnabled, setApiEnabled] = useState(settings.apiEnabled);
  const [apiPort, setApiPort] = useState(String(settings.apiPort));
  const displayApiPort = apiPort.trim() || String(settings.apiPort || 27523);
  const endpoint = `127.0.0.1:${displayApiPort}`;

  function saveApiEnabled(enabled: boolean) {
    setApiEnabled(enabled);
    updateSettingsMutation.mutate({ apiEnabled: enabled });
  }

  function saveApiPort() {
    const parsedPort = Number(apiPort.trim());
    if (
      !Number.isInteger(parsedPort) ||
      parsedPort <= 0 ||
      parsedPort > 65535
    ) {
      setApiPort(String(settings.apiPort || 27523));
      toast.error('端口需要是 1-65535 的整数');
      return;
    }

    if (parsedPort !== settings.apiPort) {
      updateSettingsMutation.mutate({
        apiHost: '127.0.0.1',
        apiPort: parsedPort,
      });
    }
  }

  return (
    <FieldGroup className="gap-3">
      <SettingsGroup title="服务">
        <SettingsRow
          label="启用服务"
          htmlFor="local-api"
          description="为本机自动化工具提供受限接口，不向局域网或公网暴露"
        >
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant={apiEnabled ? 'success' : 'outline'}
              className="h-auto px-1.5 py-0.5 text-[11px] font-medium"
            >
              {apiEnabled ? '开启' : '关闭'}
            </Badge>
            <Switch
              id="local-api"
              checked={apiEnabled}
              disabled={updateSettingsMutation.isPending}
              onCheckedChange={saveApiEnabled}
            />
          </div>
        </SettingsRow>

        {apiEnabled ? (
          <>
            <SettingsDivider />
            <SettingsRow
              label="API 端口"
              htmlFor="api-port"
              description={`固定监听 ${endpoint}，仅当前机器可访问`}
            >
              <Input
                id="api-port"
                value={apiPort}
                inputMode="numeric"
                onChange={(event) => setApiPort(event.target.value)}
                onBlur={saveApiPort}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur();
                  }
                }}
                className="h-7 w-full max-w-20 shrink-0 text-center font-mono text-[12px] font-normal md:text-[12px]"
              />
            </SettingsRow>
          </>
        ) : null}
      </SettingsGroup>
    </FieldGroup>
  );
}
