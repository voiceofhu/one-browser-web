import { toBrowserErrorMessage } from '@/features/browser/errors';
import { isTauriRuntime } from '@/lib/desktop';
import { useDesktopAppGate } from '@/lib/desktop/app-gate';
import * as React from 'react';
import { toast } from 'sonner';

import {
  toastBrowserOpenError,
  toastBrowserOpenFailure,
  toastBrowserOpenPreflight,
  toastBrowserOpenSuccess,
} from '../runtime/open-progress-toast';
import { useAppStatusQuery } from '../status/queries';
import { getRemoteEnvironment } from './api';
import type { RemoteEnvironmentDialogState } from './components/environment-editor-dialog';
import {
  duplicateEnvironmentPayload,
  isRemoteEnvironmentListItem,
} from './environment-utils';
import {
  useCreateRemoteEnvironmentMutation,
  useDeleteRemoteEnvironmentMutation,
  useRemoteEnvironmentRuntimeMutation,
  useRemoteEnvironmentStatusMutation,
  useUpdateRemoteEnvironmentMutation,
} from './queries';
import type {
  RemoteEnvironmentListItem,
  RemoteEnvironmentPayload,
} from './types';

type DeleteTarget = { environmentIds: number[] };

export function useEnvironmentActions({
  environments,
  filteredEnvironments,
  localRuntimeEnvironmentIds,
  selectedTeamId,
  canCreate,
  canUpdate,
  canDelete,
  canChangeStatus,
}: {
  environments: RemoteEnvironmentListItem[];
  filteredEnvironments: RemoteEnvironmentListItem[];
  localRuntimeEnvironmentIds: ReadonlySet<number>;
  selectedTeamId: number | null;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
}) {
  const { requireDesktopApp } = useDesktopAppGate();
  const [dialogState, setDialogState] =
    React.useState<RemoteEnvironmentDialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(
    null,
  );
  const [loadingDetailId, setLoadingDetailId] = React.useState<number | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const createMutation = useCreateRemoteEnvironmentMutation();
  const updateMutation = useUpdateRemoteEnvironmentMutation();
  const deleteMutation = useDeleteRemoteEnvironmentMutation();
  const statusMutation = useRemoteEnvironmentStatusMutation();
  const runtimeMutation = useRemoteEnvironmentRuntimeMutation();
  const {
    isFetching: appStatusFetching,
    isLoading: appStatusLoading,
    refetch: refetchAppStatus,
  } = useAppStatusQuery({ enabled: isTauriRuntime() });
  const environmentById = React.useMemo(
    () =>
      new Map(
        environments.map(
          (environment) => [environment.environment_id, environment] as const,
        ),
      ),
    [environments],
  );
  const selectedIdSet = React.useMemo(
    () => new Set(selectedIds),
    [selectedIds],
  );
  const selectedEnvironments = React.useMemo(
    () =>
      selectedIds
        .map((environmentId) => environmentById.get(environmentId))
        .filter(isRemoteEnvironmentListItem),
    [environmentById, selectedIds],
  );
  const selectedOpenableEnvironments = React.useMemo(
    () =>
      selectedEnvironments.filter(
        (environment) =>
          environment.status === '0' &&
          !localRuntimeEnvironmentIds.has(environment.environment_id) &&
          (environment.runtime_status === 'inactive' ||
            environment.runtime_status === 'active'),
      ),
    [localRuntimeEnvironmentIds, selectedEnvironments],
  );
  const selectedHasRunningEnvironments = selectedEnvironments.some(
    (environment) => environment.runtime_status !== 'inactive',
  );
  const visibleIds = React.useMemo(
    () => filteredEnvironments.map((environment) => environment.environment_id),
    [filteredEnvironments],
  );
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((environmentId) => selectedIdSet.has(environmentId));
  const someVisibleSelected = visibleIds.some((environmentId) =>
    selectedIdSet.has(environmentId),
  );
  const isRuntimePending = runtimeMutation.isPending;
  const isCheckingLaunchStatus = appStatusLoading || appStatusFetching;

  const toggleVisible = React.useCallback(
    (checked: boolean) => {
      setSelectedIds((current) => {
        const next = new Set(current);
        visibleIds.forEach((environmentId) => {
          if (checked) {
            next.add(environmentId);
          } else {
            next.delete(environmentId);
          }
        });
        return [...next];
      });
    },
    [visibleIds],
  );
  const toggle = React.useCallback(
    (environmentId: number, checked: boolean) => {
      setSelectedIds((current) => {
        const next = new Set(current);
        if (checked) {
          next.add(environmentId);
        } else {
          next.delete(environmentId);
        }
        return [...next];
      });
    },
    [],
  );

  const [editorTeamId, setEditorTeamId] = React.useState(selectedTeamId);
  if (editorTeamId !== selectedTeamId) {
    setEditorTeamId(selectedTeamId);
    setDialogState(null);
    setLoadingDetailId(null);
  }
  const detailRequest = React.useRef(0);
  const selectedTeam = React.useRef(selectedTeamId);
  React.useLayoutEffect(() => {
    selectedTeam.current = selectedTeamId;
    detailRequest.current += 1;
    return () => {
      detailRequest.current += 1;
    };
  }, [selectedTeamId]);

  const openEditor = React.useCallback(async (environmentId: number | null) => {
    const requestId = ++detailRequest.current;
    const requestedTeamId = selectedTeam.current;
    if (environmentId === null) {
      setLoadingDetailId(null);
      setDialogState({ mode: 'create' });
      return;
    }
    setLoadingDetailId(environmentId);
    try {
      const record = await getRemoteEnvironment(environmentId);
      if (
        requestId === detailRequest.current &&
        selectedTeam.current === requestedTeamId
      ) {
        setDialogState({ mode: 'edit', record });
      }
    } catch (error) {
      if (requestId === detailRequest.current)
        toast.error(toBrowserErrorMessage(error));
    } finally {
      if (requestId === detailRequest.current) setLoadingDetailId(null);
    }
  }, []);

  const duplicate = React.useCallback(
    async (environmentId: number) => {
      if (!canCreate || !selectedTeamId) {
        return;
      }
      setLoadingDetailId(environmentId);
      try {
        const record = await getRemoteEnvironment(environmentId);
        createMutation.mutate(
          duplicateEnvironmentPayload(record, selectedTeamId),
          { onSuccess: () => toast.success('环境已复制') },
        );
      } catch (error) {
        toast.error(toBrowserErrorMessage(error));
      } finally {
        setLoadingDetailId((current) =>
          current === environmentId ? null : current,
        );
      }
    },
    [canCreate, createMutation, selectedTeamId],
  );

  const toggleStatus = React.useCallback(
    (record: RemoteEnvironmentListItem) => {
      if (!canChangeStatus) {
        return;
      }
      statusMutation.mutate(
        {
          environmentId: record.environment_id,
          status: record.status === '1' ? '0' : '1',
        },
        { onSuccess: () => toast.success('环境状态已更新') },
      );
    },
    [canChangeStatus, statusMutation],
  );

  const ensureLaunchReady = React.useCallback(async () => {
    if (
      !requireDesktopApp({
        title: '在 App 中打开环境',
        description: '启动浏览器环境需要本机 Chromium、代理与进程管理能力。',
      })
    ) {
      return false;
    }
    toastBrowserOpenPreflight(8);
    const statusResult = await refetchAppStatus();
    if (statusResult.error) {
      toastBrowserOpenError(statusResult.error);
      return false;
    }
    const chromiumPath = statusResult.data?.chromiumPath;
    if (!chromiumPath?.executable) {
      toastBrowserOpenFailure(
        chromiumPath?.message || '请先等待浏览器下载完成或检查 Chromium 路径',
      );
      return false;
    }
    return true;
  }, [refetchAppStatus, requireDesktopApp]);

  const open = React.useCallback(
    async (environmentId: number) => {
      if (isRuntimePending || isCheckingLaunchStatus) {
        return;
      }
      if (!(await ensureLaunchReady())) {
        return;
      }
      runtimeMutation.mutate({ environmentId, action: 'open' });
    },
    [
      ensureLaunchReady,
      isCheckingLaunchStatus,
      isRuntimePending,
      runtimeMutation,
    ],
  );
  const close = React.useCallback(
    (environmentId: number) => {
      if (
        !requireDesktopApp({
          title: '在 App 中关闭环境',
          description: '关闭正在运行的浏览器环境需要连接本机 App。',
        })
      ) {
        return;
      }
      if (!localRuntimeEnvironmentIds.has(environmentId)) {
        return;
      }
      runtimeMutation.mutate(
        { environmentId, action: 'close' },
        { onSuccess: () => toast.success('环境已关闭') },
      );
    },
    [localRuntimeEnvironmentIds, requireDesktopApp, runtimeMutation],
  );

  function submit(payload: RemoteEnvironmentPayload) {
    if (!dialogState) {
      return;
    }
    if (dialogState.mode === 'edit') {
      if (!canUpdate) {
        return;
      }
      updateMutation.mutate(
        { environmentId: dialogState.record.environment_id, payload },
        {
          onSuccess: () => {
            toast.success('环境已更新');
            setDialogState(null);
          },
        },
      );
      return;
    }
    if (!canCreate) {
      return;
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('环境已创建');
        setDialogState(null);
      },
    });
  }

  async function openSelected() {
    if (
      !selectedOpenableEnvironments.length ||
      isRuntimePending ||
      isCheckingLaunchStatus ||
      !(await ensureLaunchReady())
    ) {
      return;
    }
    let openedCount = 0;
    for (const environment of selectedOpenableEnvironments) {
      await runtimeMutation.mutateAsync({
        environmentId: environment.environment_id,
        action: 'open',
      });
      openedCount += 1;
    }
    if (openedCount) {
      toastBrowserOpenSuccess(`已打开 ${openedCount} 个环境`);
    }
  }

  async function confirmDelete(environmentIds: number[]) {
    if (!environmentIds.length || !canDelete) {
      return;
    }
    let deletedCount = 0;
    for (const environmentId of environmentIds) {
      await deleteMutation.mutateAsync(environmentId);
      deletedCount += 1;
    }
    setSelectedIds((current) =>
      current.filter(
        (environmentId) => !environmentIds.includes(environmentId),
      ),
    );
    setDeleteTarget(null);
    if (deletedCount) {
      toast.success(`已删除 ${deletedCount} 个环境`);
    }
  }

  return {
    dialogState,
    deleteTarget,
    loadingDetailId,
    selectedIdSet,
    selectedEnvironments,
    selectedOpenableEnvironments,
    selectedHasRunningEnvironments,
    allVisibleSelected,
    someVisibleSelected,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: createMutation.isPending,
    isStatusPending: statusMutation.isPending,
    isRuntimePending,
    isCheckingLaunchStatus,
    runtimeEnvironmentId: runtimeMutation.variables?.environmentId,
    runtimeAction: runtimeMutation.variables?.action,
    toggleVisible,
    toggle,
    openEditor,
    duplicate,
    toggleStatus,
    open,
    close,
    requestDelete: (record: RemoteEnvironmentListItem) =>
      setDeleteTarget({ environmentIds: [record.environment_id] }),
    closeEditor: () => {
      detailRequest.current += 1;
      setLoadingDetailId(null);
      setDialogState(null);
    },
    submit,
    clearSelection: () => setSelectedIds([]),
    openSelected,
    deleteSelected: () => {
      if (!selectedEnvironments.length || selectedHasRunningEnvironments) {
        return;
      }
      setDeleteTarget({
        environmentIds: selectedEnvironments.map(
          (environment) => environment.environment_id,
        ),
      });
    },
    dismissDelete: () => setDeleteTarget(null),
    confirmDelete,
  };
}
