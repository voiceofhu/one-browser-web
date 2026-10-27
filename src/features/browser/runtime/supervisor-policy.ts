export const runtimeRenewIntervalMs = 45_000;
export const runtimeRenewJitterMs = 5_000;

type RuntimeRenewCandidate = {
  profileId: string;
  status: string;
  leaseGeneration: number | null;
  leaseExpiresAt: string | null;
};

export function isRuntimeRenewCandidate(runtime: RuntimeRenewCandidate) {
  return (
    runtime.status === 'active' &&
    /^remote-env-[1-9]\d*$/.test(runtime.profileId) &&
    runtime.leaseGeneration !== null &&
    runtime.leaseGeneration > 0 &&
    Boolean(runtime.leaseExpiresAt)
  );
}

export function nextRuntimeRenewDelay(randomValue = Math.random()) {
  const normalizedRandom = Math.min(1, Math.max(0, randomValue));
  const jitter = Math.round((normalizedRandom * 2 - 1) * runtimeRenewJitterMs);
  return runtimeRenewIntervalMs + jitter;
}
