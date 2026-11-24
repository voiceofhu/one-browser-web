import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';

import { toBrowserErrorMessage } from '../../errors';
import { remoteRoleQueryKeys } from '../roles/query-keys';
import {
  batchDeleteRemotePermissions,
  createRemotePermission,
  deleteRemotePermission,
  listRemotePermissions,
  setRemotePermissionOrder,
  setRemotePermissionStatus,
  updateRemotePermission,
} from './api';
import { remotePermissionQueryKeys } from './query-keys';
import type {
  RemotePageResponse,
  RemotePermissionBatchDeletePayload,
  RemotePermissionOrderUpdate,
  RemotePermissionPayload,
  RemotePermissionResource,
  RemoteStatusFlag,
} from './types';

function toastRemoteError(error: unknown) {
  toast.error(toBrowserErrorMessage(error));
}

export function useRemotePermissionsQuery(enabled = true) {
  return useQuery({
    queryKey: remotePermissionQueryKeys.permissions(),
    queryFn: listAllRemotePermissions,
    enabled,
  });
}

async function listAllRemotePermissions(): Promise<
  RemotePageResponse<RemotePermissionResource>
> {
  const pageSize = 100;
  const firstPage = await listRemotePermissions({
    page: 1,
    page_size: pageSize,
  });
  const pageCount = Math.ceil(firstPage.total / pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      listRemotePermissions({ page: index + 2, page_size: pageSize }),
    ),
  );
  return {
    list: [firstPage, ...remainingPages]
      .flatMap((page) => page.list)
      .slice(0, firstPage.total),
    total: firstPage.total,
  };
}

function invalidatePermissions(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: remotePermissionQueryKeys.permissions(),
  });
  void queryClient.invalidateQueries({ queryKey: remoteRoleQueryKeys.roles() });
  void queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] });
}

export function useCreateRemotePermissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemotePermissionPayload) =>
      createRemotePermission(payload),
    retry: false,
    onError: toastRemoteError,
    onSuccess: () => invalidatePermissions(queryClient),
  });
}

export function useUpdateRemotePermissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      permissionId,
      payload,
    }: {
      permissionId: number;
      payload: RemotePermissionPayload;
    }) => updateRemotePermission(permissionId, payload),
    retry: false,
    onError: toastRemoteError,
    onSuccess: () => invalidatePermissions(queryClient),
  });
}

export function useReorderRemotePermissionsMutation() {
  const queryClient = useQueryClient();
  const queryKey = remotePermissionQueryKeys.permissions();
  return useMutation({
    mutationFn: (updates: RemotePermissionOrderUpdate[]) =>
      Promise.all(
        updates.map(({ record, order_num }) =>
          setRemotePermissionOrder(record, order_num),
        ),
      ),
    retry: false,
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<RemotePageResponse<RemotePermissionResource>>(
          queryKey,
        );
      const orderByPermissionId = new Map(
        updates.map(({ record, order_num }) => [
          record.permission_id,
          order_num,
        ]),
      );
      queryClient.setQueryData<RemotePageResponse<RemotePermissionResource>>(
        queryKey,
        (current) =>
          current
            ? {
                ...current,
                list: current.list.map((record) => {
                  const orderNum = orderByPermissionId.get(
                    record.permission_id,
                  );
                  return orderNum === undefined
                    ? record
                    : { ...record, order_num: orderNum };
                }),
              }
            : current,
      );
      return { previous };
    },
    onError: (error, _updates, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
      toastRemoteError(error);
    },
    onSettled: () => invalidatePermissions(queryClient),
  });
}

export function useRemotePermissionStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      permissionId,
      status,
    }: {
      permissionId: number;
      status: RemoteStatusFlag;
    }) => setRemotePermissionStatus(permissionId, status),
    retry: false,
    onError: toastRemoteError,
    onSuccess: () => invalidatePermissions(queryClient),
  });
}

export function useDeleteRemotePermissionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemotePermissionBatchDeletePayload) =>
      batchDeleteRemotePermissions(payload),
    retry: false,
    onError: toastRemoteError,
    onSettled: () => invalidatePermissions(queryClient),
  });
}

export function useDeleteRemotePermissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRemotePermission,
    retry: false,
    onError: toastRemoteError,
    onSettled: () => invalidatePermissions(queryClient),
  });
}
