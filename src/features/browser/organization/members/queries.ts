import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';

import { remoteEnvironmentQueryKeys } from '../../environments/query-keys';
import { toBrowserErrorMessage } from '../../errors';
import { remoteTeamQueryKeys } from '../teams/query-keys';
import {
  getRemoteMemberPermissions,
  listRemoteMembers,
  removeRemoteTeamMember,
  setRemoteMemberStatus,
  updateRemoteMemberEnvironmentAuthorization,
  updateRemoteMemberPermissions,
  updateRemoteMemberRoles,
} from './api';
import { remoteMemberQueryKeys } from './query-keys';
import type {
  RemoteListParams,
  RemoteMemberEnvironmentAuthorizationPayload,
  RemoteMemberPermissionsPayload,
  RemoteMemberRolesPayload,
  RemoteStatusFlag,
} from './types';

function toastRemoteError(error: unknown) {
  toast.error(toBrowserErrorMessage(error));
}

export function useRemoteMembersQuery(
  params?: RemoteListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: remoteMemberQueryKeys.list(params),
    queryFn: () => listRemoteMembers(params),
    enabled,
  });
}

export function useRemoteMemberStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      teamId,
      status,
    }: {
      memberId: number;
      teamId: number;
      status: RemoteStatusFlag;
    }) => setRemoteMemberStatus(memberId, { team_id: teamId, status }),
    onError: toastRemoteError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remoteMemberQueryKeys.members(),
      });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
    },
  });
}

export function useRemoveRemoteTeamMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: number; memberId: number }) =>
      removeRemoteTeamMember(teamId, memberId),
    retry: false,
    onError: toastRemoteError,
    onSuccess: (_, variables) => {
      queryClient.removeQueries({
        queryKey: remoteMemberQueryKeys.permissions(
          variables.memberId,
          variables.teamId,
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteMemberQueryKeys.members(),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteTeamQueryKeys.teams(),
      });
    },
  });
}

export function useRemoteMemberPermissionsQuery(
  memberId: number | null,
  teamId: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: remoteMemberQueryKeys.permissions(memberId, teamId),
    queryFn: () => getRemoteMemberPermissions(memberId ?? 0, teamId ?? 0),
    enabled: enabled && Boolean(memberId) && Boolean(teamId),
  });
}

export function useUpdateRemoteMemberPermissionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: number;
      payload: RemoteMemberPermissionsPayload;
    }) => updateRemoteMemberPermissions(memberId, payload),
    onError: toastRemoteError,
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        remoteMemberQueryKeys.permissions(
          variables.memberId,
          variables.payload.team_id,
        ),
        result,
      );
      void queryClient.invalidateQueries({
        queryKey: remoteMemberQueryKeys.members(),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteEnvironmentQueryKeys.environments(),
      });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
    },
  });
}

export function useUpdateRemoteMemberRolesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: number;
      payload: RemoteMemberRolesPayload;
    }) => updateRemoteMemberRoles(memberId, payload),
    onError: toastRemoteError,
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        remoteMemberQueryKeys.permissions(
          variables.memberId,
          variables.payload.team_id,
        ),
        result,
      );
      void queryClient.invalidateQueries({
        queryKey: remoteMemberQueryKeys.members(),
      });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
    },
  });
}

export function useUpdateRemoteMemberEnvironmentAuthorizationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: number;
      payload: RemoteMemberEnvironmentAuthorizationPayload;
    }) => updateRemoteMemberEnvironmentAuthorization(memberId, payload),
    onError: toastRemoteError,
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        remoteMemberQueryKeys.permissions(
          variables.memberId,
          variables.payload.team_id,
        ),
        result,
      );
      void queryClient.invalidateQueries({
        queryKey: remoteMemberQueryKeys.members(),
      });
      void queryClient.invalidateQueries({
        queryKey: remoteEnvironmentQueryKeys.environments(),
      });
    },
  });
}
