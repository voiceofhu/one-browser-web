import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getAuthPermissions,
  getCurrentUser,
  joinTeamInvite,
  login,
  logout,
  previewTeamInvite,
} from "@/api/auth"
import {
  authQueryKeys,
  browserQueryKeys,
  systemQueryKeys,
} from "@/lib/query-keys"
import { HttpError } from "@/lib/request"

export { authQueryKeys } from "@/lib/query-keys"

function shouldRetryAuth(failureCount: number, error: Error) {
  if (error instanceof HttpError && error.status === 401) {
    return false
  }

  return failureCount < 3
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
    retry: shouldRetryAuth,
  })
}

export function useAuthPermissions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authQueryKeys.permissions,
    queryFn: getAuthPermissions,
    enabled: options?.enabled ?? true,
    retry: shouldRetryAuth,
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser })
      queryClient.invalidateQueries({ queryKey: authQueryKeys.permissions })
    },
  })
}

export function useTeamInviteQuery(token: string) {
  return useQuery({
    queryKey: authQueryKeys.teamInvite(token),
    queryFn: () => previewTeamInvite(token),
    enabled: Boolean(token),
    retry: false,
  })
}

export function useJoinTeamInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinTeamInvite,
    onSuccess: (_team, token) => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser })
      queryClient.invalidateQueries({ queryKey: authQueryKeys.permissions })
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.teamInvite(token),
      })
      queryClient.invalidateQueries({ queryKey: browserQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: systemQueryKeys.all })
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authQueryKeys.all })
      queryClient.removeQueries({ queryKey: systemQueryKeys.all })
    },
  })
}
