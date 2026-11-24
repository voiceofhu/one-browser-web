import { hasButtonPermission } from '@/features/auth/permissions';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

import {
  useCreateRemoteTeamInviteMutation,
  useRemoteTeamInviteRolesQuery,
} from '../teams/queries';
import type {
  RemoteTeamInvitePayload,
  RemoteTeamInviteResource,
  RemoteTeamResource,
} from '../teams/types';

export function useMemberInvite({
  access,
  teams,
  selectedTeamId,
}: {
  access: Parameters<typeof hasButtonPermission>[0];
  teams: RemoteTeamResource[];
  selectedTeamId: number | null;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [teamId, setTeamId] = React.useState<number | null>(null);
  const [roleKey, setRoleKey] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<RemoteTeamInviteResource | null>(
    null,
  );
  const mutation = useCreateRemoteTeamInviteMutation();
  const inviteableTeams = React.useMemo(
    () =>
      teams.filter(
        (team) =>
          hasButtonPermission(access, 'browser:member:create', team.team_id) &&
          hasButtonPermission(access, 'browser:role:update', team.team_id),
      ),
    [access, teams],
  );
  const selectedInviteTeamId = React.useMemo(() => {
    if (teamId && inviteableTeams.some((team) => team.team_id === teamId)) {
      return teamId;
    }
    if (
      selectedTeamId &&
      inviteableTeams.some((team) => team.team_id === selectedTeamId)
    ) {
      return selectedTeamId;
    }
    return inviteableTeams[0]?.team_id ?? null;
  }, [inviteableTeams, selectedTeamId, teamId]);
  const rolesQuery = useRemoteTeamInviteRolesQuery(
    selectedInviteTeamId,
    isOpen && Boolean(selectedInviteTeamId),
  );
  const roles = React.useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const selectedRoleKey = React.useMemo(() => {
    if (roleKey && roles.some((role) => role.role_key === roleKey)) {
      return roleKey;
    }
    return roles[0]?.role_key ?? null;
  }, [roleKey, roles]);
  const selectedTeam = React.useMemo(
    () =>
      inviteableTeams.find((team) => team.team_id === selectedInviteTeamId) ??
      null,
    [inviteableTeams, selectedInviteTeamId],
  );
  const selectedRole = React.useMemo(
    () => roles.find((role) => role.role_key === selectedRoleKey) ?? null,
    [roles, selectedRoleKey],
  );

  function open() {
    if (!selectedInviteTeamId) {
      toast.error('请选择团队');
      return;
    }
    setResult(null);
    setTeamId(selectedInviteTeamId);
    setRoleKey(null);
    setIsOpen(true);
  }

  function changeOpen(nextOpen: boolean) {
    setIsOpen(nextOpen);
    if (!nextOpen) {
      setResult(null);
      setTeamId(null);
      setRoleKey(null);
    }
  }

  function changeTeam(nextTeamId: number) {
    setTeamId(nextTeamId);
    setRoleKey(null);
  }

  function create(teamId: number, payload: RemoteTeamInvitePayload) {
    if (!teamId) {
      toast.error('请选择团队');
      return;
    }
    if (!hasButtonPermission(access, 'browser:member:create', teamId)) {
      return;
    }
    mutation.mutate(
      { teamId, payload },
      {
        onSuccess: (invite) => {
          setResult(invite);
          toast.success(payload.email ? '邀请邮件已发送' : '邀请链接已生成');
        },
      },
    );
  }

  return {
    isOpen,
    inviteableTeams,
    selectedTeamId: selectedInviteTeamId,
    selectedTeam,
    roles,
    selectedRoleKey,
    selectedRole,
    result,
    isSaving: mutation.isPending,
    isLoadingRoles: rolesQuery.isLoading,
    hasRoleError: rolesQuery.isError,
    open,
    changeOpen,
    changeTeam,
    changeRole: setRoleKey,
    clearResult: () => setResult(null),
    create,
  };
}
