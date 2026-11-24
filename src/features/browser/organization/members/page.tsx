import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-gate';
import {
  hasAnyTeamPermission,
  hasButtonPermission,
  hasPermission,
} from '@/features/auth/permissions';
import { useBrowserShell } from '@/features/browser-shell/dashboard-shell';
import {
  BrowserDataTable,
  BrowserTableColumnVisibilityMenu,
} from '@/features/browser/components/data-table';
import {
  BROWSER_STATUS_FILTERS,
  type BrowserStatusFilter,
  BrowserTableFilterTabs,
  BrowserTableRefreshButton,
  BrowserTableToolbar,
} from '@/features/browser/components/table-toolbar';
import { UserAdd01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { VisibilityState } from '@tanstack/react-table';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

import { TeamInviteDialog } from '../teams/components/team-invite-dialog';
import { useRemoteTeamsQuery } from '../teams/queries';
import {
  RemoteTeamRequiredState,
  useSelectedRemoteTeamId,
} from '../teams/team-scope';
import { useMemberColumns } from './components/member-columns';
import { MemberEnvironmentAuthorizationDialog } from './components/member-environment-authorization-dialog';
import {
  MemberDisableDialog,
  MemberRemovalDialog,
  NoMemberPermissionState,
} from './components/member-page-states';
import { MemberRoleDialog } from './components/member-role-dialog';
import {
  useRemoteMemberStatusMutation,
  useRemoteMembersQuery,
  useRemoveRemoteTeamMemberMutation,
  useUpdateRemoteMemberEnvironmentAuthorizationMutation,
  useUpdateRemoteMemberRolesMutation,
} from './queries';
import type {
  RemoteMemberEnvironmentAuthorizationPayload,
  RemoteMemberResource,
  RemoteMemberRolesPayload,
  RemoteStatusFlag,
} from './types';
import { useMemberInvite } from './use-member-invite';

export function RemoteMembersPage() {
  const { user, access } = useAuth();
  const { search } = useBrowserShell();
  const teamsQuery = useRemoteTeamsQuery({ page_size: 100 });
  const teams = React.useMemo(
    () => teamsQuery.data?.list ?? [],
    [teamsQuery.data?.list],
  );
  const [selectedTeamId] = useSelectedRemoteTeamId(teams);
  const canListMembersInAnyTeam = hasAnyTeamPermission(
    access,
    'browser:member:list',
  );
  const canListMembers = hasPermission(
    access,
    'browser:member:list',
    selectedTeamId,
  );
  const canCreateMembers =
    hasButtonPermission(access, 'browser:member:create', selectedTeamId) &&
    hasButtonPermission(access, 'browser:role:update', selectedTeamId);
  const canChangeMemberStatus = hasButtonPermission(
    access,
    'browser:member:status',
    selectedTeamId,
  );
  const canConfigureMemberPermissions = hasButtonPermission(
    access,
    'browser:member:permission',
    selectedTeamId,
  );
  const [roleTarget, setRoleTarget] =
    React.useState<RemoteMemberResource | null>(null);
  const [environmentTarget, setEnvironmentTarget] =
    React.useState<RemoteMemberResource | null>(null);
  const [removeTarget, setRemoveTarget] =
    React.useState<RemoteMemberResource | null>(null);
  const [disableTarget, setDisableTarget] =
    React.useState<RemoteMemberResource | null>(null);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [statusFilter, setStatusFilter] =
    React.useState<BrowserStatusFilter>('all');
  const params = React.useMemo(
    () => ({
      page_size: 100,
      keyword: search.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      team_id: selectedTeamId ?? undefined,
    }),
    [search, selectedTeamId, statusFilter],
  );
  const membersQuery = useRemoteMembersQuery(
    params,
    canListMembers && Boolean(selectedTeamId),
  );
  const statusMutation = useRemoteMemberStatusMutation();
  const roleMutation = useUpdateRemoteMemberRolesMutation();
  const environmentAuthorizationMutation =
    useUpdateRemoteMemberEnvironmentAuthorizationMutation();
  const removeMutation = useRemoveRemoteTeamMemberMutation();
  const selectedTeam = React.useMemo(
    () => teams.find((team) => team.team_id === selectedTeamId) ?? null,
    [selectedTeamId, teams],
  );
  const canRemoveMembers =
    Boolean(selectedTeam?.is_owner) &&
    hasButtonPermission(access, 'browser:member:remove', selectedTeam?.team_id);
  const invite = useMemberInvite({ access, teams, selectedTeamId });
  const updateMemberStatus = React.useCallback(
    (record: RemoteMemberResource, status: RemoteStatusFlag) => {
      if (record.user_id === user.user_id) {
        toast.error('不能修改自己的成员状态');
        return;
      }
      if (
        !hasButtonPermission(access, 'browser:member:status', record.team_id)
      ) {
        return;
      }

      statusMutation.mutate(
        {
          memberId: record.member_id,
          teamId: record.team_id,
          status,
        },
        {
          onSuccess: () => {
            toast.success(status === '0' ? '成员已启用' : '成员已停用');
            if (status === '1') {
              setDisableTarget(null);
            }
          },
        },
      );
    },
    [access, statusMutation, user.user_id],
  );
  const requestMemberStatusChange = React.useCallback(
    (record: RemoteMemberResource, status: RemoteStatusFlag) => {
      if (status === '1') {
        setDisableTarget(record);
        return;
      }
      updateMemberStatus(record, status);
    },
    [updateMemberStatus],
  );
  const isCurrentUserMember = React.useCallback(
    (record: RemoteMemberResource) => record.user_id === user.user_id,
    [user.user_id],
  );
  const canConfigureMember = React.useCallback(
    (record: RemoteMemberResource) => {
      if (isCurrentUserMember(record)) {
        toast.error('不能修改自己的角色或环境授权');
        return false;
      }

      return true;
    },
    [isCurrentUserMember],
  );
  const openMemberRoles = React.useCallback(
    (record: RemoteMemberResource) => {
      if (canConfigureMember(record)) {
        setRoleTarget(record);
      }
    },
    [canConfigureMember],
  );
  const openMemberEnvironments = React.useCallback(
    (record: RemoteMemberResource) => {
      if (canConfigureMember(record)) {
        setEnvironmentTarget(record);
      }
    },
    [canConfigureMember],
  );
  const canConfigureMemberAccess = React.useCallback(
    (record: RemoteMemberResource) =>
      hasButtonPermission(access, 'browser:member:permission', record.team_id),
    [access],
  );
  const columns = useMemberColumns({
    selectedTeam,
    canChangeStatus: canChangeMemberStatus,
    canConfigurePermissions: canConfigureMemberPermissions,
    canRemoveMembers,
    isStatusPending: statusMutation.isPending,
    isSavingAccess:
      roleMutation.isPending || environmentAuthorizationMutation.isPending,
    isRemovingMember: removeMutation.isPending,
    isCurrentUser: isCurrentUserMember,
    canConfigureAccess: canConfigureMemberAccess,
    onStatusChange: requestMemberStatusChange,
    onAssignRoles: openMemberRoles,
    onAuthorizeEnvironments: openMemberEnvironments,
    onRemoveMember: setRemoveTarget,
  });

  function updateMemberRoles(
    memberId: number,
    payload: RemoteMemberRolesPayload,
  ) {
    if (roleTarget && isCurrentUserMember(roleTarget)) {
      toast.error('不能修改自己的角色');
      return;
    }

    roleMutation.mutate(
      { memberId, payload },
      {
        onSuccess: () => {
          toast.success('成员角色已保存');
          setRoleTarget(null);
        },
      },
    );
  }

  function updateMemberEnvironmentAuthorization(
    memberId: number,
    payload: RemoteMemberEnvironmentAuthorizationPayload,
  ) {
    if (environmentTarget && isCurrentUserMember(environmentTarget)) {
      toast.error('不能修改自己的环境授权');
      return;
    }

    environmentAuthorizationMutation.mutate(
      { memberId, payload },
      {
        onSuccess: () => {
          toast.success('环境授权已保存');
          setEnvironmentTarget(null);
        },
      },
    );
  }

  function removeMember() {
    if (
      !removeTarget ||
      !selectedTeam?.is_owner ||
      selectedTeam.owner_member_id === removeTarget.member_id ||
      !hasButtonPermission(
        access,
        'browser:member:remove',
        removeTarget.team_id,
      )
    ) {
      return;
    }

    removeMutation.mutate(
      {
        teamId: removeTarget.team_id,
        memberId: removeTarget.member_id,
      },
      {
        onSuccess: () => {
          toast.success('成员已移出');
          setRemoveTarget(null);
        },
      },
    );
  }

  if (!canListMembersInAnyTeam) {
    return <NoMemberPermissionState />;
  }

  if (!teams.length) {
    return (
      <RemoteTeamRequiredState
        isLoading={teamsQuery.isLoading}
        error={teamsQuery.error}
      />
    );
  }

  if (!canListMembers) {
    return (
      <NoMemberPermissionState description="请联系管理员授予当前团队的成员查看权限。" />
    );
  }

  return (
    <div className="bg-card flex min-h-0 flex-1 flex-col">
      <BrowserTableToolbar
        filters={
          <BrowserTableFilterTabs
            label="成员状态"
            options={BROWSER_STATUS_FILTERS}
            value={statusFilter}
            onValueChange={setStatusFilter}
          />
        }
        actions={
          <>
            <BrowserTableRefreshButton
              isRefreshing={membersQuery.isFetching}
              onRefresh={membersQuery.refetch}
              successMessage="成员列表已刷新"
            />
            {canCreateMembers ? (
              <Button
                size="sm"
                disabled={invite.isSaving}
                onClick={invite.open}
              >
                <HugeiconsIcon
                  icon={UserAdd01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                邀请成员
              </Button>
            ) : null}
            <BrowserTableColumnVisibilityMenu
              columns={columns}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
            />
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <BrowserDataTable
          columns={columns}
          data={membersQuery.data?.list ?? []}
          emptyTitle="暂无成员"
          emptyDescription="生成一次性邀请后，对方登录或使用 Google 首次登录即可加入团队。"
          getRowId={(record) => String(record.member_id)}
          isLoading={membersQuery.isLoading}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />
      </div>

      <TeamInviteDialog
        open={invite.isOpen}
        teams={invite.inviteableTeams}
        selectedTeamId={invite.selectedTeamId}
        selectedTeam={invite.selectedTeam}
        roles={invite.roles}
        selectedRoleKey={invite.selectedRoleKey}
        selectedRole={invite.selectedRole}
        invite={invite.result}
        isLoadingTeams={teamsQuery.isLoading}
        isLoadingRoles={invite.isLoadingRoles}
        hasRoleError={invite.hasRoleError}
        onOpenChange={invite.changeOpen}
        onTeamChange={invite.changeTeam}
        onRoleChange={invite.changeRole}
        onDraftChange={invite.clearResult}
        isSaving={invite.isSaving}
        onSubmit={invite.create}
      />
      <MemberRoleDialog
        open={Boolean(roleTarget)}
        record={roleTarget}
        canSubmit={
          canConfigureMemberPermissions &&
          (roleTarget ? !isCurrentUserMember(roleTarget) : false)
        }
        canAssignManagedRoles={
          roleTarget
            ? hasButtonPermission(
                access,
                'browser:role:update',
                roleTarget.team_id,
              )
            : false
        }
        isSaving={roleMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !roleMutation.isPending) {
            setRoleTarget(null);
          }
        }}
        onSubmit={updateMemberRoles}
      />
      <MemberEnvironmentAuthorizationDialog
        open={Boolean(environmentTarget)}
        record={environmentTarget}
        canSubmit={
          canConfigureMemberPermissions &&
          (environmentTarget ? !isCurrentUserMember(environmentTarget) : false)
        }
        isSaving={environmentAuthorizationMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !environmentAuthorizationMutation.isPending) {
            setEnvironmentTarget(null);
          }
        }}
        onSubmit={updateMemberEnvironmentAuthorization}
      />
      <MemberRemovalDialog
        target={removeTarget}
        selectedTeam={selectedTeam}
        isRemoving={removeMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !removeMutation.isPending) {
            setRemoveTarget(null);
          }
        }}
        onConfirm={removeMember}
      />
      <MemberDisableDialog
        target={disableTarget}
        isSaving={statusMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !statusMutation.isPending) {
            setDisableTarget(null);
          }
        }}
        onConfirm={() => {
          if (disableTarget) {
            updateMemberStatus(disableTarget, '1');
          }
        }}
      />
    </div>
  );
}
