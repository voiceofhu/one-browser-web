import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/auth-gate';
import {
  hasAnyTeamPermission,
  hasButtonPermission,
  hasPermission,
} from '@/features/auth/permissions';
import { useBrowserShell } from '@/features/browser-shell/dashboard-shell';
import { BrowserTableColumnVisibilityMenu } from '@/features/browser/components/data-table';
import {
  BROWSER_STATUS_FILTERS,
  type BrowserStatusFilter,
  BrowserTableFilterTabs,
  BrowserTableRefreshButton,
  BrowserTableToolbar,
} from '@/features/browser/components/table-toolbar';
import {
  PROXY_TABLE_COLUMN_OPTIONS,
  ProxyBatchImportDialog,
  ProxyTable,
  checkProxy as checkProxyApi,
} from '@/features/browser/proxy-core';
import { cn } from '@/lib/utils';
import { useDesktopAppGate } from '@/lib/desktop/app-gate';
import {
  Add01Icon,
  ArrowDown01Icon,
  FileImportIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { VisibilityState } from '@tanstack/react-table';
import * as React from 'react';

import { useRemoteTeamsQuery } from '../organization/teams/queries';
import {
  RemotePermissionRequiredState,
  RemoteTeamRequiredState,
  useSelectedRemoteTeamId,
} from '../organization/teams/team-scope';
import { RemoteProxyEditorDialog } from './components/proxy-editor-dialog';
import { useRemoteProxiesQuery } from './queries';
import { proxyDialogKey } from './remote-proxy-mappers';
import { useRemoteProxyActions } from './use-remote-proxy-actions';

export function RemoteProxiesPage() {
  const { requireDesktopApp } = useDesktopAppGate();
  const { access } = useAuth();
  const { search } = useBrowserShell();
  const teamsQuery = useRemoteTeamsQuery({ page_size: 100 });
  const teams = teamsQuery.data?.list ?? [];
  const [selectedTeamId] = useSelectedRemoteTeamId(teams);
  const canListProxiesInAnyTeam = hasAnyTeamPermission(
    access,
    'browser:proxy:list',
  );
  const canListProxies = hasPermission(
    access,
    'browser:proxy:list',
    selectedTeamId,
  );
  const canCreateProxy = hasButtonPermission(
    access,
    'browser:proxy:create',
    selectedTeamId,
  );
  const canUpdateProxy = hasButtonPermission(
    access,
    'browser:proxy:update',
    selectedTeamId,
  );
  const canDeleteProxy = hasButtonPermission(
    access,
    'browser:proxy:delete',
    selectedTeamId,
  );
  const canCheckProxy = hasButtonPermission(
    access,
    'browser:proxy:check',
    selectedTeamId,
  );
  const [createMenuOpen, setCreateMenuOpen] = React.useState(false);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [statusFilter, setStatusFilter] =
    React.useState<BrowserStatusFilter>('all');
  const createMenuCloseTimer = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const params = React.useMemo(
    () => ({
      page_size: 100,
      keyword: search.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      team_id: selectedTeamId ?? undefined,
    }),
    [search, selectedTeamId, statusFilter],
  );
  const proxiesQuery = useRemoteProxiesQuery(
    params,
    canListProxies && Boolean(selectedTeamId),
  );
  const proxies = React.useMemo(
    () => proxiesQuery.data?.list ?? [],
    [proxiesQuery.data?.list],
  );
  const actions = useRemoteProxyActions({
    proxies,
    selectedTeamId,
    canCreate: canCreateProxy,
    canUpdate: canUpdateProxy,
    canDelete: canDeleteProxy,
    canCheck: canCheckProxy,
    refetch: async () => {
      await proxiesQuery.refetch();
    },
  });

  React.useEffect(() => {
    return () => {
      if (createMenuCloseTimer.current) {
        clearTimeout(createMenuCloseTimer.current);
      }
    };
  }, []);

  function openCreateMenu() {
    if (createMenuCloseTimer.current) {
      clearTimeout(createMenuCloseTimer.current);
      createMenuCloseTimer.current = null;
    }
    setCreateMenuOpen(true);
  }

  function scheduleCloseCreateMenu() {
    if (createMenuCloseTimer.current) {
      clearTimeout(createMenuCloseTimer.current);
    }
    createMenuCloseTimer.current = setTimeout(() => {
      setCreateMenuOpen(false);
    }, 140);
  }

  function closeCreateMenu() {
    if (createMenuCloseTimer.current) {
      clearTimeout(createMenuCloseTimer.current);
      createMenuCloseTimer.current = null;
    }
    setCreateMenuOpen(false);
  }

  function openCreateDialog() {
    closeCreateMenu();
    actions.openCreate();
  }

  function openBatchDialog() {
    closeCreateMenu();
    actions.setBatchDialogOpen(true);
  }

  if (!canListProxiesInAnyTeam) {
    return (
      <RemotePermissionRequiredState
        title="暂无代理查看权限"
        description="请联系管理员授予代理查看权限。"
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

  if (!canListProxies) {
    return (
      <RemotePermissionRequiredState
        title="暂无代理查看权限"
        description="请联系管理员授予当前团队的代理查看权限。"
      />
    );
  }

  return (
    <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden">
      <BrowserTableToolbar
        filters={
          <BrowserTableFilterTabs
            label="代理状态"
            options={BROWSER_STATUS_FILTERS}
            value={statusFilter}
            onValueChange={setStatusFilter}
          />
        }
        actions={
          <>
            <BrowserTableRefreshButton
              isRefreshing={proxiesQuery.isFetching}
              onRefresh={proxiesQuery.refetch}
              successMessage="代理列表已刷新"
            />
            {canCreateProxy ? (
              <DropdownMenu
                open={createMenuOpen}
                onOpenChange={setCreateMenuOpen}
              >
                <div
                  onPointerEnter={openCreateMenu}
                  onPointerLeave={scheduleCloseCreateMenu}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      onClick={(event) => {
                        event.preventDefault();
                        openCreateDialog();
                      }}
                    >
                      <HugeiconsIcon
                        icon={Add01Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      新建
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        strokeWidth={2}
                        data-icon="inline-end"
                        className={cn(
                          'rotate-0 transition-transform duration-150 ease-out',
                          createMenuOpen && '-rotate-180',
                        )}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent
                  align="end"
                  className="w-40"
                  onPointerEnter={openCreateMenu}
                  onPointerLeave={scheduleCloseCreateMenu}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={openCreateDialog}>
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                      新增单个
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={openBatchDialog}>
                      <HugeiconsIcon icon={FileImportIcon} strokeWidth={2} />
                      批量新增
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <BrowserTableColumnVisibilityMenu
              options={PROXY_TABLE_COLUMN_OPTIONS}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
            />
          </>
        }
      />

      <ProxyTable
        data={actions.proxyRows}
        canCheck={canCheckProxy}
        canCreate={canCreateProxy}
        canDelete={canDeleteProxy}
        canUpdate={canUpdateProxy}
        isLoading={proxiesQuery.isLoading}
        isChecking={actions.isChecking}
        isDeleting={actions.isDeleting}
        isDuplicating={actions.isDuplicating}
        updatingProxyId={actions.updatingProxyId}
        updatingStatusProxyIds={actions.updatingStatusProxyIds}
        checkingProxyIds={actions.checkingProxyIds}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        showHeaderRefresh={false}
        onRefresh={() => proxiesQuery.refetch()}
        onCheck={(proxyId) => void actions.checkProxy(proxyId)}
        onCheckMany={(proxyIds) => void actions.checkMany(proxyIds)}
        onEdit={actions.openEdit}
        onDuplicate={actions.duplicate}
        onDelete={actions.deleteProxies}
        onUpdateRemark={actions.updateRemark}
        onStatusChange={(proxyId, enabled) =>
          void actions.updateStatus(proxyId, enabled)
        }
        onResolveCopyProxy={actions.resolveCopyProxy}
        onCopyProxyText={actions.copyText}
      />

      <RemoteProxyEditorDialog
        key={proxyDialogKey(actions.dialogState)}
        state={actions.dialogState}
        teamId={selectedTeamId}
        isSaving={actions.isSaving}
        onOpenChange={(open) => {
          if (!open && !actions.isSaving) {
            actions.closeDialog();
          }
        }}
        onCheckResult={actions.persistCheckResult}
        onSubmit={actions.submitProxy}
      />

      <ProxyBatchImportDialog
        open={actions.batchDialogOpen}
        existingProxies={actions.proxyRows}
        isImporting={actions.batchImporting}
        onBeforeCheck={() =>
          Promise.resolve(
            requireDesktopApp({
              title: '在 App 中批量检测代理',
              description:
                '批量导入前的代理检测需要使用 One Browser App 的本机网络能力。',
            }),
          )
        }
        onOpenChange={actions.setBatchDialogOpen}
        onImport={actions.importBatch}
        onCheckProxy={checkProxyApi}
      />
    </section>
  );
}
