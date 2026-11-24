import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';

import { remoteEnvironmentQueryKeys } from '../environments/query-keys';
import { toBrowserErrorMessage } from '../errors';
import { remoteTeamQueryKeys } from '../organization/teams/query-keys';
import {
  createRemoteProxy,
  deleteRemoteProxy,
  listRemoteProxies,
  updateRemoteProxy,
  updateRemoteProxyCheckResult,
} from './api';
import { remoteProxyQueryKeys } from './query-keys';
import type {
  RemoteListParams,
  RemotePageResponse,
  RemoteProxyCheckResultPayload,
  RemoteProxyPayload,
  RemoteProxyResource,
} from './types';

function toastRemoteError(error: unknown) {
  toast.error(toBrowserErrorMessage(error));
}

export function useRemoteProxiesQuery(
  params?: RemoteListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: remoteProxyQueryKeys.list(params),
    queryFn: () => listRemoteProxies(params),
    enabled,
  });
}

export function useCreateRemoteProxyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoteProxyPayload) => createRemoteProxy(payload),
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remoteProxyQueryKeys.proxies(),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteTeamQueryKeys.teams(),
      });
    },
  });
}

export function useUpdateRemoteProxyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      proxyId,
      payload,
    }: {
      proxyId: number;
      payload: RemoteProxyPayload;
    }) => updateRemoteProxy(proxyId, payload),
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remoteProxyQueryKeys.proxies(),
      });
    },
  });
}

export function useDeleteRemoteProxyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRemoteProxy,
    retry: false,
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remoteProxyQueryKeys.proxies(),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteEnvironmentQueryKeys.environments(),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteTeamQueryKeys.teams(),
      });
    },
  });
}

export function useUpdateRemoteProxyCheckResultMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      proxyId,
      payload,
    }: {
      proxyId: number;
      payload: RemoteProxyCheckResultPayload;
    }) => updateRemoteProxyCheckResult(proxyId, payload),
    onSuccess: (proxy) => {
      queryClient.setQueriesData<RemotePageResponse<RemoteProxyResource>>(
        { queryKey: remoteProxyQueryKeys.proxies() },
        (data) =>
          data
            ? {
                ...data,
                list: data.list.map((item) =>
                  item.proxy_id === proxy.proxy_id ? proxy : item,
                ),
              }
            : data,
      );
      void queryClient.invalidateQueries({
        queryKey: remoteProxyQueryKeys.proxies(),
      });
    },
  });
}
