import { AnimatedSegmentedTabs } from '@/components/ui/animated-segmented-tabs';
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
import { normalizeProfileGroup } from '@/features/browser/profiles/group-utils';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { VisibilityState } from '@tanstack/react-table';
import * as React from 'react';
import { isTauriRuntime } from '@/lib/desktop';

import { useRemoteTeamsQuery } from '../organization/teams/queries';
import {
  RemotePermissionRequiredState,
  RemoteTeamRequiredState,
  useSelectedRemoteTeamId,
} from '../organization/teams/team-scope';
import { useRemoteProxiesQuery } from '../remote-proxies/queries';
import { useRuntimeQuery } from '../runtime/queries';
import { useEnvironmentColumns } from './components/environment-columns';
import { RemoteEnvironmentEditorDialog } from './components/environment-editor-dialog';
import {
  DeleteEnvironmentsConfirmDialog,
  EnvironmentBulkActions,
} from './components/environment-page-states';
import {
  applyLocalRuntimeState,
  buildGroupFilters,
  environmentDialogKey,
  groupFilterAll,
  groupFilterUngrouped,
} from './environment-utils';
import { useRemoteEnvironmentsQuery } from './queries';
import { parseRemoteEnvironmentProfileId } from './runtime-profile-id';
import { useEnvironmentActions } from './use-environment-actions';

export function RemoteEnvironmentsPage() {
  const { access } = useAuth();
  const { search } = useBrowserShell();
  const teamsQuery = useRemoteTeamsQuery({ page_size: 100 });
  const teams = teamsQuery.data?.list ?? [];
  const [selectedTeamId] = useSelectedRemoteTeamId(teams);
  const canListEnvironmentsInAnyTeam = hasAnyTeamPermission(
    access,
    'browser:environment:list',
  );
  const canListEnvironments = hasPermission(
    access,
    'browser:environment:list',
    selectedTeamId,
  );
  const canCreateEnvironment = hasButtonPermission(
    access,
    'browser:environment:create',
    selectedTeamId,
  );
  const canUpdateEnvironment = hasButtonPermission(
    access,
    'browser:environment:update',
    selectedTeamId,
  );
  const canDeleteEnvironment = hasButtonPermission(
    access,
    'browser:environment:delete',
    selectedTeamId,
  );
  const canChangeEnvironmentStatus = hasButtonPermission(
    access,
    'browser:environment:status',
    selectedTeamId,
  );
  const canOpenEnvironment = hasButtonPermission(
    access,
    'browser:environment:open',
    selectedTeamId,
  );
  const canCloseEnvironment = hasButtonPermission(
    access,
    'browser:environment:close',
    selectedTeamId,
  );
  const canListProxies = hasPermission(
    access,
    'browser:proxy:list',
    selectedTeamId,
  );
  const canSelectEnvironments = canOpenEnvironment || canDeleteEnvironment;
  const [groupFilter, setGroupFilter] = React.useState(groupFilterAll);
  const [statusFilter, setStatusFilter] =
    React.useState<BrowserStatusFilter>('all');
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const listParams = React.useMemo(
    () => ({
      page_size: 100,
      keyword: search.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      team_id: selectedTeamId ?? undefined,
    }),
    [search, selectedTeamId, statusFilter],
  );
  const environmentsQuery = useRemoteEnvironmentsQuery(
    listParams,
    canListEnvironments && Boolean(selectedTeamId),
  );
  const serverEnvironments = React.useMemo(
    () => environmentsQuery.data?.list ?? [],
    [environmentsQuery.data?.list],
  );
  const runtimeQuery = useRuntimeQuery({
    enabled: isTauriRuntime() && canListEnvironments && Boolean(selectedTeamId),
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
    const environmentIds = new Set<number>();
    for (const runtime of runtimeQuery.data ?? []) {
      const environmentId = parseRemoteEnvironmentProfileId(runtime.profileId);
      if (environmentId !== null) {
        environmentIds.add(environmentId);
      }
    }
    return environmentIds;
  }, [runtimeQuery.data]);
  const environments = React.useMemo(() => {
    if (!runtimeQuery.data) {
      return serverEnvironments;
    }

    return serverEnvironments.map((environment) =>
      applyLocalRuntimeState(environment, localRuntimeByProfileId),
    );
  }, [localRuntimeByProfileId, runtimeQuery.data, serverEnvironments]);
  const groupFilters = React.useMemo(
    () => buildGroupFilters(environments),
    [environments],
  );
  const environmentGroupOptions = React.useMemo(
    () =>
      groupFilters
        .filter(
          (group) =>
            group.value !== groupFilterAll &&
            group.value !== groupFilterUngrouped,
        )
        .map((group) => group.value),
    [groupFilters],
  );
  const activeGroupFilter = React.useMemo(() => {
    if (groupFilter === groupFilterAll) {
      return groupFilterAll;
    }

    return groupFilters.some((group) => group.value === groupFilter)
      ? groupFilter
      : groupFilterAll;
  }, [groupFilter, groupFilters]);
  const filteredEnvironments = React.useMemo(
    () =>
      environments.filter((environment) => {
        const group = normalizeProfileGroup(environment.group_key);
        return (
          activeGroupFilter === groupFilterAll ||
          (activeGroupFilter === groupFilterUngrouped && !group) ||
          group === activeGroupFilter
        );
      }),
    [activeGroupFilter, environments],
  );
  const actions = useEnvironmentActions({
    environments,
    filteredEnvironments,
    localRuntimeEnvironmentIds,
    selectedTeamId,
    canCreate: canCreateEnvironment,
    canUpdate: canUpdateEnvironment,
    canDelete: canDeleteEnvironment,
    canChangeStatus: canChangeEnvironmentStatus,
  });
  const proxiesQuery = useRemoteProxiesQuery(
    { page_size: 100, team_id: selectedTeamId ?? undefined },
    canListProxies && Boolean(actions.dialogState && selectedTeamId),
  );
  const columns = useEnvironmentColumns({
    canSelect: canSelectEnvironments,
    canCreate: canCreateEnvironment,
    canUpdate: canUpdateEnvironment,
    canDelete: canDeleteEnvironment,
    canChangeStatus: canChangeEnvironmentStatus,
    canOpen: canOpenEnvironment,
    canClose: canCloseEnvironment,
    localRuntimeEnvironmentIds,
    allVisibleSelected: actions.allVisibleSelected,
    someVisibleSelected: actions.someVisibleSelected,
    selectedIdSet: actions.selectedIdSet,
    isRuntimePending: actions.isRuntimePending,
    isCheckingLaunchStatus: actions.isCheckingLaunchStatus,
    isDeleting: actions.isDeleting,
    isDuplicating: actions.isDuplicating,
    isStatusPending: actions.isStatusPending,
    loadingDetailId: actions.loadingDetailId,
    runtimeEnvironmentId: actions.runtimeEnvironmentId,
    runtimeAction: actions.runtimeAction,
    onToggleVisible: actions.toggleVisible,
    onToggle: actions.toggle,
    onEdit: (environmentId) => void actions.openEditor(environmentId),
    onDuplicate: (environmentId) => void actions.duplicate(environmentId),
    onStatusChange: actions.toggleStatus,
    onDelete: actions.requestDelete,
    onOpen: (environmentId) => void actions.open(environmentId),
    onClose: actions.close,
  });
  if (!canListEnvironmentsInAnyTeam) {
    return (
      <RemotePermissionRequiredState
        title="暂无环境查看权限"
        description="请联系管理员授予环境查看权限。"
      />
    );
  }

  if (!teams.length) {
    return (
      <RemoteTeamRequiredState
        isLoading={teamsQuery.isLoading}
        error={teamsQuery.error}
        isRetrying={teamsQuery.isFetching}
        onRetry={() => void teamsQuery.refetch()}
      />
    );
  }

  if (!canListEnvironments) {
    return (
      <RemotePermissionRequiredState
        title="暂无环境查看权限"
        description="请联系管理员授予当前团队的环境查看权限。"
      />
    );
  }

  return (
    <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden">
      <BrowserTableToolbar
        filters={
          <BrowserTableFilterTabs
            label="环境状态"
            options={BROWSER_STATUS_FILTERS}
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              actions.clearSelection();
            }}
          />
        }
        actions={
          <>
            <BrowserTableRefreshButton
              isRefreshing={environmentsQuery.isFetching}
              onRefresh={environmentsQuery.refetch}
              successMessage="环境列表已刷新"
            />
            {canCreateEnvironment ? (
              <Button size="sm" onClick={() => void actions.openEditor(null)}>
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                新建
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

      {groupFilters.length > 1 ? (
        <div className="border-border/60 flex shrink-0 flex-wrap items-center gap-1.5 border-b px-4 py-2">
          <span className="text-muted-foreground text-xs">分组</span>
          <AnimatedSegmentedTabs
            label="环境分组"
            value={activeGroupFilter}
            onValueChange={(value) => setGroupFilter(value || groupFilterAll)}
            className="min-w-0 max-w-full"
            listClassName="h-auto max-w-full flex-wrap justify-start gap-1"
            triggerClassName="h-6 min-w-0 max-w-full flex-none gap-1 px-2 text-xs"
            options={groupFilters.map((group) => ({
              value: group.value,
              label: (
                <>
                  <span className="truncate">{group.label}</span>
                  <span className="shrink-0 text-[0.625rem] opacity-70">
                    {group.count}
                  </span>
                </>
              ),
            }))}
          />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <BrowserDataTable
          columns={columns}
          data={filteredEnvironments}
          emptyTitle="暂无环境"
          emptyDescription="先创建环境，再打开隔离浏览器窗口。"
          getRowId={(record) => String(record.environment_id)}
          isLoading={environmentsQuery.isLoading}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />
      </div>

      {canSelectEnvironments && actions.selectedEnvironments.length ? (
        <EnvironmentBulkActions
          canDelete={canDeleteEnvironment}
          canOpen={canOpenEnvironment}
          selectedCount={actions.selectedEnvironments.length}
          openableCount={actions.selectedOpenableEnvironments.length}
          isDeleting={actions.isDeleting}
          isOpening={actions.isRuntimePending || actions.isCheckingLaunchStatus}
          openDisabled={
            !actions.selectedOpenableEnvironments.length ||
            actions.isRuntimePending ||
            actions.isCheckingLaunchStatus
          }
          deleteDisabled={actions.selectedHasRunningEnvironments}
          deleteDisabledTitle={
            actions.selectedHasRunningEnvironments
              ? '选中项包含已启动或启动中的环境，请先关闭后再删除'
              : undefined
          }
          onClear={actions.clearSelection}
          onOpen={() => void actions.openSelected()}
          onDelete={actions.deleteSelected}
        />
      ) : null}

      {actions.deleteTarget ? (
        <DeleteEnvironmentsConfirmDialog
          environmentIds={actions.deleteTarget.environmentIds}
          isDeleting={actions.isDeleting}
          onOpenChange={(open) => {
            if (!open && !actions.isDeleting) {
              actions.dismissDelete();
            }
          }}
          onConfirm={(environmentIds) =>
            void actions.confirmDelete(environmentIds)
          }
        />
      ) : null}

      <RemoteEnvironmentEditorDialog
        key={environmentDialogKey(actions.dialogState)}
        state={actions.dialogState}
        teamId={selectedTeamId}
        groupOptions={environmentGroupOptions}
        proxies={proxiesQuery.data?.list ?? []}
        proxiesLoading={proxiesQuery.isLoading}
        isSaving={actions.isSaving}
        onOpenChange={(open) => {
          if (!open && !actions.isSaving) {
            actions.closeEditor();
          }
        }}
        onSubmit={actions.submit}
      />
    </section>
  );
}
