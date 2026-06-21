import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getAuthPermissions, getCurrentUser, login, logout } from "@/api/auth"
import { authQueryKeys, systemQueryKeys } from "@/lib/query-keys"
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

export function useAuthPermissions() {
  return useQuery({
    queryKey: authQueryKeys.permissions,
    queryFn: getAuthPermissions,
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
