import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  acceptTeamInvite,
  bindReferral,
  checkReferralCode,
  declineTeamInvite,
  getAuthPermissions,
  getCurrentUser,
  authorizeApp,
  login,
  logout,
  previewTeamInvite,
  type BindReferralPayload,
  type TeamInviteLookup,
} from "@/api/auth"
import {
  clearAuthTokens,
  hasAuthTokens,
  saveAuthTokens,
} from "@/lib/auth-tokens"
import { authQueryKeys, systemQueryKeys } from "@/lib/query-keys"
import { clearAuthExpiredNotice, HttpError } from "@/lib/request"

export { authQueryKeys } from "@/lib/query-keys"

function shouldRetryAuth(failureCount: number, error: Error) {
  if (error instanceof HttpError && error.status === 401) {
    return false
  }

  return failureCount < 3
}

export function useCurrentUser(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
    enabled: options?.enabled ?? hasAuthTokens(),
    retry: shouldRetryAuth,
  })
}

export function useAuthPermissions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authQueryKeys.permissions,
    queryFn: getAuthPermissions,
    enabled: options?.enabled ?? hasAuthTokens(),
    retry: shouldRetryAuth,
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      clearAuthExpiredNotice()
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
    queryKey: authQueryKeys.teamInvite(lookup.token),
    queryFn: () => previewTeamInvite(lookup),
    enabled: Boolean(lookup.token),
    retry: false,
  })
}

export function useAcceptTeamInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptTeamInvite,
    onSuccess: (_team, lookup) => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser })
      queryClient.invalidateQueries({ queryKey: authQueryKeys.permissions })
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.teamInvite(lookup.token),
      })
      queryClient.invalidateQueries({ queryKey: systemQueryKeys.all })
    },
  })
}

export function useDeclineTeamInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: declineTeamInvite,
    onSuccess: (_team, lookup) => {
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.teamInvite(lookup.token),
      })
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
