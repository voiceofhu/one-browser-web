import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/features/auth/auth-gate';
import {
  hasButtonPermission,
  hasPermission,
} from '@/features/auth/permissions';
import {
  CountryFlag,
  resolveCountryCode,
} from '@/features/browser/components/country-flag';
import { applyLocalRuntimeState } from '@/features/browser/environments/environment-utils';
import { useRemoteEnvironmentsQuery } from '@/features/browser/environments/queries';
import { parseRemoteEnvironmentProfileId } from '@/features/browser/environments/runtime-profile-id';
import type { RemoteEnvironmentListItem } from '@/features/browser/environments/types';
import { useEnvironmentActions } from '@/features/browser/environments/use-environment-actions';
import { useRemoteTeamsQuery } from '@/features/browser/organization/teams/queries';
import { useSelectedRemoteTeamId } from '@/features/browser/organization/teams/team-scope';
import { normalizeProfileGroup } from '@/features/browser/profiles/group-utils';
import { useRuntimeQuery } from '@/features/browser/runtime/queries';
import { isTauriRuntime } from '@/lib/desktop';
import { formatDateTimeTitle, formatDisplayDateTime } from '@/lib/date-time';
import { cn } from '@/lib/utils';
import {
  ArrowRight01Icon,
  PlayIcon,
  StopIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';
import { Link } from 'react-router-dom';

const RECENT_LIMIT = 10;

/**
 * The environments people come back to, newest first, each one click from
 * launching. Opening goes through the same desktop-app gate and Chromium
 * preflight as the environments page.
 */
export function RecentEnvironments() {
  const { access } = useAuth();
  const teamsQuery = useRemoteTeamsQuery({ page_size: 100 });
  const teams = React.useMemo(
    () => teamsQuery.data?.list ?? [],
    [teamsQuery.data?.list],
  );
  const [teamId] = useSelectedRemoteTeamId(teams);
  const teamName = teams.find((team) => team.team_id === teamId)?.team_name;
  const canList = hasPermission(access, 'browser:environment:list', teamId);
  const canOpen = hasButtonPermission(
    access,
    'browser:environment:open',
    teamId,
  );
  const canClose = hasButtonPermission(
    access,
    'browser:environment:close',
    teamId,
  );
  const enabled = canList && Boolean(teamId);

  const listQuery = useRemoteEnvironmentsQuery(
    { page_size: 100, team_id: teamId ?? undefined },
    enabled,
  );
  const runtimeQuery = useRuntimeQuery({
    enabled: isTauriRuntime() && enabled,
  });
  const localRuntimeByProfileId = React.useMemo(
    () =>
      new Map(
        (runtimeQuery.data ?? []).map(
          (runtime) => [runtime.profileId, runtime] as const,
        ),
      ),
    [runtimeQuery.data],
  );
  const localRuntimeEnvironmentIds = React.useMemo(() => {
    const ids = new Set<number>();
    for (const runtime of runtimeQuery.data ?? []) {
      const id = parseRemoteEnvironmentProfileId(runtime.profileId);
      if (id !== null) ids.add(id);
    }
    return ids;
  }, [runtimeQuery.data]);
  const environments = React.useMemo(() => {
    const list = listQuery.data?.list ?? [];
    const merged = runtimeQuery.data
      ? list.map((item) =>
          applyLocalRuntimeState(item, localRuntimeByProfileId),
        )
      : list;
    return [...merged].sort(compareRecent);
  }, [listQuery.data?.list, localRuntimeByProfileId, runtimeQuery.data]);
  const recent = environments.slice(0, RECENT_LIMIT);

  const actions = useEnvironmentActions({
    environments,
    filteredEnvironments: recent,
    localRuntimeEnvironmentIds,
    selectedTeamId: teamId,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canChangeStatus: false,
  });

  if (!teamsQuery.isLoading && (!teamId || !canList)) {
    return null;
  }

  const total = listQuery.data?.total ?? environments.length;

  return (
    <section className="flex min-w-0 flex-col">
      <header className="flex h-10 items-center justify-between gap-3 px-4">
        <h2 className="flex min-w-0 items-baseline gap-2 text-[0.8125rem] font-semibold">
          最近使用的环境
          {teamName ? (
            <span className="text-muted-foreground truncate text-[0.6875rem] font-normal">
              {teamName}
            </span>
          ) : null}
        </h2>
        <Link
          to="/environments"
          className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-0.5 text-[0.6875rem]"
        >
          全部 {total} 个
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-3"
          />
        </Link>
      </header>

      {listQuery.isLoading || teamsQuery.isLoading ? (
        <div className="text-muted-foreground flex h-24 items-center justify-center gap-2 text-xs">
          <Spinner /> 加载环境…
        </div>
      ) : listQuery.isError ? (
        <p className="text-destructive px-4 pb-4 text-xs">
          环境加载失败：{listQuery.error.message}
        </p>
      ) : recent.length ? (
        <ul className="border-t">
          {recent.map((environment) => (
            <EnvironmentRow
              key={environment.environment_id}
              environment={environment}
              canOpen={canOpen}
              canClose={canClose}
              hasLocalRuntime={localRuntimeEnvironmentIds.has(
                environment.environment_id,
              )}
              actions={actions}
            />
          ))}
        </ul>
      ) : (
        <div className="text-muted-foreground flex h-24 flex-col items-center justify-center gap-1 border-t text-xs">
          这个团队还没有环境
          <Link
            to="/environments"
            className="text-primary underline-offset-4 hover:underline"
          >
            去创建环境
          </Link>
        </div>
      )}
    </section>
  );
}

function EnvironmentRow({
  environment,
  canOpen,
  canClose,
  hasLocalRuntime,
  actions,
}: {
  environment: RemoteEnvironmentListItem;
  canOpen: boolean;
  canClose: boolean;
  hasLocalRuntime: boolean;
  actions: ReturnType<typeof useEnvironmentActions>;
}) {
  const id = environment.environment_id;
  const isActive = environment.runtime_status === 'active';
  const shouldClose = isActive && hasLocalRuntime;
  const pendingHere =
    actions.isRuntimePending && actions.runtimeEnvironmentId === id;
  const isOpening =
    environment.runtime_status === 'starting' ||
    (pendingHere && actions.runtimeAction === 'open');
  const isClosing =
    environment.runtime_status === 'stopping' ||
    (pendingHere && actions.runtimeAction === 'close');
  const disabled =
    actions.isRuntimePending ||
    (actions.isCheckingLaunchStatus && !shouldClose) ||
    environment.status === '1' ||
    (!isActive && environment.runtime_status !== 'inactive');
  const allowed = shouldClose ? canClose : canOpen;

  const group = normalizeProfileGroup(environment.group_key);
  const code = resolveCountryCode(
    environment.proxy_last_check_country_code,
    environment.proxy_last_check_country,
  );
  const location = environment.proxy_id
    ? environment.proxy_last_check_exit_ip || environment.proxy_name || '未检测'
    : '直连';

  return (
    <li className="hover:bg-muted/50 grid h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6.5rem_auto]">
      <div className="flex min-w-0 items-center gap-2">
        <StatusDot environment={environment} />
        <span
          className="truncate text-[0.8125rem] font-medium"
          title={environment.name}
        >
          {environment.name}
        </span>
        {group ? (
          <span className="bg-muted text-muted-foreground max-w-24 shrink-0 truncate rounded px-1.5 text-[0.625rem] leading-4">
            {group}
          </span>
        ) : null}
      </div>
      <div className="text-muted-foreground hidden min-w-0 items-center gap-1.5 text-xs sm:flex">
        <CountryFlag
          code={code}
          country={environment.proxy_last_check_country}
        />
        <span
          className="truncate tabular-nums"
          title={environment.proxy_name ?? undefined}
        >
          {location}
        </span>
      </div>
      <span
        className="text-muted-foreground hidden truncate text-xs sm:block"
        title={formatDateTimeTitle(environment.last_open_at)}
      >
        {formatDisplayDateTime(environment.last_open_at, '从未启动')}
      </span>
      {allowed ? (
        <Button
          size="sm"
          variant={shouldClose ? 'outline' : 'default'}
          className="h-7 w-16 gap-1 px-2 text-xs"
          aria-busy={isOpening || isClosing || undefined}
          aria-label={`${shouldClose ? '关闭' : '启动'}环境 ${environment.name}`}
          disabled={disabled}
          onClick={() =>
            shouldClose ? actions.close(id) : void actions.open(id)
          }
        >
          {isOpening || isClosing ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <HugeiconsIcon
              icon={shouldClose ? StopIcon : PlayIcon}
              strokeWidth={2}
              data-icon="inline-start"
            />
          )}
          {shouldClose
            ? '关闭'
            : isOpening
              ? '启动中'
              : environment.runtime_status === 'error'
                ? '重试'
                : '启动'}
        </Button>
      ) : (
        <span className="w-16" />
      )}
    </li>
  );
}

function StatusDot({
  environment,
}: {
  environment: RemoteEnvironmentListItem;
}) {
  const { label, className } = statusOf(environment);
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn('size-1.5 shrink-0 rounded-full', className)}
    />
  );
}

function statusOf(environment: RemoteEnvironmentListItem) {
  if (environment.status === '1') {
    return { label: '已停用', className: 'bg-muted-foreground/30' };
  }
  switch (environment.runtime_status) {
    case 'active':
      return {
        label:
          environment.runtime_user_count > 0
            ? `运行中 · ${environment.runtime_user_count} 人使用`
            : '运行中',
        className: 'bg-success',
      };
    case 'starting':
    case 'stopping':
      return { label: '切换中', className: 'bg-warning animate-pulse' };
    case 'error':
      return { label: '异常', className: 'bg-destructive' };
    default:
      return { label: '未启动', className: 'bg-muted-foreground/50' };
  }
}

/** Running first, then most recently opened, then newest. */
function compareRecent(
  a: RemoteEnvironmentListItem,
  b: RemoteEnvironmentListItem,
) {
  const running =
    Number(b.runtime_status === 'active') -
    Number(a.runtime_status === 'active');
  if (running) return running;
  const opened = timeOf(b.last_open_at) - timeOf(a.last_open_at);
  if (opened) return opened;
  return timeOf(b.created_at) - timeOf(a.created_at);
}

function timeOf(value: string | null) {
  const time = value ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? 0 : time;
}
