import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';

import { remoteEnvironmentQueryKeys } from '../../environments/query-keys';
import { toBrowserErrorMessage } from '../../errors';
import { remoteProxyQueryKeys } from '../../remote-proxies/query-keys';
import { remoteMemberQueryKeys } from '../members/query-keys';
import {
  createRemoteTeam,
  createRemoteTeamInvite,
  dissolveRemoteTeam,
  leaveRemoteTeam,
  listRemoteTeamInviteRoles,
  listRemoteTeams,
  setRemoteTeamStatus,
  transferRemoteTeamOwner,
  updateRemoteTeam,
} from './api';
import { remoteTeamQueryKeys } from './query-keys';
import type {
  RemoteListParams,
  RemoteStatusFlag,
  RemoteTeamInvitePayload,
  RemoteTeamPayload,
} from './types';

function toastRemoteError(error: unknown) {
  toast.error(toBrowserErrorMessage(error));
}

function teamListParams(params?: RemoteListParams): RemoteListParams {
  return { ...params, joined_only: params?.joined_only ?? true };
}

export function useRemoteTeamsQuery(params?: RemoteListParams, enabled = true) {
  const queryParams = teamListParams(params);
  return useQuery({
    queryKey: remoteTeamQueryKeys.list(queryParams),
    queryFn: () => listRemoteTeams(queryParams),
    enabled,
  });
}

export function useCreateRemoteTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoteTeamPayload) => createRemoteTeam(payload),
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remoteTeamQueryKeys.teams(),
      });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
    },
  });
}

export function useUpdateRemoteTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      payload,
    }: {
      teamId: number;
      payload: RemoteTeamPayload;
    }) => updateRemoteTeam(teamId, payload),
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remoteTeamQueryKeys.teams(),
      });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
    },
  });
}

export function useLeaveRemoteTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveRemoteTeam,
    retry: false,
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remoteTeamQueryKeys.teams(),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteMemberQueryKeys.members(),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteEnvironmentQueryKeys.environments(),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteProxyQueryKeys.proxies(),
      });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
    },
  });
}

export function useTransferRemoteTeamOwnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: number; memberId: number }) =>
      transferRemoteTeamOwner(teamId, memberId),
    retry: false,
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remoteTeamQueryKeys.teams(),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteMemberQueryKeys.members(),
      });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
    },
  });
}

export function useDissolveRemoteTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dissolveRemoteTeam,
    retry: false,
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: remoteTeamQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
    },
  });
}

export function useRemoteTeamStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      status,
    }: {
      teamId: number;
      status: RemoteStatusFlag;
    }) => setRemoteTeamStatus(teamId, status),
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remoteTeamQueryKeys.teams(),
      });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
    },
  });
}

export function useCreateRemoteTeamInviteMutation() {
  return useMutation({
    mutationFn: ({
      teamId,
      payload,
    }: {
      teamId: number;
      payload: RemoteTeamInvitePayload;
    }) => createRemoteTeamInvite(teamId, payload),
    retry: false,
    onError: toastRemoteError,
  });
}

export function useRemoteTeamInviteRolesQuery(
  teamId: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: remoteTeamQueryKeys.inviteRoles(teamId),
    queryFn: () => listRemoteTeamInviteRoles(teamId ?? 0),
    enabled: enabled && Boolean(teamId),
  });
}
