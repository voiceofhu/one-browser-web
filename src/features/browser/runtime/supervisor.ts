import { readAuthTokens } from '@/features/auth/session';
import { isTauriRuntime } from '@/lib/desktop';
import * as React from 'react';

import type { RuntimeProfile } from '../contracts';
import { renewRemoteEnvironment } from '../environments/api';
import { parseRemoteEnvironmentProfileId } from '../environments/runtime-profile-id';
import { listRuntime, updateRemoteLease } from './api';
import {
  isRuntimeRenewCandidate,
  nextRuntimeRenewDelay,
} from './supervisor-policy';

export function useRuntimeSupervisor() {
  React.useEffect(() => {
    if (!isTauriRuntime()) return;

    let stopped = false;
    let timer: number | null = null;
    let sweepPromise: Promise<void> | null = null;
    const renewals = new Map<number, Promise<void>>();

    const renewRuntime = (runtime: RuntimeProfile) => {
      const environmentId = parseRemoteEnvironmentProfileId(runtime.profileId);
      if (
        environmentId === null ||
        runtime.leaseGeneration === null ||
        !runtime.leaseExpiresAt
      ) {
        return Promise.resolve();
      }
      const current = renewals.get(environmentId);
      if (current) return current;

      const generation = runtime.leaseGeneration;
      const renewal = renewRemoteEnvironment(environmentId, { generation })
        .then((renewed) =>
          updateRemoteLease({
            profileId: runtime.profileId,
            generation: renewed.generation,
            leaseExpiresAt: renewed.lease_expires_at,
          }),
        )
        .then(() => undefined)
        .catch((error) => {
          // A failed renewal is retried on the next sweep. A definitive
          // refresh 401 is handled by the global authentication-expiry
          // coordinator.
          console.warn(
            `[runtime-supervisor] failed to renew remote environment ${environmentId}`,
            error,
          );
        })
        .finally(() => {
          renewals.delete(environmentId);
        });
      renewals.set(environmentId, renewal);
      return renewal;
    };

    const sweep = () => {
      if (!readAuthTokens() || stopped) return Promise.resolve();
      if (sweepPromise) return sweepPromise;

      sweepPromise = listRuntime()
        .then((runtime) =>
          Promise.all(
            runtime.filter(isRuntimeRenewCandidate).map(renewRuntime),
          ),
        )
        .then(() => undefined)
        .catch((error) => {
          console.warn(
            '[runtime-supervisor] failed to list local runtime',
            error,
          );
        })
        .finally(() => {
          sweepPromise = null;
        });
      return sweepPromise;
    };

    const schedule = () => {
      if (stopped) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void sweep().finally(schedule);
      }, nextRuntimeRenewDelay());
    };
    const renewNow = () => {
      void sweep();
    };
    const renewWhenVisible = () => {
      if (document.visibilityState === 'visible') renewNow();
    };

    window.addEventListener('online', renewNow);
    window.addEventListener('focus', renewNow);
    document.addEventListener('visibilitychange', renewWhenVisible);
    renewNow();
    schedule();

    return () => {
      stopped = true;
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener('online', renewNow);
      window.removeEventListener('focus', renewNow);
      document.removeEventListener('visibilitychange', renewWhenVisible);
    };
  }, []);
}
