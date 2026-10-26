import type {
  AppSettings,
  ChromiumPathStatus,
  PreProxyTestResult,
  SystemProxyStatus,
  UpdateSettingsRequest,
  ValidateChromiumPathRequest,
} from '@/features/browser/contracts';
import { desktopInvoke } from '@/lib/desktop';

export function getSettings() {
  return desktopInvoke<AppSettings>('get_settings');
}

export function updateSettings(patch: UpdateSettingsRequest) {
  return desktopInvoke<AppSettings>('update_settings', { patch });
}

export function validateChromiumPath(
  request: ValidateChromiumPathRequest = {},
) {
  return desktopInvoke<ChromiumPathStatus>('validate_chromium_path', {
    request,
  });
}

export function detectSystemProxy() {
  return desktopInvoke<SystemProxyStatus>('detect_system_proxy');
}

export function testPreProxy() {
  return desktopInvoke<PreProxyTestResult>('test_pre_proxy');
}
