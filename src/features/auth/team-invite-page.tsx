import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';
import { LoadingState } from '@/components/loading-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  AUTH_TOKENS_CHANGED_EVENT,
  readAuthSessionStatus,
} from '@/features/auth/session';
import {
  remoteTeamQueryKeys,
  selectRemoteTeamId,
} from '@/features/browser/organization/teams/public';
import { HttpError } from '@/lib/http';
import {
  ArrowReloadVerticalIcon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle03Icon,
  Login02Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

import { usePathname, useRouter, useSearchParams } from '@/router/compat';
import {
  type TeamInviteLookup,
  acceptTeamInvite,
  declineTeamInvite,
  previewTeamInvite,
} from './api';
import { InteractiveGridBackground } from './interactive-grid-background';
import type { TeamInvite } from './types';
import { useLoginAppWindowSize } from './use-app-window-size';
import { useAuthDeepLinks } from './use-auth-deep-links';

const DEFAULT_REDIRECT = '/teams';
type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

export function TeamInvitePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const token = searchParams.get('token')?.trim() ?? '';
  const redirectTo = normalizeAppRedirect(searchParams.get('redirect'));
  const currentPath = buildCurrentPath(pathname, searchParams);
  const loginPath = `/login?redirect=${encodeURIComponent(currentPath)}`;
  const [authReady, setAuthReady] = React.useState(false);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  useLoginAppWindowSize();

  const syncAuthSession = React.useCallback(async (source: string) => {
    try {
      const status = await readAuthSessionStatus();
      setAuthenticated(status.authenticated);
      setAuthError(null);
      console.info('[team-invite] auth session synced', {
        source,
        authenticated: status.authenticated,
      });
    } catch (error) {
      setAuthenticated(false);
      setAuthError(error instanceof Error ? error.message : '无法读取登录状态');
    } finally {
      setAuthReady(true);
    }
  }, []);

  useAuthDeepLinks(() => {
    void syncAuthSession('deep-link');
  });

  React.useEffect(() => {
    const handleAuthChanged = () => void syncAuthSession('auth-changed');
    const handleFocus = () => void syncAuthSession('focus');
    const initialSyncTimer = window.setTimeout(() => {
      void syncAuthSession('mount');
    }, 0);

    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearTimeout(initialSyncTimer);
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncAuthSession]);

  const inviteQuery = useQuery({
    queryKey: ['auth', 'team-invite', token],
    queryFn: () => previewTeamInvite({ token }),
    enabled: Boolean(token),
    retry: false,
  });
  const syncJoinedTeam = React.useCallback(
    async (invite: TeamInvite) => {
      selectRemoteTeamId(invite.team_id);
      queryClient.removeQueries({ queryKey: remoteTeamQueryKeys.teams() });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['auth'] }),
        queryClient.invalidateQueries({ queryKey: ['browser'] }),
        queryClient.invalidateQueries({ queryKey: remoteTeamQueryKeys.all }),
      ]);
    },
    [queryClient],
  );
  const acceptMutation = useMutation({
    mutationFn: acceptTeamInvite,
    onSuccess: async (invite) => {
      await syncJoinedTeam(invite);
      toast.success('已加入团队', {
        description: `你已成功加入“${invite.team_name}”。`,
      });
      router.replace(redirectTo);
    },
  });
  const declineMutation = useMutation({
    mutationFn: declineTeamInvite,
    onSuccess: (invite) => {
      void queryClient.invalidateQueries({
        queryKey: ['auth', 'team-invite', token],
      });
      toast('已拒绝邀请', {
        description: `你已拒绝加入“${invite.team_name}”。`,
      });
      router.replace(redirectTo);
    },
  });

  const invite = inviteQuery.data;
  const canRespond = Boolean(invite && invite.status === 'pending');
  const isMutating = acceptMutation.isPending || declineMutation.isPending;
  const disableActions = !canRespond || isMutating || !authReady;
  const acceptedInvite = invite?.status === 'accepted' ? invite : null;

  React.useEffect(() => {
    if (!acceptedInvite) {
      return;
    }

    let cancelled = false;
    void syncJoinedTeam(acceptedInvite).finally(() => {
      if (!cancelled) {
        router.replace(redirectTo);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [acceptedInvite, redirectTo, router, syncJoinedTeam]);

  function requireLoginOrRun(action: (lookup: TeamInviteLookup) => void) {
    if (!token) {
      return;
    }
    if (!authenticated) {
      router.replace(loginPath);
      return;
    }
    action({ token });
  }

  if (acceptedInvite) {
    return null;
  }

  return (
    <main className="bg-background text-foreground relative isolate grid min-h-dvh place-items-center overflow-hidden rounded-[var(--app-radius)] px-4 py-8">
      <InteractiveGridBackground />
      <ThemeToggleButton className="absolute top-3 right-3 z-20" />

      <Card className="bg-card/95 relative z-10 w-full max-w-96">
        <CardHeader className="items-center gap-3 px-6 pt-6 text-center">
          <Avatar className="size-12 rounded-none drop-shadow-[0_10px_16px_rgba(15,23,42,0.16)] after:rounded-none after:border-0 dark:drop-shadow-[0_12px_18px_rgba(0,0,0,0.36)]">
            <AvatarImage
              src="/pwa-512x512.png"
              alt="有个浏览器"
              className="rounded-none"
            />
            <AvatarFallback className="rounded-none">OB</AvatarFallback>
          </Avatar>
          <Badge variant={statusBadgeVariant(invite?.status ?? 'pending')}>
            {statusLabel(invite?.status ?? 'pending')}
          </Badge>
          <CardTitle className="text-base font-medium tracking-normal">
            加入团队
          </CardTitle>
          <CardDescription className="text-xs/relaxed">
            确认邀请信息后，登录账号即可加入团队。
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-6">
          {!token ? (
            <Alert variant="destructive">
              <AlertDescription>邀请链接不完整。</AlertDescription>
            </Alert>
          ) : null}

          {authError ? (
            <Alert variant="destructive">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          ) : null}

          {inviteQuery.isLoading ? (
            <LoadingState
              className="min-h-28 bg-transparent py-6"
              label="邀请信息加载中..."
            />
          ) : inviteQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getErrorMessage(inviteQuery.error, '邀请信息加载失败。')}
              </AlertDescription>
            </Alert>
          ) : invite ? (
            <InviteSummary invite={invite} />
          ) : null}

          {invite && invite.status !== 'pending' ? (
            <Alert>
              <AlertDescription>该邀请当前不可操作。</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 px-6 pb-6 sm:flex-row">
          {inviteQuery.isError ? (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => void inviteQuery.refetch()}
            >
              <HugeiconsIcon
                icon={ArrowReloadVerticalIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              重新加载
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => router.replace(redirectTo)}
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              继续
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full sm:flex-1"
            disabled={disableActions}
            onClick={() => requireLoginOrRun(declineMutation.mutate)}
          >
            {declineMutation.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
            )}
            拒绝
          </Button>

          <Button
            type="button"
            className="w-full sm:flex-1"
            disabled={disableActions}
            onClick={() => requireLoginOrRun(acceptMutation.mutate)}
          >
            {acceptMutation.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : authenticated ? (
              <HugeiconsIcon
                icon={CheckmarkCircle03Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
            ) : (
              <HugeiconsIcon
                icon={Login02Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
            )}
            {authenticated ? '接受邀请' : '登录后继续'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

function InviteSummary({ invite }: { invite: TeamInvite }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-w-0 flex-col items-center gap-1 text-center">
        <HugeiconsIcon
          icon={UserGroupIcon}
          strokeWidth={2}
          className="text-muted-foreground"
        />
        <span className="truncate text-sm font-medium">{invite.team_name}</span>
        <span className="text-muted-foreground truncate text-xs">
          {invite.team_key}
        </span>
      </div>
      <Separator />
      <dl className="grid gap-2 text-xs">
        <SummaryItem label="邀请人" value={invite.inviter_name} />
        <SummaryItem label="角色" value={invite.role_name} />
        <SummaryItem label="受邀邮箱" value={invite.email} />
        <SummaryItem
          label="有效期至"
          value={formatDateTime(invite.expires_at)}
        />
      </dl>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">
        {value || '-'}
      </dd>
    </div>
  );
}

function buildCurrentPath(
  pathname: string | null,
  searchParams: URLSearchParams,
) {
  const query = searchParams.toString();
  return `${pathname || '/team-invite'}${query ? `?${query}` : ''}`;
}

function normalizeAppRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }

  return value;
}

function statusLabel(status: TeamInvite['status']) {
  if (status === 'accepted') {
    return '已接受';
  }
  if (status === 'declined') {
    return '已拒绝';
  }
  if (status === 'cancelled') {
    return '已取消';
  }
  if (status === 'expired') {
    return '已过期';
  }
  return '待确认';
}

function statusBadgeVariant(status: TeamInvite['status']): BadgeVariant {
  if (status === 'accepted') {
    return 'success';
  }
  if (status === 'expired' || status === 'cancelled') {
    return 'destructive';
  }
  if (status === 'declined') {
    return 'outline';
  }
  return 'default';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : fallback;
}
