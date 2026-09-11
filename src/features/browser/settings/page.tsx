import { DialogActionButton } from '@/components/ui/dialog-action-button';
import {
  ResponsiveDialogClose,
  ResponsiveDialogFooter,
} from '@/components/responsive-dialog';
import { LoadingState } from '@/components/loading-state';
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/responsive-dialog';
import type { AppSettings } from '@/features/browser/contracts';
import { type ReactNode, useState } from 'react';

import { AdvancedSettings } from './advanced-settings';
import { AppearanceSettings } from './appearance-settings';
import { BrowserRuntimeSettings } from './browser-runtime-settings';
import { DefaultEgressSettings } from './default-egress-settings';
import { LocalApiSettings } from './local-api-settings';
import { useSettingsQuery } from './queries';
import {
  type SettingsSectionId,
  SettingsWorkspace,
} from './settings-workspace';

export function SettingsDialog({
  onOpenChange,
  open,
  trigger,
}: {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger?: ReactNode;
}) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      ) : null}
      <ResponsiveDialogContent className="h-[min(88dvh,560px)] max-h-[min(88dvh,560px)] sm:max-w-[min(90vw,768px)] [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:top-3">
        <ResponsiveDialogHeader className="sr-only">
          <ResponsiveDialogTitle>设置</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            配置浏览器、线路、外观、本地 API 和客户端操作。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="overflow-hidden p-0">
          <SettingsPanel />
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <DialogActionButton action="cancel" type="button">
              关闭
            </DialogActionButton>
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function SettingsPage() {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 lg:p-4">
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
        <SettingsPanel />
      </div>
    </section>
  );
}

function SettingsPanel() {
  const settingsQuery = useSettingsQuery();
  const [section, setSection] = useState<SettingsSectionId>('general');

  if (!settingsQuery.data) {
    return <LoadingState label="设置加载中..." />;
  }

  return (
    <SettingsWorkspace section={section} onSectionChange={setSection}>
      <SettingsSection section={section} settings={settingsQuery.data} />
    </SettingsWorkspace>
  );
}

function SettingsSection({
  section,
  settings,
}: {
  section: SettingsSectionId;
  settings: AppSettings;
}) {
  switch (section) {
    case 'general':
      return (
        <BrowserRuntimeSettings
          key={`${settings.chromiumPath ?? ''}:${settings.defaultStartUrl}:${settings.profileRoot}`}
          settings={settings}
        />
      );
    case 'egress':
      return <DefaultEgressSettings settings={settings} />;
    case 'appearance':
      return <AppearanceSettings />;
    case 'local-api':
      return (
        <LocalApiSettings
          key={`${settings.apiEnabled}:${settings.apiPort}`}
          settings={settings}
        />
      );
    case 'client':
      return <AdvancedSettings />;
  }
}
