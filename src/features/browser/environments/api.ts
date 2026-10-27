import { http } from '@/lib/http';

import type {
  OpenedRemoteEnvironmentResource,
  RemoteCreatedResource,
  RemoteEnvironmentListItem,
  RemoteEnvironmentPayload,
  RemoteEnvironmentResource,
  RemoteListParams,
  RemotePageResponse,
  RemoteStatusFlag,
  RenewRemoteEnvironmentRequest,
  RenewRemoteEnvironmentResource,
} from './types';

const environmentPath = '/browser/environments';

function cleanParams(params?: RemoteListParams) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean>;
}

export async function listRemoteEnvironments(params?: RemoteListParams) {
  const response = await http.get<
    RemotePageResponse<RemoteEnvironmentListItem>
  >(environmentPath, cleanParams(params));
  return response.data;
}

export async function getRemoteEnvironment(environmentId: number) {
  const response = await http.get<RemoteEnvironmentResource>(
    `${environmentPath}/${environmentId}`,
  );
  return response.data;
}

export async function createRemoteEnvironment(
  payload: RemoteEnvironmentPayload,
) {
  const response = await http.post<RemoteCreatedResource>(
    environmentPath,
    payload,
  );
  return response.data;
}

export async function updateRemoteEnvironment(
  environmentId: number,
  payload: RemoteEnvironmentPayload,
) {
  const response = await http.put<RemoteEnvironmentResource>(
    `${environmentPath}/${environmentId}`,
    payload,
  );
  return response.data;
}

export async function deleteRemoteEnvironment(environmentId: number) {
  await http.delete<void>(`${environmentPath}/${environmentId}`);
}

export async function setRemoteEnvironmentStatus(
  environmentId: number,
  status: RemoteStatusFlag,
) {
  const response = await http.put<RemoteEnvironmentResource>(
    `${environmentPath}/${environmentId}/status`,
    { status },
  );
  return response.data;
}

export async function openRemoteEnvironment(environmentId: number) {
  const response = await http.post<OpenedRemoteEnvironmentResource>(
    `${environmentPath}/${environmentId}/open`,
  );
  return response.data;
}

export async function closeRemoteEnvironment(
  environmentId: number,
  generation: number,
) {
  const response = await http.post<RemoteEnvironmentResource>(
    `${environmentPath}/${environmentId}/close`,
    { generation },
  );
  return response.data;
}

export async function renewRemoteEnvironment(
  environmentId: number,
  payload: RenewRemoteEnvironmentRequest,
) {
  const response = await http.post<
    RenewRemoteEnvironmentResource,
    RenewRemoteEnvironmentRequest
  >(`${environmentPath}/${environmentId}/renew`, payload);
  return response.data;
}
