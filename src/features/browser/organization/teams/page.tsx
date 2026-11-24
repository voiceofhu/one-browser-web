import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialogActionButton,
  AlertDialogCancelButton,
} from '@/components/ui/dialog-action-button';
import { useAuth } from '@/features/auth/auth-gate';
import {
  hasAnyTeamButtonPermission,
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
import { formatDisplayDateTime } from '@/lib/date-time';
import { AddTeamIcon, Alert01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

import { TeamDialog } from './components/team-dialog';
import {
  DissolveTeamDialog,
  TransferTeamOwnershipDialog,
} from './components/team-ownership-dialogs';
import {
  StatusSwitchCell,
  TeamActionsMenu,
  TeamNameCell,
  TeamOwnerCell,
} from './components/team-table-cells';
import {
  useCreateRemoteTeamMutation,
  useDissolveRemoteTeamMutation,
  useLeaveRemoteTeamMutation,
  useRemoteTeamStatusMutation,
  useRemoteTeamsQuery,
  useTransferRemoteTeamOwnerMutation,
  useUpdateRemoteTeamMutation,
} from './queries';
import { selectRemoteTeamId } from './team-scope';
import type {
  RemoteStatusFlag,
  RemoteTeamPayload,
  RemoteTeamResource,
} from './types';

export function RemoteTeamsPage() {
  const { access } = useAuth();
  const { search } = useBrowserShell();
  const canCreateTeam = hasButtonPermission(access, 'browser:team:create');
  const canListTeams =
    hasPermission(access, 'browser:team:list') ||
    hasAnyTeamPermission(access, 'browser:team:list');
  const canUpdateTeamInAnyTeam = hasAnyTeamButtonPermission(
    access,
    'browser:team:update',
  );
  const canLeaveTeamInAnyTeam = hasAnyTeamButtonPermission(
    access,
    'browser:team:leave',
  );
  const canChangeTeamStatus = React.useCallback(
    (teamId: number) =>
      hasButtonPermission(access, 'browser:team:status', teamId),
    [access],
  );
  const canUpdateTeam = React.useCallback(
    (teamId: number) =>
      hasButtonPermission(access, 'browser:team:update', teamId),
    [access],
  );
  const canLeaveTeam = React.useCallback(
    (teamId: number) =>
      hasButtonPermission(access, 'browser:team:leave', teamId),
    [access],
  );
  const [dialogState, setDialogState] = React.useState<
    { mode: 'create' } | { mode: 'edit'; record: RemoteTeamResource } | null
  >(null);
  const [leaveTarget, setLeaveTarget] =
    React.useState<RemoteTeamResource | null>(null);
  const [transferTarget, setTransferTarget] =
    React.useState<RemoteTeamResource | null>(null);
  const [dissolveTarget, setDissolveTarget] =
    React.useState<RemoteTeamResource | null>(null);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [statusFilter, setStatusFilter] =
    React.useState<BrowserStatusFilter>('all');
  const params = React.useMemo(
    () => ({
      joined_only: true,
      page_size: 100,
      keyword: search.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [search, statusFilter],
  );
  const teamsQuery = useRemoteTeamsQuery(params, canListTeams);
  const teams = React.useMemo(
    () => teamsQuery.data?.list ?? [],
    [teamsQuery.data?.list],
  );
  const hasTeamActions =
    canUpdateTeamInAnyTeam ||
    canLeaveTeamInAnyTeam ||
    teams.some((team) => team.is_owner);
  const createMutation = useCreateRemoteTeamMutation();
  const updateMutation = useUpdateRemoteTeamMutation();
  const leaveMutation = useLeaveRemoteTeamMutation();
  const transferMutation = useTransferRemoteTeamOwnerMutation();
  const dissolveMutation = useDissolveRemoteTeamMutation();
  const statusMutation = useRemoteTeamStatusMutation();
  const isDialogSaving = createMutation.isPending || updateMutation.isPending;
  const toggleTeamStatus = React.useCallback(
    (record: RemoteTeamResource, status: RemoteStatusFlag) => {
      if (!canChangeTeamStatus(record.team_id)) {
        return;
      }

      statusMutation.mutate(
        { teamId: record.team_id, status },
        {
          onSuccess: () => {
            toast.success(status === '0' ? '团队已启用' : '团队已停用');
          },
        },
      );
    },
    [canChangeTeamStatus, statusMutation],
  );
  const columns = React.useMemo<ColumnDef<RemoteTeamResource>[]>(
    () => [
      {
        accessorKey: 'team_name',
        header: '团队',
        cell: ({ row }) => <TeamNameCell record={row.original} />,
      },
      {
        accessorKey: 'owner_name',
        header: 'Owner',
        cell: ({ row }) => <TeamOwnerCell record={row.original} />,
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => (
          <StatusSwitchCell
            label="团队状态"
            status={row.original.status}
            disabled={
              !canChangeTeamStatus(row.original.team_id) ||
              statusMutation.isPending
            }
            onChange={(status) => toggleTeamStatus(row.original, status)}
          />
        ),
      },
      {
        accessorKey: 'updated_at',
        header: '最近更新',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDisplayDateTime(
              row.original.updated_at || row.original.created_at,
            )}
          </span>
        ),
      },
      ...(hasTeamActions
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => (
                <TeamActionsMenu
                  record={row.original}
                  canUpdate={canUpdateTeam(row.original.team_id)}
                  canLeave={canLeaveTeam(row.original.team_id)}
                  isOwner={row.original.is_owner}
                  isUpdating={updateMutation.isPending}
                  isLeaving={leaveMutation.isPending}
                  isTransferring={transferMutation.isPending}
                  isDissolving={dissolveMutation.isPending}
                  onRename={(record) =>
                    setDialogState({ mode: 'edit', record })
                  }
                  onLeave={setLeaveTarget}
                  onTransfer={setTransferTarget}
                  onDissolve={setDissolveTarget}
                />
              ),
              enableHiding: false,
            } satisfies ColumnDef<RemoteTeamResource>,
          ]
        : []),
    ],
    [
      canChangeTeamStatus,
      canLeaveTeam,
      canUpdateTeam,
      hasTeamActions,
      leaveMutation.isPending,
      dissolveMutation.isPending,
      statusMutation.isPending,
      toggleTeamStatus,
      transferMutation.isPending,
      updateMutation.isPending,
    ],
  );

  function submitTeam(payload: RemoteTeamPayload) {
    if (!dialogState) {
      return;
    }

    if (dialogState.mode === 'edit') {
      if (!canUpdateTeam(dialogState.record.team_id)) {
        return;
      }
      updateMutation.mutate(
        { teamId: dialogState.record.team_id, payload },
        {
          onSuccess: () => {
            toast.success('团队已更新');
            setDialogState(null);
          },
        },
      );
      return;
    }

    if (canCreateTeam) {
      createMutation.mutate(payload, {
        onSuccess: (created) => {
          selectRemoteTeamId(created.id);
          toast.success('团队已创建');
          setDialogState(null);
        },
      });
    }
  }

  return (
    <div className="bg-card flex min-h-0 flex-1 flex-col">
      <BrowserTableToolbar
        filters={
          <BrowserTableFilterTabs
            label="团队状态"
            options={BROWSER_STATUS_FILTERS}
            value={statusFilter}
            onValueChange={setStatusFilter}
          />
        }
        actions={
          <>
            <BrowserTableRefreshButton
              isRefreshing={teamsQuery.isFetching}
              onRefresh={teamsQuery.refetch}
              successMessage="团队列表已刷新"
            />
            {canCreateTeam ? (
              <Button
                size="sm"
                onClick={() => setDialogState({ mode: 'create' })}
              >
                <HugeiconsIcon
                  icon={AddTeamIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                新增团队
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
          data={teams}
          emptyTitle="暂无团队"
          emptyDescription="创建或加入团队后，可以在这里查看团队资源。"
          getRowId={(record) => String(record.team_id)}
          isLoading={teamsQuery.isLoading}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />
      </div>

      {canCreateTeam || canUpdateTeamInAnyTeam ? (
        <TeamDialog
          open={Boolean(dialogState)}
          mode={dialogState?.mode ?? 'create'}
          record={dialogState?.mode === 'edit' ? dialogState.record : null}
          isSaving={isDialogSaving}
          onOpenChange={(open) => {
            if (!open && isDialogSaving) {
              return;
            }
            setDialogState(open ? (dialogState ?? { mode: 'create' }) : null);
          }}
          onSubmit={submitTeam}
        />
      ) : null}

      <AlertDialog
        open={Boolean(leaveTarget)}
        onOpenChange={(open) => {
          if (!open && !leaveMutation.isPending) {
            setLeaveTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>退出团队</AlertDialogTitle>
            <AlertDialogDescription>
              退出后将不再看到该团队的环境、代理和成员数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton disabled={leaveMutation.isPending} />
            <AlertDialogActionButton
              variant="destructive"
              disabled={
                leaveMutation.isPending ||
                !leaveTarget?.can_leave ||
                !canLeaveTeam(leaveTarget?.team_id ?? 0)
              }
              loading={leaveMutation.isPending}
              loadingText="退出中..."
              onClick={(event) => {
                event.preventDefault();
                if (
                  !leaveTarget?.can_leave ||
                  !canLeaveTeam(leaveTarget.team_id)
                ) {
                  return;
                }
                leaveMutation.mutate(leaveTarget.team_id, {
                  onSuccess: () => {
                    toast.success('已退出团队');
                    setLeaveTarget(null);
                  },
                });
              }}
            >
              退出
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {transferTarget ? (
        <TransferTeamOwnershipDialog
          key={transferTarget.team_id}
          team={transferTarget}
          isSaving={transferMutation.isPending}
          onOpenChange={(open) => {
            if (!open && !transferMutation.isPending) {
              setTransferTarget(null);
            }
          }}
          onSubmit={(memberId) => {
            transferMutation.mutate(
              { teamId: transferTarget.team_id, memberId },
              {
                onSuccess: () => {
                  toast.success('团队所有者已转移');
                  setTransferTarget(null);
                },
              },
            );
          }}
        />
      ) : null}

      {dissolveTarget ? (
        <DissolveTeamDialog
          team={dissolveTarget}
          isSaving={dissolveMutation.isPending}
          onOpenChange={(open) => {
            if (!open && !dissolveMutation.isPending) {
              setDissolveTarget(null);
            }
          }}
          onConfirm={() => {
            const teamId = dissolveTarget.team_id;
            dissolveMutation.mutate(teamId, {
              onSuccess: () => {
                const nextTeam = teams.find((team) => team.team_id !== teamId);
                if (nextTeam) {
                  selectRemoteTeamId(nextTeam.team_id);
                }
                toast.success('团队已解散');
                setDissolveTarget(null);
              },
            });
          }}
        />
      ) : null}
    </div>
  );
}
