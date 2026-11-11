import { logout, prepareWebLoginUrl } from '@/features/auth/api';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { http } from '@/lib/http';
import { useRouter } from '@/router/compat';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { toast } from 'sonner';

/**
 * Sign out of this app only (One User and the other apps stay signed in), or
 * switch account: sign out, then land on the One User account chooser.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  async function run(switchAccount: boolean) {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      const loginUrl = switchAccount
        ? await prepareWebLoginUrl('/dashboard', true)
        : undefined;
      try {
        await logout();
      } finally {
        if (isTauriRuntime()) {
          http.updateTokens(null);
          await queryClient.cancelQueries();
          queryClient.clear();
          router.replace('/login');
        }
      }
      if (isTauriRuntime()) {
        if (loginUrl) {
          await desktopInvoke('open_external_url', {
            request: { url: loginUrl },
          });
        }
      } else {
        http.updateTokens(null);
        await queryClient.cancelQueries();
        queryClient.clear();
        window.location.replace(loginUrl ?? '/login?prompt=select_account');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '账号操作失败，请重试',
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return {
    isLoggingOut,
    logout: () => void run(false),
    switchAccount: () => void run(true),
  };
}
