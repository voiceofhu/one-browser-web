import { FieldGroup } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import type { AppSettings } from '@/features/browser/contracts';
import {
  CheckmarkCircle02Icon,
  ChromeIcon,
  DatabaseIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { CHROMIUM_PATH_PLACEHOLDER } from '../status/chromium-display';
import {
  useUpdateSettingsMutation,
  useValidateChromiumPathMutation,
} from './queries';
import {
  SettingsDivider,
  SettingsFormRow,
  SettingsGroup,
} from './settings-group';

export function BrowserRuntimeSettings({
  settings,
}: {
  settings: AppSettings;
}) {
  const updateSettingsMutation = useUpdateSettingsMutation();
  const validateChromiumPathMutation = useValidateChromiumPathMutation();
  const [chromiumPath, setChromiumPath] = useState(settings.chromiumPath ?? '');
  const [profileRoot, setProfileRoot] = useState(settings.profileRoot);
  const [defaultStartUrl, setDefaultStartUrl] = useState(
    settings.defaultStartUrl,
  );
  const chromiumStatus = validateChromiumPathMutation.data;

  function updateSettings(patch: Partial<AppSettings>) {
    updateSettingsMutation.mutate(patch);
  }

  function saveChromiumPath() {
    const nextChromiumPath = chromiumPath.trim() || null;
    if (nextChromiumPath !== settings.chromiumPath) {
      updateSettings({ chromiumPath: nextChromiumPath });
    }
  }

  function saveProfileRoot() {
    if (profileRoot !== settings.profileRoot) {
      updateSettings({ profileRoot });
    }
  }

  function saveDefaultStartUrl() {
    if (defaultStartUrl !== settings.defaultStartUrl) {
      updateSettings({ defaultStartUrl });
    }
  }

  function blurOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }

  function validatePath() {
    validateChromiumPathMutation.mutate(
      { chromiumPath: chromiumPath.trim() || null },
      {
        onSuccess: (result) => {
          toast[result.executable ? 'success' : 'error'](result.message);
        },
      },
    );
  }

  return (
    <FieldGroup className="gap-5">
      <SettingsGroup title="浏览器运行时">
        <SettingsFormRow
          label="Chrome 路径"
          htmlFor="chromium-path"
          description={
            chromiumStatus?.message ??
            '留空时使用应用自动下载的 Chromium；下载路径不保存到设置。'
          }
        >
          <InputGroup className="h-7">
            <InputGroupAddon>
              <HugeiconsIcon icon={ChromeIcon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              id="chromium-path"
              value={chromiumPath}
              onChange={(event) => setChromiumPath(event.target.value)}
              onBlur={saveChromiumPath}
              onKeyDown={blurOnEnter}
              placeholder={CHROMIUM_PATH_PLACEHOLDER}
              className="text-[12px] font-normal md:text-[12px]"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="outline"
                className="text-[12px] font-medium"
                onClick={validatePath}
                disabled={validateChromiumPathMutation.isPending}
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                校验
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </SettingsFormRow>

        <SettingsDivider />

        <SettingsFormRow
          label="默认启动页"
          htmlFor="default-start-url"
          description="环境首次启动且未设置启动标签页时会打开这里。"
        >
          <InputGroup className="h-7">
            <InputGroupAddon>
              <InputGroupText>URL</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="default-start-url"
              value={defaultStartUrl}
              onChange={(event) => setDefaultStartUrl(event.target.value)}
              onBlur={saveDefaultStartUrl}
              onKeyDown={blurOnEnter}
              placeholder="https://ip.huzhihui.com/"
              className="font-mono text-[12px] font-normal md:text-[12px]"
            />
          </InputGroup>
        </SettingsFormRow>
      </SettingsGroup>

      <SettingsGroup title="环境存储">
        <SettingsFormRow
          label="环境根目录"
          htmlFor="profile-root"
          description="浏览器环境、缓存和运行数据都会放在这个目录下。"
        >
          <InputGroup className="h-7">
            <InputGroupAddon>
              <HugeiconsIcon icon={DatabaseIcon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              id="profile-root"
              value={profileRoot}
              onChange={(event) => setProfileRoot(event.target.value)}
              onBlur={saveProfileRoot}
              onKeyDown={blurOnEnter}
              className="font-mono text-[12px] font-normal md:text-[12px]"
            />
          </InputGroup>
        </SettingsFormRow>
      </SettingsGroup>
    </FieldGroup>
  );
}
