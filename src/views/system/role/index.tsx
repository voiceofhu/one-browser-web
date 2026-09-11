import { DialogActionButton } from '@/components/ui/dialog-action-button';
import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SystemResourceTable } from '@/components/system-resource-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from '@/components/responsive-dialog';
import { useAuth } from '@/features/auth/auth-gate';
import {
  hasButtonPermission,
  hasPermission,
} from '@/features/auth/permissions';
import { toBrowserErrorMessage } from '@/features/browser/errors';
import { useRemoteTeamsQuery } from '@/features/browser/organization/teams/queries';
import {
  useSelectedRemoteTeamId,
  RemoteTeamRequiredState,
  RemotePermissionRequiredState,
} from '@/features/browser/organization/teams/team-scope';
import type { RemoteTeamResource } from '@/features/browser/organization/teams/types';
import { RoleDialog } from '@/features/browser/organization/roles/components/role-dialog';
import { useRemoteTeamRolePermissionsQuery } from '@/features/browser/organization/roles/queries';
import {
  createRemoteTeamRole,
  updateRemoteTeamRole,
  deleteRemoteTeamRole,
} from '@/features/browser/organization/roles/api';
import type {
  RemoteTeamRoleResource,
  RemoteTeamRolePayload,
} from '@/features/browser/organization/roles/types';
import { formatDateTimeTitle, formatDisplayDateTime } from '@/lib/date-time';
import { LoadingState } from '@/components/loading-state';

export default function RolePage() {
  const teamsQuery = useRemoteTeamsQuery({ page_size: 100 });
  const teams = React.useMemo(
    () => teamsQuery.data?.list ?? [],
    [teamsQuery.data],
  );
  const [teamId, setTeamId] = useSelectedRemoteTeamId(teams);
  if (teamsQuery.isPending) return <LoadingState label="正在加载角色管理..." />;
  if (teamsQuery.isError)
    return (
      <div className="text-destructive p-4 text-sm">
        {toBrowserErrorMessage(teamsQuery.error)}
        <Button variant="ghost" onClick={() => void teamsQuery.refetch()}>
          重试
        </Button>
      </div>
    );
  if (!teamId) return <RemoteTeamRequiredState />;
  return (
    <ScopedRolePage
      key={teamId}
      teamId={teamId}
      teams={teams}
      onTeamChange={setTeamId}
    />
  );
}

function ScopedRolePage({
  teamId,
  teams,
  onTeamChange,
}: {
  teamId: number;
  teams: RemoteTeamResource[];
  onTeamChange: (id: number) => void;
}) {
  const { access } = useAuth();
  const queryClient = useQueryClient();
  const canList = hasPermission(access, 'browser:role:list', teamId);
  const canCreate = hasButtonPermission(access, 'browser:role:create', teamId);
  const canUpdate = hasButtonPermission(access, 'browser:role:update', teamId);
  const canDelete = hasButtonPermission(access, 'browser:role:delete', teamId);
  const [editor, setEditor] = React.useState<{
    record?: RemoteTeamRoleResource;
  } | null>(null);
  const [confirmation, setConfirmation] = React.useState<{
    action: 'delete' | 'disable';
    record: RemoteTeamRoleResource;
  } | null>(null);
  const permissions = useRemoteTeamRolePermissionsQuery(
    teamId,
    canList && editor !== null,
  );
  const teamName =
    teams.find((team) => team.team_id === teamId)?.team_name ?? '';
  const mutation = useMutation({
    mutationFn: async (
      action:
        | { type: 'save'; payload: RemoteTeamRolePayload; roleId?: number }
        | { type: 'delete'; roleId: number },
    ) => {
      if (action.type === 'delete')
        return deleteRemoteTeamRole(action.roleId, teamId);
      if (action.payload.team_id !== teamId)
        throw new Error('团队已切换，请重新操作');
      return action.roleId
        ? updateRemoteTeamRole(action.roleId, action.payload)
        : createRemoteTeamRole(action.payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['system-resource', '/browser/roles'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['remote-browser', 'roles'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['remote-browser', 'members'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['remote-browser', 'teams'],
        }),
        queryClient.invalidateQueries({ queryKey: ['auth', 'permissions'] }),
      ]);
      setEditor(null);
      setConfirmation(null);
      toast.success('角色已保存');
    },
    onError: (error) => toast.error(toBrowserErrorMessage(error)),
  });
  function changeStatus(role: RemoteTeamRoleResource, status: '0' | '1') {
    mutation.mutate({
      type: 'save',
      roleId: role.role_id,
      payload: { ...role, team_id: teamId, status, remark: role.remark ?? '' },
    });
  }
  const teamFilter = (
    <Select
      value={String(teamId)}
      onValueChange={(value) => onTeamChange(Number(value))}
      disabled={mutation.isPending}
    >
      <SelectTrigger className="w-44" aria-label="筛选团队">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.team_id} value={String(team.team_id)}>
            {team.team_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  if (!canList)
    return (
      <div className="flex flex-col gap-3 p-4">
        {teamFilter}
        <RemotePermissionRequiredState
          title="当前团队没有角色管理权限"
          description="请选择其他团队，或联系当前团队拥有者授权。"
        />
      </div>
    );
  return (
    <>
      <SystemResourceTable
        config={{
          title: '角色管理',
          description: `${teamName} · 仅显示当前权限范围内的角色`,
          endpoint: '/browser/roles',
          queryParams: { team_id: teamId },
          serverPagination: true,
          columns: [
            'role_name',
            'role_key',
            'permissions',
            'status',
            'created_at',
          ],
        }}
        toolbarActions={
          <div className="flex items-center gap-2">
            {teamFilter}
            {canCreate && (
              <Button
                size="sm"
                disabled={mutation.isPending}
                onClick={() => setEditor({})}
              >
                新增角色
              </Button>
            )}
          </div>
        }
        renderCell={(field, _value, record) => {
          const role = record as unknown as RemoteTeamRoleResource;
          if (field === 'permissions')
            return (
              <Badge variant="outline">{role.permission_count} 项权限</Badge>
            );
          if (field === 'created_at')
            return (
              <span title={formatDateTimeTitle(role.created_at)}>
                {formatDisplayDateTime(role.created_at)}
              </span>
            );
          if (field === 'status')
            return (
              <Switch
                size="sm"
                checked={role.status === '0'}
                disabled={role.read_only || !canUpdate || mutation.isPending}
                aria-label={`${role.role_name}角色状态`}
                onCheckedChange={(checked) =>
                  checked
                    ? changeStatus(role, '0')
                    : setConfirmation({ action: 'disable', record: role })
                }
              />
            );
        }}
        renderRowActions={
          canUpdate || canDelete
            ? (record) => {
                const role = record as unknown as RemoteTeamRoleResource;
                if (role.read_only) return null;
                return (
                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mutation.isPending}
                        onClick={() => setEditor({ record: role })}
                      >
                        编辑
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={mutation.isPending}
                        onClick={() =>
                          setConfirmation({ action: 'delete', record: role })
                        }
                      >
                        删除
                      </Button>
                    )}
                  </div>
                );
              }
            : undefined
        }
      />
      {editor && (
        <RoleDialog
          key={editor.record?.role_id ?? 'new'}
          mode={editor.record ? 'edit' : 'create'}
          record={editor.record}
          teamId={teamId}
          teamName={teamName}
          permissionOptions={permissions.data ?? []}
          isLoadingPermissions={permissions.isPending}
          hasPermissionError={permissions.isError}
          onRetryPermissions={() => void permissions.refetch()}
          isSaving={mutation.isPending}
          onOpenChange={(open) => {
            if (!open && !mutation.isPending) setEditor(null);
          }}
          onSubmit={(payload) =>
            mutation.mutate({
              type: 'save',
              payload,
              roleId: editor.record?.role_id,
            })
          }
        />
      )}
      <ResponsiveDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setConfirmation(null);
        }}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {confirmation?.action === 'delete' ? '删除角色' : '停用角色'}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              确定{confirmation?.action === 'delete' ? '删除' : '停用'}「
              {confirmation?.record.role_name}
              」？关联成员将失去该角色提供的权限。
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <DialogActionButton
              action="cancel"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setConfirmation(null)}
            >
              取消
            </DialogActionButton>
            <DialogActionButton
              action="confirm"
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => {
                if (!confirmation) return;
                if (confirmation.action === 'delete')
                  mutation.mutate({
                    type: 'delete',
                    roleId: confirmation.record.role_id,
                  });
                else changeStatus(confirmation.record, '1');
              }}
            >
              确认
            </DialogActionButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
