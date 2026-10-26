import { DialogActionButton } from '@/components/ui/dialog-action-button';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveDialogClose,
  ResponsiveDialogFooter,
} from '@/components/responsive-dialog';
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
import { resolveErrorState } from '@/views/error/error-state';
import { type ReactNode, useState } from 'react';

import { AdvancedSettings } from './advanced-settings';
import { AppearanceSettings } from './appearance-settings';
import { BrowserRuntimeSettings } from './browser-runtime-settings';
import { DefaultEgressSettings } from './default-egress-settings';
import { LocalApiSettings } from './local-api-settings';
import { PreProxySettings } from './pre-proxy-settings';
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
      <ResponsiveDialogContent className="h-[min(88dvh,560px)] max-h-[min(88dvh,560px)] sm:max-w-[min(90vw,768px)] [&_[data-slot=dialog-close]]:right-2 [&_[data-slot=dialog-close]]:top-2">
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
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 lg:p-3">
      <div className="min-h-0 flex-1 overflow-hidden rounded-sm border bg-card">
        <SettingsPanel />
      </div>
    </section>
  );
}

function SettingsPanel() {
  const settingsQuery = useSettingsQuery();
  const [section, setSection] = useState<SettingsSectionId>('general');

  if (settingsQuery.isError && !settingsQuery.data) {
    const state = resolveErrorState(settingsQuery.error);

    return (
      <Empty className="h-full gap-3 rounded-none px-4 py-6" role="alert">
        <EmptyHeader className="gap-1.5">
          <span className="text-muted-foreground font-mono text-[11px]">{state.code}</span>
          <EmptyTitle>设置：{state.title}</EmptyTitle>
          <EmptyDescription>{state.description}</EmptyDescription>
          <p className="text-muted-foreground text-xs">{state.hint}</p>
        </EmptyHeader>
        <EmptyContent className="flex-row flex-wrap justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={settingsQuery.isFetching}
            onClick={() => void settingsQuery.refetch()}
          >
            {settingsQuery.isFetching ? '重试中' : '重新加载'}
          </Button>
          <CopyButton
            size="sm"
            variant="ghost"
            text={`${state.code}\n${state.title}\n${state.description}`}
          >
            复制错误
          </CopyButton>
        </EmptyContent>
      </Empty>
    );
  }

  if (!settingsQuery.data) {
    return (
      <div role="status" aria-label="设置加载中" className="h-full overflow-hidden p-3 md:p-4">
        <span className="sr-only">设置加载中...</span>
        <Skeleton className="mb-4 h-4 w-20 rounded-sm" />
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-3 rounded-sm border p-3">
              <Skeleton className="h-3 w-24 rounded-sm" />
              <Skeleton className="h-3 w-2/3 max-w-72 rounded-sm" />
              <Skeleton className="h-7 w-full rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    );
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
    case 'pre-proxy':
      return (
        <PreProxySettings
          key={JSON.stringify(settings.preProxy)}
          settings={settings}
        />
      );
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
