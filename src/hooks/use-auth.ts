import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  bindReferral,
  checkReferralCode,
  getAuthPermissions,
  getCurrentUser,
  authorizeApp,
  joinTeamInvite,
  login,
  logout,
  previewTeamInvite,
  type BindReferralPayload,
  type TeamInviteLookup,
} from "@/api/auth"
import { clearAuthTokens, saveAuthTokens } from "@/lib/auth-tokens"
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
    onSuccess: (response) => {
      saveAuthTokens(response)
      queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser })
      queryClient.invalidateQueries({ queryKey: authQueryKeys.permissions })
    },
  })
}

export function useAppAuthorizeMutation() {
  return useMutation({
    mutationFn: authorizeApp,
  })
}

export function useTeamInviteQuery(lookup: TeamInviteLookup) {
  return useQuery({
    queryKey: authQueryKeys.teamInvite(lookup.code, lookup.team_code),
    queryFn: () => previewTeamInvite(lookup),
    enabled: Boolean(lookup.code && lookup.team_code),
    retry: false,
  })
}

export function useJoinTeamInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinTeamInvite,
    onSuccess: (_team, lookup) => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser })
      queryClient.invalidateQueries({ queryKey: authQueryKeys.permissions })
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.teamInvite(lookup.code, lookup.team_code),
      })
      queryClient.invalidateQueries({ queryKey: browserQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: systemQueryKeys.all })
    },
  })
}

export function useReferralCodeCheckQuery(aff: string) {
  return useQuery({
    queryKey: authQueryKeys.referralCodeCheck(aff),
    queryFn: () => checkReferralCode(aff),
    enabled: Boolean(aff),
    retry: false,
  })
}

export function useBindReferralMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BindReferralPayload) => bindReferral(payload),
    onSuccess: (_result, payload) => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser })
      queryClient.invalidateQueries({ queryKey: authQueryKeys.permissions })
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.referralCodeCheck(payload.aff),
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
    onSettled: () => {
      clearAuthTokens()
      queryClient.removeQueries({ queryKey: authQueryKeys.all })
      queryClient.removeQueries({ queryKey: systemQueryKeys.all })
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authQueryKeys.all })
      queryClient.removeQueries({ queryKey: systemQueryKeys.all })
    },
  })
}
