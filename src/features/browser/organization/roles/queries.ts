import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';

import { toBrowserErrorMessage } from '../../errors';
import { remoteMemberQueryKeys } from '../members/query-keys';
import { remoteTeamQueryKeys } from '../teams/query-keys';
import {
  batchDeleteRemoteTeamRoles,
  createRemoteTeamRole,
  deleteRemoteTeamRole,
  listRemoteTeamRolePermissions,
  listRemoteTeamRoles,
  updateRemoteTeamRole,
} from './api';
import { remoteRoleQueryKeys } from './query-keys';
import type {
  RemoteListParams,
  RemotePageResponse,
  RemoteTeamRoleBatchDeletePayload,
  RemoteTeamRolePayload,
  RemoteTeamRoleResource,
} from './types';

function toastRemoteError(error: unknown) {
  toast.error(toBrowserErrorMessage(error));
}

export function useRemoteTeamRolesQuery(
  params?: RemoteListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: remoteRoleQueryKeys.list(params),
    queryFn: () => listAllRemoteTeamRoles(params),
    enabled,
  });
}

export function useRemoteTeamRolePermissionsQuery(
  teamId: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: remoteRoleQueryKeys.permissions(teamId),
    queryFn: () => listRemoteTeamRolePermissions(teamId ?? 0),
    enabled: enabled && Boolean(teamId),
    staleTime: 30_000,
  });
}

export function useCreateRemoteTeamRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoteTeamRolePayload) =>
      createRemoteTeamRole(payload),
    retry: false,
    onError: toastRemoteError,
    onSuccess: () => invalidateRoles(queryClient),
  });
}

async function listAllRemoteTeamRoles(
  params?: RemoteListParams,
): Promise<RemotePageResponse<RemoteTeamRoleResource>> {
  const pageSize = 100;
  const firstPage = await listRemoteTeamRoles({
    ...params,
    page: 1,
    page_size: pageSize,
  });
  const pageCount = Math.ceil(firstPage.total / pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      listRemoteTeamRoles({
        ...params,
        page: index + 2,
        page_size: pageSize,
      }),
    ),
  );
  return {
    list: [firstPage, ...remainingPages]
      .flatMap((page) => page.list)
      .slice(0, firstPage.total),
    total: firstPage.total,
  };
}

export function useUpdateRemoteTeamRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId: number;
      payload: RemoteTeamRolePayload;
    }) => updateRemoteTeamRole(roleId, payload),
    onError: toastRemoteError,
    onSuccess: () => invalidateRoles(queryClient),
  });
}

export function useDeleteRemoteTeamRolesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoteTeamRoleBatchDeletePayload) =>
      batchDeleteRemoteTeamRoles(payload),
    retry: false,
    onError: toastRemoteError,
    onSettled: () => invalidateRoles(queryClient),
  });
}

export function useDeleteRemoteTeamRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, teamId }: { roleId: number; teamId: number }) =>
      deleteRemoteTeamRole(roleId, teamId),
    retry: false,
    onError: toastRemoteError,
    onSettled: () => invalidateRoles(queryClient),
  });
}

function invalidateRoles(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: remoteRoleQueryKeys.roles() });
  void queryClient.invalidateQueries({
    queryKey: remoteMemberQueryKeys.members(),
  });
  void queryClient.invalidateQueries({ queryKey: remoteTeamQueryKeys.teams() });
  void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
}
