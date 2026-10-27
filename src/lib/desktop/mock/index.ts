import type {
  CheckProxyRequest,
  DeleteProfileCacheResult,
  UpdateSettingsRequest,
} from '@/features/browser/contracts';
import {
  mockAppReleaseIdentity,
  mockAppStatus,
  mockChromiumDownloadTarget,
  mockChromiumPath,
  mockDownloadStart,
  mockInstallChromium,
  mockPage,
  mockResult,
} from '@/lib/desktop/mock/app';
import {
  mockCreateProfile,
  mockDeleteProfiles,
  mockUpdateProfile,
  toProfileListItem,
} from '@/lib/desktop/mock/profiles';
import {
  mockCheckProxy,
  mockCreateProxy,
  mockDeleteProxies,
  mockUpdateProxy,
  toProxyListItem,
} from '@/lib/desktop/mock/proxies';
import {
  mockCloseAllProfiles,
  mockCloseProfile,
  mockOpenProfile,
  mockProfileProxyStatus,
  mockRefreshIp,
  mockUpdateProfileProxy,
  mockUpdateRemoteLease,
} from '@/lib/desktop/mock/runtime';
import {
  mockProfiles,
  mockProxies,
  mockRuntime,
  mockSettings,
} from '@/lib/desktop/mock/state';
import { mustGet, toStringList } from '@/lib/desktop/mock/values';
import type { DesktopCommand, DesktopCommandArgs } from '@/lib/desktop/types';

export function invokeMockCommand<T>(
  command: DesktopCommand,
  args?: DesktopCommandArgs,
): Promise<T> {
  const request = args?.request as Record<string, unknown> | undefined;
  const patch = args?.patch as UpdateSettingsRequest | undefined;

  switch (command) {
    case 'get_notification_permission':
    case 'request_notification_permission':
    case 'send_system_notification':
    case 'open_notification_settings':
      return Promise.reject(new Error('系统通知需要 One Browser 桌面客户端'));
    case 'get_app_release_identity':
      return mockResult<T>(mockAppReleaseIdentity());
    case 'get_app_status':
      return mockResult<T>(mockAppStatus());
    case 'animate_app_window':
    case 'open_app_data_dir':
    case 'open_path':
    case 'write_clipboard_text':
    case 'complete_remote_environment_exit_sync':
    case 'open_system_log':
      return mockResult<T>(undefined);
    case 'open_external_url':
      if (typeof request?.url === 'string' && typeof window !== 'undefined') {
        window.open(request.url, '_blank', 'noopener,noreferrer');
      }
      return mockResult<T>(undefined);
    case 'begin_desktop_auth':
      return mockResult<T>({
        url: String(request?.loginUrl || ''),
        expiresIn: 600,
      });
    case 'read_desktop_auth_session':
      return mockResult<T>(null);
    case 'refresh_desktop_auth_session':
      return Promise.reject(
        new Error('Mock desktop auth session is unavailable'),
      );
    case 'clear_desktop_auth_session':
      return mockResult<T>(undefined);
    case 'get_settings':
      return mockResult<T>(mockSettings);
    case 'update_settings': {
      const { preProxy, ...rest } = patch ?? {};
      Object.assign(mockSettings, rest);
      if (preProxy) {
        const { password, ...settings } = preProxy;
        mockSettings.preProxy = {
          ...settings,
          hasPassword:
            password === undefined
              ? Boolean(mockSettings.preProxy?.hasPassword)
              : Boolean(password),
        };
      }
      return mockResult<T>(mockSettings);
    }
    case 'detect_system_proxy':
      return mockResult<T>({
        proxy: { type: 'http', host: '127.0.0.1', port: 7890 },
        source: 'mock',
        message: '检测到系统代理 127.0.0.1:7890',
      });
    case 'test_pre_proxy':
      return mockResult<T>({
        success: mockSettings.preProxy?.mode !== 'off',
        route: mockSettings.preProxy?.mode,
        via: null,
        latencyMs: mockSettings.preProxy?.mode === 'off' ? null : 120,
        message:
          mockSettings.preProxy?.mode === 'off'
            ? '当前为直连模式，未使用前置代理'
            : '已通过前置代理访问外网',
      });
    case 'validate_chromium_path':
      return mockResult<T>(mockChromiumPath(request?.chromiumPath));
    case 'get_chromium_download_target':
      return mockResult<T>(mockChromiumDownloadTarget());
    case 'download_chromium':
      return mockResult<T>(mockDownloadStart());
    case 'install_chromium':
      return mockResult<T>(mockInstallChromium(request));
    case 'list_profiles':
      return mockResult<T>(
        mockPage([...mockProfiles.values()].map(toProfileListItem)),
      );
    case 'get_profile':
      return mockResult<T>(
        mustGet(mockProfiles, request?.profileId, 'profile'),
      );
    case 'create_profile':
      return mockResult<T>(mockCreateProfile(request));
    case 'update_profile':
      return mockResult<T>(mockUpdateProfile(request));
    case 'delete_profiles':
      return mockResult<T>(mockDeleteProfiles(request));
    case 'list_proxies':
      return mockResult<T>(
        mockPage([...mockProxies.values()].map(toProxyListItem)),
      );
    case 'get_proxy':
      return mockResult<T>(mustGet(mockProxies, request?.proxyId, 'proxy'));
    case 'create_proxy':
      return mockResult<T>(mockCreateProxy(request));
    case 'update_proxy':
      return mockResult<T>(mockUpdateProxy(request));
    case 'delete_proxies':
      return mockResult<T>(mockDeleteProxies(request));
    case 'check_proxy':
      return mockCheckProxy<T>(
        request as Partial<CheckProxyRequest> | undefined,
      );
    case 'update_profile_proxy':
      return mockResult<T>(mockUpdateProfileProxy(request));
    case 'refresh_profile_ip':
      return mockResult<T>(mockRefreshIp(request));
    case 'get_profile_proxy_status':
      return mockResult<T>(mockProfileProxyStatus(request));
    case 'delete_profile_cache':
      return mockResult<T>({
        profileIds: toStringList(request?.profileIds),
        removedPaths: [],
      } satisfies DeleteProfileCacheResult);
    case 'list_runtime':
      return mockResult<T>([...mockRuntime.values()]);
    case 'open_profile':
      return mockResult<T>(mockOpenProfile(request));
    case 'close_profile':
      return mockResult<T>(mockCloseProfile(request));
    case 'close_all_profiles':
      return mockResult<T>(mockCloseAllProfiles());
    case 'complete_dev_login':
    case 'sync_tray_environments':
      return mockResult<T>(undefined);
    case 'update_remote_lease':
      return mockResult<T>(mockUpdateRemoteLease(request));
  }
}
