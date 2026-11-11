import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { AppDownloadCard } from '@/features/app-download/download-card';
import { launchDesktopApp } from '@/lib/desktop/app-gate';
import { useState } from 'react';

import { SettingsDivider, SettingsGroup, SettingsRow } from './settings-group';

const appOnlySettings = [
  {
    label: '浏览器',
    description: '本机 Chromium、默认启动页和环境数据的存放位置',
  },
  {
    label: '前置代理',
    description: '本机连接环境代理之前先经过的网络出口',
  },
  {
    label: '本地 API',
    description: '供本机自动化脚本和 SDK 调用的接口',
  },
  {
    label: '更新与诊断',
    description: '客户端版本、系统通知和日志',
  },
];

/**
 * The web page's stand-in for the App-only settings: it says what lives in the
 * App and offers the two ways there, instead of controls that cannot work here.
 */
export function DesktopClientSettings() {
  const [opening, setOpening] = useState(false);

  async function openApp() {
    setOpening(true);
    try {
      await launchDesktopApp();
    } finally {
      setOpening(false);
    }
  }

  return (
    <FieldGroup className="gap-3">
      <SettingsGroup title="打开客户端">
        <SettingsRow
          label="在 One Browser App 中继续"
          description="用当前账号直接登录桌面客户端，不需要再输一次密码"
        >
          <Button
            type="button"
            size="sm"
            className="min-w-24 px-2.5 text-[12px] font-medium"
            disabled={opening}
            onClick={() => void openApp()}
          >
            <img src="/pwa-512x512.png" alt="" className="size-4 rounded-sm" />
            {opening ? '正在打开' : '打开 App'}
          </Button>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title="只能在客户端修改的设置"
        description="这些设置直接作用于你电脑上的浏览器、网络和系统，网页无法读取或修改。"
      >
        {appOnlySettings.map((item, index) => (
          <div key={item.label}>
            {index > 0 ? <SettingsDivider /> : null}
            <SettingsRow label={item.label} description={item.description}>
              <Badge
                variant="outline"
                className="text-muted-foreground h-auto px-1.5 py-0.5 text-[11px] font-medium"
              >
                仅 App
              </Badge>
            </SettingsRow>
          </div>
        ))}
      </SettingsGroup>

      <AppDownloadCard className="rounded-lg shadow-none" />
    </FieldGroup>
  );
}
