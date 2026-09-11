import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-gate';
import {
  hasButtonPermission,
  hasPermission,
} from '@/features/auth/permissions';
import {
  BrowserDataTable,
  BrowserTableColumnVisibilityMenu,
} from '@/features/browser/components/data-table';
import {
  BROWSER_STATUS_FILTERS,
  type BrowserStatusFilter,
  BrowserTableFilterTabs,
  BrowserTableRefreshButton,
  BrowserTableSearchField,
  BrowserTableToolbar,
} from '@/features/browser/components/table-toolbar';
import {
  Add01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type {
  OnChangeFn,
  RowSelectionState,
  VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';
import { toast } from 'sonner';

import { RemotePermissionRequiredState } from '../teams/team-scope';
import { usePermissionColumns } from './components/permission-columns';
import { PermissionDialog } from './components/permission-dialog';
import {
  PermissionBulkActions,
  PermissionDeleteDialog,
  PermissionLoadErrorState,
} from './components/permission-page-states';
import { buildPermissionOrderUpdates } from './permission-order';
import {
  buildPermissionTree,
  filterPermissionTree,
  flattenPermissionTree,
  forEachPermissionNode,
} from './permission-tree';
import {
  useCreateRemotePermissionMutation,
  useDeleteRemotePermissionMutation,
  useDeleteRemotePermissionsMutation,
  useRemotePermissionStatusMutation,
  useRemotePermissionsQuery,
  useReorderRemotePermissionsMutation,
  useUpdateRemotePermissionMutation,
} from './queries';
import type {
  RemotePermissionPayload,
  RemotePermissionResource,
} from './types';

type PermissionDialogState =
  | { mode: 'create'; parent?: RemotePermissionResource }
  | { mode: 'edit'; record: RemotePermissionResource };

type PermissionDeleteSource = 'row' | 'bulk';

type ScopedRowSelection = {
  scope: string;
  value: RowSelectionState;
};

const EMPTY_ROW_SELECTION: RowSelectionState = {};

export function RemotePermissionsPage() {
  const { access } = useAuth();
  const canList = hasPermission(access, 'browser:permission:list');
  const canCreate = hasButtonPermission(access, 'browser:permission:create');
  const canUpdate = hasButtonPermission(access, 'browser:permission:update');
  const canDelete = hasButtonPermission(access, 'browser:permission:delete');
  const canUpdateStatus = hasButtonPermission(
    access,
    'browser:permission:status',
  );
  const permissionsQuery = useRemotePermissionsQuery(canList);
  const createMutation = useCreateRemotePermissionMutation();
  const updateMutation = useUpdateRemotePermissionMutation();
  const reorderMutation = useReorderRemotePermissionsMutation();
  const statusMutation = useRemotePermissionStatusMutation();
  const deleteMutation = useDeleteRemotePermissionMutation();
  const batchDeleteMutation = useDeleteRemotePermissionsMutation();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<BrowserStatusFilter>('all');
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ createdAt: false });
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(
    () => new Set(),
  );
  const initializedExpansionRef = React.useRef(false);
  const [dialogState, setDialogState] =
    React.useState<PermissionDialogState | null>(null);
  const [deleteTargets, setDeleteTargets] = React.useState<
    RemotePermissionResource[]
  >([]);
  const [deleteSource, setDeleteSource] =
    React.useState<PermissionDeleteSource>('row');
  const permissions = React.useMemo(
    () => permissionsQuery.data?.list ?? [],
    [permissionsQuery.data?.list],
  );
  const permissionTree = React.useMemo(
    () => buildPermissionTree(permissions),
    [permissions],
  );
  const expandableIds = React.useMemo(() => {
    const ids: number[] = [];
    forEachPermissionNode(permissionTree, (node) => {
      if (node.children.length) {
        ids.push(node.record.permission_id);
      }
    });
    return ids;
  }, [permissionTree]);

  React.useEffect(() => {
    if (initializedExpansionRef.current || !expandableIds.length) {
      return;
    }
    initializedExpansionRef.current = true;
    setExpandedIds(new Set(expandableIds));
  }, [expandableIds]);

  const filteredTree = React.useMemo(
    () => filterPermissionTree(permissionTree, statusFilter, search),
    [permissionTree, search, statusFilter],
  );
  const tableRows = React.useMemo(
    () =>
      flattenPermissionTree(
        filteredTree,
        search.trim() ? new Set(expandableIds) : expandedIds,
      ),
    [expandableIds, expandedIds, filteredTree, search],
  );
  const selectionScope = `${statusFilter}:${search.trim()}`;
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
  const selectedPermissions = React.useMemo(
    () =>
      permissions.filter(
        (permission) =>
          !permission.locked && rowSelection[String(permission.permission_id)],
      ),
    [permissions, rowSelection],
  );
  const allExpanded =
    expandableIds.length > 0 &&
    expandableIds.every((permissionId) => expandedIds.has(permissionId));
  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    reorderMutation.isPending;
  const isDeleting = deleteMutation.isPending || batchDeleteMutation.isPending;
  const toggleExpanded = React.useCallback((permissionId: number) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  }, []);

  const updateStatus = React.useCallback(
    (record: RemotePermissionResource, enabled: boolean) => {
      if (record.locked) {
        return;
      }
      statusMutation.mutate(
        {
          permissionId: record.permission_id,
          status: enabled ? '0' : '1',
        },
        {
          onSuccess: () => {
            toast.success(enabled ? '权限已启用' : '权限已停用');
          },
        },
      );
    },
    [statusMutation],
  );

  const reorderPermissions = React.useCallback(
    (event: Parameters<typeof buildPermissionOrderUpdates>[0]) => {
      const updates = buildPermissionOrderUpdates(event);
      if (!updates) {
        toast.error('权限只能在同一个上级权限下拖拽排序');
        return;
      }
      if (!updates.length) {
        return;
      }
      reorderMutation.mutate(updates, {
        onSuccess: () => toast.success('权限顺序已更新'),
      });
    },
    [reorderMutation],
  );

  const createChildPermission = React.useCallback(
    (record: RemotePermissionResource) =>
      setDialogState({ mode: 'create', parent: record }),
    [],
  );
  const editPermission = React.useCallback(
    (record: RemotePermissionResource) =>
      setDialogState({ mode: 'edit', record }),
    [],
  );
  const requestPermissionDelete = React.useCallback(
    (record: RemotePermissionResource) => {
      setDeleteSource('row');
      setDeleteTargets([record]);
    },
    [],
  );
  const columns = usePermissionColumns({
    canCreate,
    canUpdate,
    canDelete,
    canUpdateStatus,
    isSaving,
    isDeleting,
    isStatusPending: statusMutation.isPending,
    onToggleExpanded: toggleExpanded,
    onStatusChange: updateStatus,
    onCreateChild: createChildPermission,
    onEdit: editPermission,
    onDelete: requestPermissionDelete,
  });

  function submitPermission(payload: RemotePermissionPayload) {
    if (!dialogState) {
      return;
    }

    if (dialogState.mode === 'edit') {
      if (dialogState.record.locked) {
        return;
      }
      updateMutation.mutate(
        {
          permissionId: dialogState.record.permission_id,
          payload,
        },
        {
          onSuccess: () => {
            toast.success('权限已更新');
            setDialogState(null);
          },
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('权限已创建');
        setDialogState(null);
      },
    });
  }

  if (!canList) {
    return (
      <RemotePermissionRequiredState
        title="没有权限管理权限"
        description="当前账号未获得浏览器权限目录的管理权限。"
      />
    );
  }

  return (
    <section className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <BrowserTableToolbar
        filters={
          <>
            <BrowserTableFilterTabs
              label="权限状态"
              options={BROWSER_STATUS_FILTERS}
              value={statusFilter}
              onValueChange={setStatusFilter}
            />
            <BrowserTableSearchField
              className="min-w-36 max-w-60 flex-1"
              value={search}
              placeholder="搜索权限名称、路由或标识"
              ariaLabel="搜索权限"
              onValueChange={setSearch}
            />
          </>
        }
        actions={
          <>
            <BrowserTableRefreshButton
              isRefreshing={permissionsQuery.isFetching}
              onRefresh={permissionsQuery.refetch}
              successMessage="权限列表已刷新"
            />
            {canCreate ? (
              <Button
                size="sm"
                onClick={() => setDialogState({ mode: 'create' })}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                新增权限
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={!expandableIds.length}
              onClick={() =>
                setExpandedIds(allExpanded ? new Set() : new Set(expandableIds))
              }
            >
              {allExpanded ? <ChevronsDownUp aria-hidden="true" data-icon="inline-start" /> : <ChevronsUpDown aria-hidden="true" data-icon="inline-start" />}
              {allExpanded ? '全部收起' : '全部展开'}
            </Button>
            <BrowserTableColumnVisibilityMenu
              columns={columns}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
            />
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background">
        {permissionsQuery.isError ? (
          <PermissionLoadErrorState
            message={permissionsQuery.error.message}
            onRetry={() => void permissionsQuery.refetch()}
          />
        ) : (
          <BrowserDataTable
            columns={columns}
            data={tableRows}
            enableRowSelection={(row) =>
              canDelete && !row.original.record.locked
            }
            emptyTitle={permissions.length ? '没有匹配的权限' : '暂无权限'}
            emptyDescription={
              permissions.length
                ? '请调整搜索关键词或状态筛选。'
                : '新增目录、菜单与按钮后，可以为角色组合权限。'
            }
            columnVisibility={columnVisibility}
            getRowId={(row) => String(row.record.permission_id)}
            isLoading={permissionsQuery.isLoading}
            onColumnVisibilityChange={setColumnVisibility}
            onRowSelectionChange={setRowSelection}
            onRowReorder={canUpdate ? reorderPermissions : undefined}
            rowSelection={rowSelection}
            isRowReordering={reorderMutation.isPending}
            density="compact"
            tableClassName="min-w-[760px] table-fixed text-xs"
          />
        )}
      </div>

      {dialogState ? (
        <PermissionDialog
          key={permissionDialogKey(dialogState)}
          mode={dialogState.mode}
          record={dialogState.mode === 'edit' ? dialogState.record : undefined}
          parent={
            dialogState.mode === 'create' ? dialogState.parent : undefined
          }
          permissions={permissions}
          isSaving={isSaving}
          onOpenChange={(open) => {
            if (!open && !isSaving) {
              setDialogState(null);
            }
          }}
          onSubmit={submitPermission}
        />
      ) : null}

      {canDelete && selectedPermissions.length ? (
        <PermissionBulkActions
          selectedCount={selectedPermissions.length}
          isDeleting={isDeleting}
          onClear={() => setRowSelection({})}
          onDelete={() => {
            setDeleteSource('bulk');
            setDeleteTargets(selectedPermissions);
          }}
        />
      ) : null}

      <PermissionDeleteDialog
        targets={deleteTargets}
        permissions={permissions}
        canDelete={canDelete}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTargets([]);
          }
        }}
        onConfirm={(targets) => {
          const onSuccess = () => {
            toast.success(
              deleteTargets.length > 1
                ? `已删除 ${deleteTargets.length} 个权限`
                : '权限已删除',
            );
            setDeleteTargets([]);
            setRowSelection({});
          };
          if (deleteSource === 'bulk') {
            batchDeleteMutation.mutate(
              {
                permission_ids: targets.map((target) => target.permission_id),
              },
              { onSuccess },
            );
            return;
          }
          deleteMutation.mutate(targets[0].permission_id, { onSuccess });
        }}
      />
    </section>
  );
}

function permissionDialogKey(state: PermissionDialogState) {
  if (state.mode === 'edit') {
    return `edit-${state.record.permission_id}`;
  }
  return `create-${state.parent?.permission_id ?? 'root'}`;
}
