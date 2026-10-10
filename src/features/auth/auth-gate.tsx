import { getAuthPermissions, getCurrentUser } from '@/features/auth/api';
import {
  getErrorMessage,
  isUnauthorizedAuthError,
} from '@/features/auth/auth-errors';
import { AuthGateStatus } from '@/features/auth/components/auth-gate-status';
import { WorkspaceReveal } from '@/features/auth/components/workspace-reveal';
import {
  AUTH_TOKENS_CHANGED_EVENT,
  getAuthSessionGeneration,
  readAuthSessionStatus,
} from '@/features/auth/session';
import type { AuthPermissions, CurrentUser } from '@/features/auth/types';
import { useDefaultAppWindowSize } from '@/features/auth/use-app-window-size';
import { useAuthDeepLinks } from '@/features/auth/use-auth-deep-links';
import { sessionEstablished } from '@/features/auth/login-redirect-guard';
import { isTauriRuntime } from '@/lib/desktop';
import { expireStoredAuthSession } from '@/lib/http';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

interface AuthContextValue {
  user: CurrentUser;
  access: AuthPermissions;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);
const LoginPage = React.lazy(() =>
  import('@/features/auth/login-page').then((module) => ({
    default: module.LoginPage,
  })),
);

export function useAuth() {
  const value = React.useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthGate.');
  }
  return value;
}

export function AuthGate({ children }: React.PropsWithChildren) {
  const queryClient = useQueryClient();
  const isDesktop = isTauriRuntime();
  const [authReady, setAuthReady] = React.useState(false);
  const [authSessionError, setAuthSessionError] = React.useState<string | null>(
    null,
  );
  const [token, setToken] = React.useState('');

  const syncAuthSession = React.useCallback(async (source: string) => {
    try {
      if (!isTauriRuntime()) {
        setToken('browser-cookie-session');
        setAuthSessionError(null);
        return;
      }
      const status = await readAuthSessionStatus();
      console.info('[auth-gate] sync session status', {
        source,
        authenticated: status.authenticated,
        isTauri: isTauriRuntime(),
      });
      setToken(
        status.authenticated ? `session:${getAuthSessionGeneration()}` : '',
      );
      setAuthSessionError(null);
    } catch (error) {
      setToken('');
      setAuthSessionError(
        error instanceof Error ? error.message : '无法读取登录状态',
      );
      console.info('[auth-gate] sync session failed', {
        source,
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setAuthReady(true);
    }
  }, []);

  const handleAuthDeepLink = React.useCallback(() => {
    void syncAuthSession('deep-link');
  }, [syncAuthSession]);
  const authDeepLinksReady = useAuthDeepLinks(handleAuthDeepLink, isDesktop);

  React.useEffect(() => {
    if (!authDeepLinksReady) return;
    let cancelled = false;
    const handleSyncToken = (source: string) => {
      if (!cancelled) void syncAuthSession(source);
    };
    const handleAuthTokensChanged = () =>
      handleSyncToken('auth-tokens-changed');
    const handleStorage = () => handleSyncToken('storage');
    const handleFocus = () => handleSyncToken('focus');

    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, handleAuthTokensChanged);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    const initialSyncTimer = window.setTimeout(
      () => handleSyncToken('mount'),
      0,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(initialSyncTimer);
      window.removeEventListener(
        AUTH_TOKENS_CHANGED_EVENT,
        handleAuthTokensChanged,
      );
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [authDeepLinksReady, syncAuthSession]);

  const currentUser = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: getCurrentUser,
    enabled: authReady && Boolean(token) && !authSessionError,
    retry: false,
  });
  const permissions = useQuery({
    queryKey: ['auth', 'permissions', token],
    queryFn: getAuthPermissions,
    enabled: currentUser.isSuccess,
    retry: false,
  });

  const authError = currentUser.error ?? permissions.error;
  const unauthorized = authError ? isUnauthorizedAuthError(authError) : false;
  const shouldLogin =
    authReady && !authSessionError && (!token || unauthorized);
  const authErrorMessage = authError
    ? getErrorMessage(authError, '无法连接有个浏览器服务')
    : null;
  const hasWorkspace = Boolean(currentUser.data && permissions.data);
  useDefaultAppWindowSize(hasWorkspace);
  React.useEffect(() => {
    if (hasWorkspace) sessionEstablished();
  }, [hasWorkspace]);

  const retryAuth = React.useCallback(() => {
    setAuthSessionError(null);
    if (!token) {
      setAuthReady(false);
      void syncAuthSession('retry-no-token');
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ['auth'] });
    if (currentUser.error) void currentUser.refetch();
    if (permissions.error) void permissions.refetch();
  }, [currentUser, permissions, queryClient, syncAuthSession, token]);

  const goLogin = React.useCallback(() => {
    expireStoredAuthSession('请重新登录');
    setAuthSessionError(null);
    setToken('');
  }, []);

  if (!authReady) {
    return (
      <AuthGateStatus
        title="正在同步登录状态"
        message="有个浏览器正在准备工作区。"
      />
    );
  }
  if (authSessionError) {
    return (
      <AuthGateStatus
        tone="error"
        title="无法读取登录状态"
        message={authSessionError}
        onRetry={retryAuth}
        onLogin={goLogin}
      />
    );
  }
  if (shouldLogin) return <LoginPage authManaged />;
  if (authError && !unauthorized) {
    return (
      <AuthGateStatus
        tone="error"
        title="无法连接有个浏览器服务"
        message={authErrorMessage ?? '请检查网络后重试。'}
        busy={currentUser.isFetching || permissions.isFetching}
        onRetry={retryAuth}
        onLogin={goLogin}
      />
    );
  }
  if (!currentUser.data || !permissions.data) {
    return (
      <AuthGateStatus title="正在加载工作区" message="正在同步账号和权限。" />
    );
  }

  return (
    <AuthContext.Provider
      value={{ user: currentUser.data, access: permissions.data }}
    >
      <WorkspaceReveal>{children}</WorkspaceReveal>
    </AuthContext.Provider>
  );
}
