import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';

import { browserQueryKeys } from '../cache/query-keys';
import { toBrowserErrorMessage } from '../errors';
import { remoteTeamQueryKeys } from '../organization/teams/query-keys';
import {
  toastBrowserOpenError,
  toastBrowserOpenSuccess,
} from '../runtime/open-progress-toast';
import {
  createRemoteEnvironment,
  deleteRemoteEnvironment,
  listRemoteEnvironments,
  setRemoteEnvironmentStatus,
  updateRemoteEnvironment,
} from './api';
import { remoteEnvironmentQueryKeys } from './query-keys';
import {
  closeRemoteEnvironmentLocally,
  openRemoteEnvironmentLocally,
} from './runtime';
import type {
  RemoteEnvironmentPayload,
  RemoteListParams,
  RemoteStatusFlag,
} from './types';

function toastRemoteError(error: unknown) {
  toast.error(toBrowserErrorMessage(error));
}

export function useRemoteEnvironmentsQuery(
  params?: RemoteListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: remoteEnvironmentQueryKeys.list(params),
    queryFn: () => listRemoteEnvironments(params),
    enabled,
  });
}

export function useCreateRemoteEnvironmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoteEnvironmentPayload) =>
      createRemoteEnvironment(payload),
    onError: toastRemoteError,
    onSuccess: () => invalidateEnvironments(queryClient),
  });
}

export function useUpdateRemoteEnvironmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      environmentId,
      payload,
    }: {
      environmentId: number;
      payload: RemoteEnvironmentPayload;
    }) => updateRemoteEnvironment(environmentId, payload),
    onError: toastRemoteError,
    onSuccess: () => invalidateEnvironments(queryClient),
  });
}

export function useDeleteRemoteEnvironmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRemoteEnvironment,
    retry: false,
    onError: toastRemoteError,
    onSuccess: () => invalidateEnvironments(queryClient),
  });
}

export function useRemoteEnvironmentStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      environmentId,
      status,
    }: {
      environmentId: number;
      status: RemoteStatusFlag;
    }) => setRemoteEnvironmentStatus(environmentId, status),
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remoteEnvironmentQueryKeys.environments(),
      });
    },
  });
}

export function useRemoteEnvironmentRuntimeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      environmentId,
      action,
    }: {
      environmentId: number;
      action: 'open' | 'close';
    }) =>
      action === 'open'
        ? openRemoteEnvironmentLocally(environmentId)
        : closeRemoteEnvironmentLocally(environmentId),
    onError: (error, variables) => {
      if (variables.action === 'open') {
        toastBrowserOpenError(error);
        return;
      }
      toastRemoteError(error);
    },
    onSuccess: (environment, variables) => {
      if (variables.action === 'open') {
        toastBrowserOpenSuccess();
      }
      void queryClient.invalidateQueries({
        queryKey: remoteEnvironmentQueryKeys.environments(),
      });
      void queryClient.invalidateQueries({
        queryKey: browserQueryKeys.runtime(),
      });
      void queryClient.invalidateQueries({
        queryKey: browserQueryKeys.profiles(),
      });
      void queryClient.invalidateQueries({
        queryKey: browserQueryKeys.status(),
      });
      void queryClient.invalidateQueries({
        queryKey: browserQueryKeys.profile(
          `remote-env-${environment.environment_id}`,
        ),
      });
    },
  });
}

function invalidateEnvironments(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: remoteEnvironmentQueryKeys.environments(),
  });
  void queryClient.invalidateQueries({ queryKey: remoteTeamQueryKeys.teams() });
}
