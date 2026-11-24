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
import { Add01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type {
  OnChangeFn,
  RowSelectionState,
  VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

import { useRemoteTeamsQuery } from '../teams/queries';
import {
  RemotePermissionRequiredState,
  RemoteTeamRequiredState,
  useSelectedRemoteTeamId,
} from '../teams/team-scope';
import { useRoleColumns } from './components/role-columns';
import { RoleDialog } from './components/role-dialog';
import {
  RoleBulkActions,
  RoleDeleteDialog,
  RoleLoadErrorState,
} from './components/role-page-states';
import {
  useCreateRemoteTeamRoleMutation,
  useDeleteRemoteTeamRoleMutation,
  useDeleteRemoteTeamRolesMutation,
  useRemoteTeamRolePermissionsQuery,
  useRemoteTeamRolesQuery,
  useUpdateRemoteTeamRoleMutation,
} from './queries';
import type { RemoteTeamRolePayload, RemoteTeamRoleResource } from './types';
import type { RemoteMemberPermissionOptionResource } from './types';

type RoleDialogState =
  { mode: 'create' } | { mode: 'edit'; record: RemoteTeamRoleResource };

type RoleDeleteSource = 'row' | 'bulk';

type ScopedRowSelection = {
  scope: string;
  value: RowSelectionState;
};

const EMPTY_ROW_SELECTION: RowSelectionState = {};

export function RemoteRolesPage() {
  const { access } = useAuth();
  const { search } = useBrowserShell();
  const teamsQuery = useRemoteTeamsQuery({ page_size: 100 });
  const teams = React.useMemo(
    () => teamsQuery.data?.list ?? [],
    [teamsQuery.data?.list],
  );
  const [selectedTeamId] = useSelectedRemoteTeamId(teams);
  const selectedTeam = teams.find((team) => team.team_id === selectedTeamId);
  const canListRolesInAnyTeam = hasAnyTeamPermission(
    access,
    'browser:role:list',
  );
  const canListRoles = hasPermission(
    access,
    'browser:role:list',
    selectedTeamId,
  );
  const canCreateRole = hasButtonPermission(
    access,
    'browser:role:create',
    selectedTeamId,
  );
  const canUpdateRole = hasButtonPermission(
    access,
    'browser:role:update',
    selectedTeamId,
  );
  const canDeleteRole = hasButtonPermission(
    access,
    'browser:role:delete',
    selectedTeamId,
  );
  const [dialogState, setDialogState] = React.useState<RoleDialogState | null>(
    null,
  );
  const [deleteTargets, setDeleteTargets] = React.useState<
    RemoteTeamRoleResource[]
  >([]);
  const [deleteSource, setDeleteSource] =
    React.useState<RoleDeleteSource>('row');
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [statusFilter, setStatusFilter] =
    React.useState<BrowserStatusFilter>('all');
  const selectionScope = `${selectedTeamId ?? 'none'}:${statusFilter}:${search.trim()}`;
  const [scopedRowSelection, setScopedRowSelection] =
    React.useState<ScopedRowSelection>({
      scope: selectionScope,
      value: {},
    });
  const rowSelection =
    scopedRowSelection.scope === selectionScope
      ? scopedRowSelection.value
      : EMPTY_ROW_SELECTION;
  const setRowSelection = React.useCallback<OnChangeFn<RowSelectionState>>(
    (updater) => {
      setScopedRowSelection((current) => {
        const currentValue =
          current.scope === selectionScope ? current.value : {};
        return {
          scope: selectionScope,
          value:
            typeof updater === 'function' ? updater(currentValue) : updater,
        };
      });
    },
    [selectionScope],
  );
  const params = React.useMemo(
    () => ({
      page_size: 100,
      keyword: search.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      team_id: selectedTeamId ?? undefined,
    }),
    [search, selectedTeamId, statusFilter],
  );
  const rolesQuery = useRemoteTeamRolesQuery(
    params,
    canListRoles && Boolean(selectedTeamId),
  );
  const permissionsQuery = useRemoteTeamRolePermissionsQuery(
    selectedTeamId,
    canListRoles,
  );
  const createPermissionOptions = React.useMemo(
    () =>
      filterPermissionOptionsForCurrentUser(
        permissionsQuery.data ?? [],
        access,
        selectedTeamId,
      ),
    [access, permissionsQuery.data, selectedTeamId],
  );
  const createMutation = useCreateRemoteTeamRoleMutation();
  const updateMutation = useUpdateRemoteTeamRoleMutation();
  const deleteMutation = useDeleteRemoteTeamRoleMutation();
  const batchDeleteMutation = useDeleteRemoteTeamRolesMutation();
  const roles = React.useMemo(
    () => rolesQuery.data?.list ?? [],
    [rolesQuery.data?.list],
  );
  const selectedRoles = React.useMemo(
    () => roles.filter((role) => rowSelection[String(role.role_id)]),
    [roles, rowSelection],
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending || batchDeleteMutation.isPending;
  const updateRoleStatus = React.useCallback(
    (record: RemoteTeamRoleResource, enabled: boolean) => {
      updateMutation.mutate(
        {
          roleId: record.role_id,
          payload: {
            team_id: record.team_id,
            role_name: record.role_name,
            role_key: record.role_key,
            role_sort: record.role_sort,
            status: enabled ? '0' : '1',
            remark: record.remark ?? '',
            menus: record.menus,
            permissions: record.permissions,
          },
        },
        {
          onSuccess: () => {
            toast.success(enabled ? '角色已启用' : '角色已停用');
          },
        },
      );
    },
    [updateMutation],
  );
  const editRole = React.useCallback(
    (record: RemoteTeamRoleResource) =>
      setDialogState({ mode: 'edit', record }),
    [],
  );
  const requestRoleDelete = React.useCallback(
    (record: RemoteTeamRoleResource) => {
      setDeleteSource('row');
      setDeleteTargets([record]);
    },
    [],
  );
  const columns = useRoleColumns({
    canUpdate: canUpdateRole,
    canDelete: canDeleteRole,
    isSaving,
    isDeleting,
    onStatusChange: updateRoleStatus,
    onEdit: editRole,
    onDelete: requestRoleDelete,
  });

  function submitRole(payload: RemoteTeamRolePayload) {
    if (!dialogState) {
      return;
    }

    if (dialogState.mode === 'edit') {
      updateMutation.mutate(
        { roleId: dialogState.record.role_id, payload },
        {
          onSuccess: () => {
            toast.success('角色已更新');
            setDialogState(null);
          },
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('角色已创建');
        setDialogState(null);
      },
    });
  }

  function confirmRoleDelete() {
    if (!deleteTargets.length) {
      return;
    }
    const onSuccess = () => {
      toast.success(
        deleteTargets.length > 1
          ? `已删除 ${deleteTargets.length} 个角色`
          : '角色已删除',
      );
      setDeleteTargets([]);
      setRowSelection({});
    };
    if (deleteSource === 'bulk') {
      batchDeleteMutation.mutate(
        {
          team_id: deleteTargets[0].team_id,
          role_ids: deleteTargets.map((target) => target.role_id),
        },
        { onSuccess },
      );
      return;
    }
    const [target] = deleteTargets;
    deleteMutation.mutate(
      { roleId: target.role_id, teamId: target.team_id },
      { onSuccess },
    );
  }

  if (!canListRolesInAnyTeam) {
    return (
      <RemotePermissionRequiredState
        title="没有角色管理权限"
        description="当前账号未获得角色管理菜单权限。"
      />
    );
  }

  if (!teams.length) {
    return (
      <RemoteTeamRequiredState
        isLoading={teamsQuery.isLoading}
        error={teamsQuery.error}
      />
    );
  }

  if (!canListRoles) {
    return (
      <RemotePermissionRequiredState
        title="没有角色管理权限"
        description="当前团队未授予角色管理菜单权限。"
      />
    );
  }

  return (
    <div className="bg-card flex min-h-0 flex-1 flex-col">
      <BrowserTableToolbar
        filters={
          <BrowserTableFilterTabs
            label="角色状态"
            options={BROWSER_STATUS_FILTERS}
            value={statusFilter}
            onValueChange={setStatusFilter}
          />
        }
        actions={
          <>
            <BrowserTableRefreshButton
              isRefreshing={
                rolesQuery.isFetching || permissionsQuery.isFetching
              }
              onRefresh={async () => {
                const results = await Promise.all([
                  rolesQuery.refetch(),
                  permissionsQuery.refetch(),
                ]);
                return {
                  isError: results.some((result) => result.isError),
                };
              }}
              successMessage="角色列表已刷新"
            />
            {canCreateRole ? (
              <Button
                size="sm"
                onClick={() => setDialogState({ mode: 'create' })}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                新增角色
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
        {rolesQuery.isError ? (
          <RoleLoadErrorState
            message={rolesQuery.error.message}
            onRetry={() => void rolesQuery.refetch()}
          />
        ) : (
          <BrowserDataTable
            columns={columns}
            data={roles}
            enableRowSelection={canDeleteRole}
            emptyTitle="暂无角色"
            emptyDescription="新增团队角色后，可以为成员组合菜单与按钮权限。"
            getRowId={(record) => String(record.role_id)}
            isLoading={rolesQuery.isLoading}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            onRowSelectionChange={setRowSelection}
            rowSelection={rowSelection}
            density="compact"
          />
        )}
      </div>

      {dialogState && selectedTeamId ? (
        <RoleDialog
          key={
            dialogState.mode === 'edit'
              ? `edit-${dialogState.record.role_id}`
              : `create-${selectedTeamId}`
          }
          mode={dialogState.mode}
          record={dialogState.mode === 'edit' ? dialogState.record : undefined}
          teamId={selectedTeamId}
          teamName={selectedTeam?.team_name ?? `团队 ${selectedTeamId}`}
          permissionOptions={
            dialogState.mode === 'create'
              ? createPermissionOptions
              : (permissionsQuery.data ?? [])
          }
          isLoadingPermissions={permissionsQuery.isLoading}
          hasPermissionError={permissionsQuery.isError}
          onRetryPermissions={() => void permissionsQuery.refetch()}
          isSaving={isSaving}
          onOpenChange={(open) => {
            if (!open && !isSaving) {
              setDialogState(null);
            }
          }}
          onSubmit={submitRole}
        />
      ) : null}

      {canDeleteRole && selectedRoles.length ? (
        <RoleBulkActions
          selectedCount={selectedRoles.length}
          isDeleting={isDeleting}
          onClear={() => setRowSelection({})}
          onDelete={() => {
            setDeleteSource('bulk');
            setDeleteTargets(selectedRoles);
          }}
        />
      ) : null}

      <RoleDeleteDialog
        targets={deleteTargets}
        canDelete={canDeleteRole}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTargets([]);
          }
        }}
        onConfirm={confirmRoleDelete}
      />
    </div>
  );
}

function filterPermissionOptionsForCurrentUser(
  options: RemoteMemberPermissionOptionResource[],
  access: ReturnType<typeof useAuth>['access'],
  teamId: number | null,
) {
  if (!teamId || access.is_super_admin) {
    return options;
  }

  const optionById = new Map(options.map((option) => [option.menu_id, option]));
  const includedIds = new Set(
    options
      .filter(
        (option) =>
          option.permission_code &&
          hasPermission(access, option.permission_code, teamId),
      )
      .map((option) => option.menu_id),
  );

  for (const option of options) {
    if (!includedIds.has(option.menu_id)) continue;
    let parentId = option.parent_id;
    while (parentId) {
      includedIds.add(parentId);
      parentId = optionById.get(parentId)?.parent_id ?? null;
    }
  }

  return options.filter((option) => includedIds.has(option.menu_id));
}
