import { FieldGroup } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import type { AppSettings } from '@/features/browser/contracts';
import { desktopInvoke } from '@/lib/desktop';
import {
  CheckmarkCircle02Icon,
  ChromeIcon,
  DatabaseIcon,
  Folder01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { CHROMIUM_PATH_PLACEHOLDER } from '../status/chromium-display';
import {
  useUpdateSettingsMutation,
  useValidateChromiumPathMutation,
} from './queries';
import { SettingsFormRow, SettingsGroup } from './settings-group';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function BrowserRuntimeSettings({
  settings,
}: {
  settings: AppSettings;
}) {
  const updateSettingsMutation = useUpdateSettingsMutation();
  const validateChromiumPathMutation = useValidateChromiumPathMutation();
  const [chromiumPath, setChromiumPath] = useState(settings.chromiumPath ?? '');
  const [pickingRoot, setPickingRoot] = useState(false);
  const chromiumStatus = validateChromiumPathMutation.data;

  function saveChromiumPath() {
    const nextChromiumPath = chromiumPath.trim() || null;
    if (nextChromiumPath !== settings.chromiumPath) {
      updateSettingsMutation.mutate({ chromiumPath: nextChromiumPath });
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

  async function openProfileRoot() {
    try {
      await desktopInvoke('open_path', {
        request: { path: settings.profileRoot },
      });
    } catch (error) {
      toast.error(errorMessage(error, '打开目录失败'));
    }
  }

  async function pickProfileRoot() {
    if (pickingRoot) return;
    setPickingRoot(true);
    try {
      const picked = await desktopInvoke<string | null>('pick_profile_root');
      if (picked && picked !== settings.profileRoot) {
        updateSettingsMutation.mutate({ profileRoot: picked });
      }
    } catch (error) {
      toast.error(errorMessage(error, '选择目录失败，请更新桌面客户端后再试'));
    } finally {
      setPickingRoot(false);
    }
  }

  return (
    <FieldGroup className="gap-3">
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
      </SettingsGroup>

      <SettingsGroup title="环境存储">
        <SettingsFormRow
          label="环境根目录"
          htmlFor="profile-root"
          description="浏览器环境、缓存和运行数据都会放在这个目录下。更换后，已有环境的数据留在原目录，不会自动迁移。"
        >
          <InputGroup className="h-7">
            <InputGroupAddon>
              <HugeiconsIcon icon={DatabaseIcon} strokeWidth={2} />
            </InputGroupAddon>
            <button
              id="profile-root"
              type="button"
              title={`打开目录：${settings.profileRoot}`}
              onClick={() => void openProfileRoot()}
              className="min-w-0 flex-1 cursor-pointer truncate px-2 text-left font-mono text-[12px] underline-offset-2 outline-none hover:underline focus-visible:underline"
            >
              {settings.profileRoot}
            </button>
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="outline"
                className="text-[12px] font-medium"
                onClick={() => void pickProfileRoot()}
                disabled={pickingRoot || updateSettingsMutation.isPending}
              >
                <HugeiconsIcon
                  icon={Folder01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                选择…
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </SettingsFormRow>
      </SettingsGroup>
    </FieldGroup>
  );
}
