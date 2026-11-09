import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-gate';
import {
  hasAnyTeamPermission,
  hasButtonPermission,
  hasPermission,
} from '@/features/auth/permissions';
import {
  selectRemoteTeamId,
  TeamDialog,
  useCreateRemoteTeamMutation,
  useRemoteTeamsQuery,
} from '@/features/browser/organization/teams/public';
import type { RemoteTeamPayload } from '@/features/browser/organization/teams/public';
import { usePathname } from '@/router/compat';
import {
  AddTeamIcon,
  DashboardBrowsingIcon,
  Route02Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';
import { toast } from 'sonner';

/* Same params as the sidebar team switcher, so both read one cached list. */
const teamsParams = { page_size: 100 } as const;

/* Pages whose data all belongs to a team. System, monitor, settings and
   account pages stay reachable without one. */
const TEAM_SCOPED_PATHS = [
  '/dashboard',
  '/environments',
  '/proxies',
  '/teams',
  '/members',
  '/versions',
  '/browser/roles',
];

function isTeamScopedPath(pathname: string) {
  return TEAM_SCOPED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function TeamOnboardingGate({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const { access } = useAuth();
  const canReadTeams =
    hasPermission(access, 'browser:team:list') ||
    hasAnyTeamPermission(access, 'browser:team:list');
  const teamsQuery = useRemoteTeamsQuery(teamsParams, canReadTeams);
  const hasNoTeam =
    canReadTeams &&
    teamsQuery.isSuccess &&
    (teamsQuery.data?.list.length ?? 0) === 0;

  if (!hasNoTeam || !isTeamScopedPath(pathname)) {
    return children;
  }

  return (
    <TeamOnboarding
      canCreateTeam={hasButtonPermission(access, 'browser:team:create')}
    />
  );
}

const steps = [
  {
    icon: UserGroupIcon,
    title: '新增团队',
    text: '环境、代理和成员都归属团队',
  },
  { icon: Route02Icon, title: '添加代理', text: '为团队准备出口线路' },
  {
    icon: DashboardBrowsingIcon,
    title: '创建环境',
    text: '每个环境独立指纹与 Cookie',
  },
];

function TeamOnboarding({ canCreateTeam }: { canCreateTeam: boolean }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const createMutation = useCreateRemoteTeamMutation();

  function submitTeam(payload: RemoteTeamPayload) {
    createMutation.mutate(payload, {
      onSuccess: (created) => {
        selectRemoteTeamId(created.id);
        toast.success('团队已创建');
        setDialogOpen(false);
      },
    });
  }

  return (
    <section
      data-slot="team-onboarding"
      className="bg-background flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto px-6 py-10"
    >
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="bg-primary/10 text-primary mb-4 flex size-14 items-center justify-center rounded-2xl">
          <HugeiconsIcon
            icon={UserGroupIcon}
            strokeWidth={1.8}
            className="size-7"
          />
        </div>
        <h1 className="text-[1.25rem] font-semibold tracking-tight">
          {canCreateTeam ? '先创建一个团队' : '还没有加入团队'}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-[0.8125rem] leading-5">
          {canCreateTeam
            ? '浏览器环境、代理和成员都在团队里管理。创建团队后就能开始使用。'
            : '请联系团队管理员发送邀请链接，打开链接即可加入团队。'}
        </p>

        {canCreateTeam ? (
          <>
            <ol className="bg-card mt-6 w-full overflow-hidden rounded-lg text-left">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="flex items-center gap-3 border-b px-3.5 py-2.5 last:border-b-0"
                >
                  <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold tabular-nums">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-medium">{step.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {step.text}
                    </p>
                  </div>
                  <HugeiconsIcon
                    icon={step.icon}
                    strokeWidth={2}
                    className="text-muted-foreground size-4 shrink-0"
                  />
                </li>
              ))}
            </ol>
            <Button
              className="mt-6 h-8 min-w-36 px-4 text-[0.8125rem]"
              disabled={createMutation.isPending}
              onClick={() => setDialogOpen(true)}
            >
              <HugeiconsIcon
                icon={AddTeamIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              新增团队
            </Button>
            <p className="text-muted-foreground mt-3 text-xs">
              收到团队邀请？直接打开邀请链接即可加入。
            </p>
            <TeamDialog
              open={dialogOpen}
              mode="create"
              isSaving={createMutation.isPending}
              onOpenChange={(open) => {
                if (!open && createMutation.isPending) {
                  return;
                }
                setDialogOpen(open);
              }}
              onSubmit={submitTeam}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
