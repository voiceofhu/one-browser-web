import type { AppErrorPayload } from '@/features/browser/contracts';

export type DesktopCommand =
  | 'get_app_release_identity'
  | 'get_app_status'
  | 'get_notification_permission'
  | 'request_notification_permission'
  | 'send_system_notification'
  | 'open_notification_settings'
  | 'animate_app_window'
  | 'open_app_data_dir'
  | 'open_external_url'
  | 'begin_desktop_auth'
  | 'read_desktop_auth_session'
  | 'refresh_desktop_auth_session'
  | 'clear_desktop_auth_session'
  | 'open_path'
  | 'write_clipboard_text'
  | 'complete_remote_environment_exit_sync'
  | 'open_system_log'
  | 'get_settings'
  | 'update_settings'
  | 'detect_system_proxy'
  | 'test_pre_proxy'
  | 'probe_egress_lines'
  | 'sync_tray_egress_lines'
  | 'validate_chromium_path'
  | 'get_chromium_download_target'
  | 'download_chromium'
  | 'install_chromium'
  | 'list_profiles'
  | 'get_profile'
  | 'create_profile'
  | 'update_profile'
  | 'delete_profiles'
  | 'list_proxies'
  | 'get_proxy'
  | 'create_proxy'
  | 'update_proxy'
  | 'delete_proxies'
  | 'check_proxy'
  | 'update_profile_proxy'
  | 'refresh_profile_ip'
  | 'get_profile_proxy_status'
  | 'delete_profile_cache'
  | 'list_runtime'
  | 'open_profile'
  | 'close_profile'
  | 'close_all_profiles'
  | 'update_tunnel_route'
  | 'get_tunnel_renewal_credential';

export type DesktopCommandArgs = Record<string, unknown>;

export interface DesktopInvokeOptions {
  mock?: boolean;
}

export class DesktopApiError extends Error {
  code?: number;
  details?: Record<string, unknown>;

  constructor(message: string, payload?: Partial<AppErrorPayload>) {
    super(message);
    this.name = 'DesktopApiError';
    this.code = payload?.code;
    this.details = payload?.details;
  }
}
