import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  hasAnyTeamPermission,
  hasButtonPermission,
  hasPermission,
} from '@/features/auth/permissions';
import type { AuthPermissions } from '@/features/auth/types';
import {
  type RemoteEnvironmentDialogState,
  RemoteEnvironmentEditorDialog,
  type RemoteEnvironmentPayload,
  useCreateRemoteEnvironmentMutation,
} from '@/features/browser/environments/public';
import {
  type RemoteTeamResource,
  useRemoteTeamsQuery,
  useSelectedRemoteTeamId,
} from '@/features/browser/organization/teams/public';
import { useRemoteProxiesQuery } from '@/features/browser/remote-proxies/public';
import { cn } from '@/lib/utils';
import {
  ArrowDown01Icon,
  DashboardBrowsingIcon,
  UserSwitchIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

const teamsParams = { page_size: 100 } as const;

export function AppTeamSwitcher({ access }: { access: AuthPermissions }) {
  const canReadTeams =
    hasPermission(access, 'browser:team:list') ||
    hasAnyTeamPermission(access, 'browser:team:list');
  const teamsQuery = useRemoteTeamsQuery(teamsParams, canReadTeams);
  const teams = teamsQuery.data?.list ?? [];
  const [selectedTeamId, setSelectedTeamId] = useSelectedRemoteTeamId(teams);
  const canCreateEnvironment = hasButtonPermission(
    access,
    'browser:environment:create',
    selectedTeamId,
  );
  const canListProxies = hasPermission(
    access,
    'browser:proxy:list',
    selectedTeamId,
  );
  const [dialogState, setDialogState] =
    React.useState<RemoteEnvironmentDialogState | null>(null);
  const createMutation = useCreateRemoteEnvironmentMutation();
  const proxiesQuery = useRemoteProxiesQuery(
    { page_size: 100, team_id: selectedTeamId ?? undefined },
    canListProxies && Boolean(dialogState && selectedTeamId),
  );
  const selectedTeam =
    teams.find((team) => team.team_id === selectedTeamId) ?? null;

  if (!canReadTeams && !canCreateEnvironment) {
    return null;
  }

  function openEnvironmentDialog() {
    if (!selectedTeamId) {
      toast.error('请选择团队');
      return;
    }

    setDialogState({ mode: 'create' });
  }

  function submitEnvironment(payload: RemoteEnvironmentPayload) {
    if (!canCreateEnvironment) {
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('环境已创建');
        setDialogState(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <ButtonGroup className="w-full">
        {canReadTeams ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'min-w-0 flex-1 justify-start px-2',
                  canCreateEnvironment && 'rounded-r-none',
                )}
                aria-label="切换团队"
                title={resolveTeamTooltip(teamsQuery.error, selectedTeam)}
              >
                {teamsQuery.isFetching ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <HugeiconsIcon
                    icon={UserSwitchIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                )}
                <span className="truncate">
                  {resolveTeamLabel({
                    isError: teamsQuery.isError,
                    isLoading: teamsQuery.isLoading,
                    selectedTeam,
                    teams,
                  })}
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                  className="ml-auto"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" side="right" align="start">
              <DropdownMenuLabel>切换团队</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {teamsQuery.isLoading ? (
                <DropdownMenuLabel>正在读取团队...</DropdownMenuLabel>
              ) : teamsQuery.isError ? (
                <DropdownMenuLabel>
                  {teamsQuery.error instanceof Error
                    ? teamsQuery.error.message
                    : '无法读取团队'}
                </DropdownMenuLabel>
              ) : teams.length ? (
                <DropdownMenuRadioGroup
                  value={selectedTeamId ? String(selectedTeamId) : ''}
                  onValueChange={(value) => {
                    const teamId = Number(value);
                    if (Number.isFinite(teamId) && teamId > 0) {
                      setSelectedTeamId(teamId);
                    }
                  }}
                >
                  {teams.map((team) => (
                    <DropdownMenuRadioItem
                      key={team.team_id}
                      value={String(team.team_id)}
                    >
                      <TeamMenuItem team={team} />
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              ) : (
                <DropdownMenuLabel>暂无团队</DropdownMenuLabel>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {canCreateEnvironment ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(canReadTeams && 'rounded-l-none')}
                aria-label="新增环境"
                disabled={createMutation.isPending}
                onClick={openEnvironmentDialog}
              >
                <HugeiconsIcon icon={DashboardBrowsingIcon} strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {selectedTeamId ? '新增环境' : '请选择团队'}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </ButtonGroup>

      {canCreateEnvironment ? (
        <RemoteEnvironmentEditorDialog
          key={dialogState ? 'create' : 'closed'}
          state={dialogState}
          teamId={selectedTeamId}
          proxies={proxiesQuery.data?.list ?? []}
          proxiesLoading={proxiesQuery.isLoading}
          isSaving={createMutation.isPending}
          onOpenChange={(open) => {
            if (!open && createMutation.isPending) {
              return;
            }
            setDialogState(open ? { mode: 'create' } : null);
          }}
          onSubmit={submitEnvironment}
        />
      ) : null}
    </div>
  );
}

function TeamMenuItem({ team }: { team: RemoteTeamResource }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium">{team.team_name}</div>
      <div className="text-muted-foreground truncate text-[0.6875rem]">
        {team.member_count} 成员 · {team.environment_count} 环境 ·{' '}
        {team.proxy_count} 代理
      </div>
    </div>
  );
}

function resolveTeamLabel({
  isError,
  isLoading,
  selectedTeam,
  teams,
}: {
  isError: boolean;
  isLoading: boolean;
  selectedTeam: RemoteTeamResource | null;
  teams: RemoteTeamResource[];
}) {
  if (selectedTeam) {
    return selectedTeam.team_name;
  }

  if (isLoading) {
    return '读取团队...';
  }

  if (isError) {
    return '无法读取团队';
  }

  return teams.length ? '选择团队' : '暂无团队';
}

function resolveTeamTooltip(
  error: unknown,
  selectedTeam: RemoteTeamResource | null,
) {
  if (selectedTeam) {
    return `切换团队：${selectedTeam.team_name}`;
  }

  return error instanceof Error ? error.message : '切换团队';
}
