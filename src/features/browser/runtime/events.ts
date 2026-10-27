import { browserQueryKeys } from '@/features/browser/cache/query-keys';
import type {
  CloseProfileResult,
  OpenProfileProgressPayload,
  OpenProfileProgressStep,
  RuntimeProfile,
} from '@/features/browser/contracts';
import { desktopInvoke } from '@/lib/desktop';
import type { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { closeRemoteEnvironment } from '../environments/api';
import { remoteEnvironmentQueryKeys } from '../environments/query-keys';
import { parseRemoteEnvironmentProfileId } from '../environments/runtime-profile-id';
import { syncProfileListsFromRuntime } from './cache-sync';
import { toastBrowserOpenProgress } from './open-progress-toast';

const browserRuntimeChangedEvent = 'browser-runtime-changed';
const browserProfileOpenProgressEvent = 'browser-profile-open-progress';
const remoteEnvironmentExitSyncEvent = 'remote-environment-exit-sync-requested';
const openProfileProgressSteps: OpenProfileProgressStep[] = [
  'checking_proxy',
  'proxy_checked',
  'preparing_launch',
  'launched',
  'failed',
];

type RuntimeChangedPayload = {
  runtime: RuntimeProfile[];
  closedProfiles?: CloseProfileResult[];
};

type RemoteEnvironmentLease = { environmentId: number; generation: number };

type RemoteEnvironmentExitSyncPayload = {
  environments: RemoteEnvironmentLease[];
};

export function useRuntimeEvents(queryClient: QueryClient) {
  useEffect(() => {
    function handleRuntimeChange(event: Event) {
      const payload = (event as CustomEvent<unknown>).detail;
      if (!isRuntimeChangedPayload(payload)) {
        return;
      }

      const nextRuntime = payload.runtime;

      queryClient.setQueryData(browserQueryKeys.runtime(), nextRuntime);
      syncProfileListsFromRuntime(queryClient, nextRuntime);
      void syncClosedRemoteEnvironments(
        queryClient,
        payload.closedProfiles ?? [],
      );
    }

    function handleRemoteEnvironmentExitSync(event: Event) {
      const payload = (event as CustomEvent<unknown>).detail;
      const environments = isRemoteEnvironmentExitSyncPayload(payload)
        ? payload.environments
        : [];

      void syncRemoteEnvironmentsBeforeExit(environments).finally(() =>
        completeRemoteEnvironmentExitSync(),
      );
    }

    function handleProfileOpenProgress(event: Event) {
      const payload = (event as CustomEvent<unknown>).detail;
      if (!isOpenProfileProgressPayload(payload)) {
        return;
      }

      toastBrowserOpenProgress(payload);
    }

    window.addEventListener(browserRuntimeChangedEvent, handleRuntimeChange);
    window.addEventListener(
      browserProfileOpenProgressEvent,
      handleProfileOpenProgress,
    );
    window.addEventListener(
      remoteEnvironmentExitSyncEvent,
      handleRemoteEnvironmentExitSync,
    );

    return () => {
      window.removeEventListener(
        browserRuntimeChangedEvent,
        handleRuntimeChange,
      );
      window.removeEventListener(
        browserProfileOpenProgressEvent,
        handleProfileOpenProgress,
      );
      window.removeEventListener(
        remoteEnvironmentExitSyncEvent,
        handleRemoteEnvironmentExitSync,
      );
    };
  }, [queryClient]);
}

async function syncRemoteEnvironmentsBeforeExit(
  environments: RemoteEnvironmentLease[],
) {
  const results = await Promise.allSettled(
    environments.map(({ environmentId, generation }) =>
      closeRemoteEnvironment(environmentId, generation),
    ),
  );

  results.forEach((result, index) => {
    if (
      result.status === 'rejected' &&
      !isUnauthorizedRemoteSyncError(result.reason)
    ) {
      console.error(
        `failed to close remote environment ${environments[index].environmentId} before app exit`,
        result.reason,
      );
    }
  });
}

async function completeRemoteEnvironmentExitSync() {
  try {
    await desktopInvoke<void>('complete_remote_environment_exit_sync');
  } catch (error) {
    console.error('failed to acknowledge remote environment exit sync', error);
  }
}

async function syncClosedRemoteEnvironments(
  queryClient: QueryClient,
  explicitlyClosedProfiles: CloseProfileResult[],
) {
  const closedEnvironments = closedRemoteEnvironmentLeases(
    explicitlyClosedProfiles,
  );
  if (!closedEnvironments.length) return;
  const results = await Promise.allSettled(
    closedEnvironments.map(({ environmentId, generation }) =>
      closeRemoteEnvironment(environmentId, generation),
    ),
  );

  results.forEach((result, index) => {
    if (result.status !== 'rejected') {
      return;
    }

    if (isUnauthorizedRemoteSyncError(result.reason)) {
      return;
    }

    console.error(
      `failed to sync closed remote environment ${closedEnvironments[index].environmentId}`,
      result.reason,
    );
  });

  void queryClient.invalidateQueries({
    queryKey: remoteEnvironmentQueryKeys.environments(),
  });
}

export function closedRemoteEnvironmentLeases(
  explicitlyClosedProfiles: CloseProfileResult[],
): RemoteEnvironmentLease[] {
  const leases = new Map<string, RemoteEnvironmentLease>();
  for (const profile of explicitlyClosedProfiles) {
    const environmentId = parseRemoteEnvironmentProfileId(profile.profileId);
    const generation = profile.leaseGeneration;
    if (
      environmentId !== null &&
      typeof generation === 'number' &&
      Number.isSafeInteger(generation) &&
      generation > 0
    ) {
      leases.set(`${environmentId}:${generation}`, {
        environmentId,
        generation,
      });
    }
  }
  return [...leases.values()];
}

export function useProfileOpenProgressEvents(
  onProgress: (payload: OpenProfileProgressPayload) => void,
) {
  useEffect(() => {
    function handleOpenProgress(event: Event) {
      const payload = (event as CustomEvent<unknown>).detail;
      if (!isOpenProfileProgressPayload(payload)) {
        return;
      }

      onProgress(payload);
    }

    window.addEventListener(
      browserProfileOpenProgressEvent,
      handleOpenProgress,
    );

    return () => {
      window.removeEventListener(
        browserProfileOpenProgressEvent,
        handleOpenProgress,
      );
    };
  }, [onProgress]);
}

function isRuntimeChangedPayload(
  payload: unknown,
): payload is RuntimeChangedPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  const candidate = payload as RuntimeChangedPayload;
  return (
    Array.isArray(candidate.runtime) &&
    (candidate.closedProfiles === undefined ||
      (Array.isArray(candidate.closedProfiles) &&
        candidate.closedProfiles.every(
          (profile) => typeof profile.profileId === 'string',
        )))
  );
}

function isRemoteEnvironmentExitSyncPayload(
  payload: unknown,
): payload is RemoteEnvironmentExitSyncPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray((payload as RemoteEnvironmentExitSyncPayload).environments) &&
    (payload as RemoteEnvironmentExitSyncPayload).environments.every(
      ({ environmentId, generation }) =>
        Number.isSafeInteger(environmentId) &&
        environmentId > 0 &&
        Number.isSafeInteger(generation) &&
        generation > 0,
    )
  );
}

function isOpenProfileProgressPayload(
  payload: unknown,
): payload is OpenProfileProgressPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof (payload as OpenProfileProgressPayload).profileId === 'string' &&
    isOpenProfileProgressStep((payload as OpenProfileProgressPayload).step)
  );
}

function isOpenProfileProgressStep(
  step: unknown,
): step is OpenProfileProgressStep {
  return (
    typeof step === 'string' &&
    openProfileProgressSteps.includes(step as OpenProfileProgressStep)
  );
}

function isUnauthorizedRemoteSyncError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 401
  );
}
