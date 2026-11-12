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
import { AccountInvitePage } from '@/features/account/profile/invite-page';
import { AccountProfilePage } from '@/features/account/profile/page';
import type { AppSettings } from '@/features/browser/contracts';
import { isTauriRuntime } from '@/lib/desktop';
import {
  isSettingsWindow,
  useSettingsWindowNavigation,
} from '@/lib/desktop/settings-window';
import { resolveErrorState } from '@/views/error/error-state';
import { type ReactNode, useCallback } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AccountSecuritySettings } from './account-security-settings';
import { AdvancedSettings } from './advanced-settings';
import { AppearanceSettings } from './appearance-settings';
import { BrowserRuntimeSettings } from './browser-runtime-settings';
import { DesktopClientSettings } from './desktop-client-settings';
import { LocalApiSettings } from './local-api-settings';
import { PreProxySettings } from './pre-proxy-settings';
import { useSettingsQuery } from './queries';
import {
  type SettingsSectionId,
  defaultSettingsSection,
  getSettingsNavGroups,
  resolveSettingsSection,
  settingsPath,
} from './settings-sections';
import { SettingsWorkspace } from './settings-workspace';

/** `/settings/:section` — account, app and (in the App) device settings. */
export function SettingsPage() {
  const params = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const isDesktop = isTauriRuntime();
  const section = resolveSettingsSection(params.section, isDesktop);
  // Invalid ids fall through to the redirect below.
  useSettingsWindowNavigation(
    useCallback(
      (target: string) => navigate(`/settings/${target}`),
      [navigate],
    ),
  );

  if (!section) {
    return (
      <Navigate to={settingsPath(defaultSettingsSection(isDesktop))} replace />
    );
  }
  if (section.id !== params.section) {
    return <Navigate to={settingsPath(section.id)} replace />;
  }

  if (isSettingsWindow()) {
    return (
      <SettingsWorkspace
        groups={getSettingsNavGroups(isDesktop)}
        section={section}
        inWindow
      >
        <SettingsSectionContent section={section.id} />
      </SettingsWorkspace>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 lg:p-3">
      <div className="bg-card min-h-0 flex-1 overflow-hidden rounded-sm border">
        <SettingsWorkspace
          groups={getSettingsNavGroups(isDesktop)}
          section={section}
        >
          <SettingsSectionContent section={section.id} />
        </SettingsWorkspace>
      </div>
    </section>
  );
}

function SettingsSectionContent({ section }: { section: SettingsSectionId }) {
  switch (section) {
    case 'profile':
      return <AccountProfilePage />;
    case 'security':
      return <AccountSecuritySettings />;
    case 'invite':
      return <AccountInvitePage />;
    case 'appearance':
      return <AppearanceSettings />;
    case 'desktop':
      return <DesktopClientSettings />;
    case 'client':
      return <AdvancedSettings />;
    case 'browser':
      return (
        <DeviceSettings>
          {(settings) => (
            <BrowserRuntimeSettings
              key={`${settings.chromiumPath ?? ''}:${settings.profileRoot}`}
              settings={settings}
            />
          )}
        </DeviceSettings>
      );
    case 'pre-proxy':
      return (
        <DeviceSettings>
          {(settings) =>
            settings.preProxy ? (
              <PreProxySettings
                key={JSON.stringify(settings.preProxy)}
                preProxy={settings.preProxy}
              />
            ) : (
              <Empty className="gap-3 rounded-lg border px-4 py-10">
                <EmptyHeader className="gap-1.5">
                  <EmptyTitle>当前客户端不支持前置代理</EmptyTitle>
                  <EmptyDescription>
                    请在「更新与诊断」中检查更新，安装新版本后即可设置前置代理。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )
          }
        </DeviceSettings>
      );
    case 'local-api':
      return (
        <DeviceSettings>
          {(settings) => (
            <LocalApiSettings
              key={`${settings.apiEnabled}:${settings.apiPort}`}
              settings={settings}
            />
          )}
        </DeviceSettings>
      );
  }
}

/** Loads the App's local settings file for the sections that edit it. */
function DeviceSettings({
  children,
}: {
  children: (settings: AppSettings) => ReactNode;
}) {
  const settingsQuery = useSettingsQuery();

  if (settingsQuery.isError && !settingsQuery.data) {
    const state = resolveErrorState(settingsQuery.error);

    return (
      <Empty className="gap-3 rounded-lg border px-4 py-10" role="alert">
        <EmptyHeader className="gap-1.5">
          <span className="text-muted-foreground font-mono text-[11px]">
            {state.code}
          </span>
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
      <div role="status" aria-label="设置加载中" className="space-y-3">
        <span className="sr-only">设置加载中...</span>
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border p-3"
            aria-hidden="true"
          >
            <Skeleton className="h-3 w-24 rounded-sm" />
            <Skeleton className="h-3 w-2/3 max-w-72 rounded-sm" />
            <Skeleton className="h-7 w-full rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  return children(settingsQuery.data);
}
