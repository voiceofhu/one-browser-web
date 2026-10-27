import type {
  CloseAllProfilesResult,
  CloseProfileRequest,
  CloseProfileResult,
  OpenProfileRequest,
  RuntimeProfile,
  UpdateRemoteLeaseRequest,
} from '@/features/browser/contracts';
import { desktopInvoke } from '@/lib/desktop';

export function listRuntime() {
  return desktopInvoke<RuntimeProfile[]>('list_runtime');
}

export function openProfile(request: OpenProfileRequest) {
  return desktopInvoke<RuntimeProfile>('open_profile', { request });
}

export function closeProfile(request: CloseProfileRequest) {
  return desktopInvoke<CloseProfileResult>('close_profile', { request });
}

export function closeAllProfiles() {
  return desktopInvoke<CloseAllProfilesResult>('close_all_profiles');
}

export function updateRemoteLease(request: UpdateRemoteLeaseRequest) {
  return desktopInvoke<RuntimeProfile>('update_remote_lease', { request });
}
