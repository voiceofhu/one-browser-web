import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import { DialogActionButton } from '@/components/ui/dialog-action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  CheckProxyRequest,
  CreateProxyRequest,
  ProxyConfig,
  UpdateProxyRequest,
} from '@/features/browser/contracts';
import { toBrowserErrorMessage } from '@/features/browser/errors';
import {
  ProxyBatchImportDialog,
  ProxyEditor,
  type ProxyEditorSubmitValue,
  ProxyTable,
  checkProxy as checkProxyApi,
} from '@/features/browser/proxy-core';
import { cn } from '@/lib/utils';
import {
  Add01Icon,
  ArrowDown01Icon,
  FileImportIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';

import {
  isNetworkUnavailable,
  networkUnavailableMessage,
} from '../../status/network-guard';
import { useAppStatusQuery } from '../../status/queries';
import { getProxy, writeClipboardText } from '../api/client';
import {
  useCheckProxiesMutation,
  useCheckProxyMutation,
  useCreateProxyMutation,
  useDeleteProxiesMutation,
  useDuplicateProxyMutation,
  useProxiesQuery,
  useProxyQuery,
  useUpdateProxyMutation,
} from '../hooks/use-proxy-queries';

export function ProxiesPageContent({ search }: { search: string }) {
  const proxiesQuery = useProxiesQuery();
  const createProxyMutation = useCreateProxyMutation();
  const duplicateProxyMutation = useDuplicateProxyMutation();
  const updateProxyMutation = useUpdateProxyMutation();
  const deleteProxiesMutation = useDeleteProxiesMutation();
  const checkProxyMutation = useCheckProxyMutation();
  const editorCheckProxyMutation = useCheckProxyMutation({
    invalidateOnSuccess: false,
  });
  const checkProxiesMutation = useCheckProxiesMutation();
  const { refetch: refetchAppStatus } = useAppStatusQuery();
  const checkingProxyId = checkProxyMutation.variables?.proxyId ?? null;
  const savingProxy =
    createProxyMutation.isPending || updateProxyMutation.isPending;
  const proxyEditorFormId = 'proxy-editor-form';
  const createMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchImporting, setBatchImporting] = useState(false);
  const [editingProxyId, setEditingProxyId] = useState<string | null>(null);
  const editingProxyQuery = useProxyQuery(
    { proxyId: editingProxyId ?? '' },
    Boolean(editingProxyId && dialogOpen),
  );
  const proxies = useMemo(
    () => proxiesQuery.data?.list ?? [],
    [proxiesQuery.data?.list],
  );
  const filteredProxies = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return proxies;
    }
    return proxies.filter((proxy) =>
      [proxy.proxyId, proxy.name, proxy.type, proxy.host, proxy.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [proxies, search]);

  useEffect(() => {
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

  function submitProxy(value: ProxyEditorSubmitValue) {
    void submitProxyWithAutoCheck(value);
  }

  async function ensureNetworkReady() {
    const statusResult = await refetchAppStatus();
    if (statusResult.error) {
      toast.error(toBrowserErrorMessage(statusResult.error));
      return false;
    }

    if (isNetworkUnavailable(statusResult.data)) {
      toast.error(networkUnavailableMessage);
      return false;
    }

    return true;
  }

  async function submitProxyWithAutoCheck(value: ProxyEditorSubmitValue) {
    try {
      if (!(await ensureNetworkReady())) {
        return;
      }

      const checkResult = await editorCheckProxyMutation.mutateAsync(
        proxyCheckRequestFromSubmitValue(value, editingProxyQuery.data),
      );

      if (checkResult.status !== 'ok') {
        toast.error(checkResult.message || '代理检测未通过');
        return;
      }

      if (editingProxyId) {
        const proxy = await updateProxyMutation.mutateAsync(
          value as UpdateProxyRequest,
        );
        toast.success('代理已更新');
        setDialogOpen(false);
        setEditingProxyId(null);
        void checkProxy(proxy.proxyId);
        return;
      }

      const proxy = await createProxyMutation.mutateAsync(
        value as CreateProxyRequest,
      );
      toast.success('代理已创建');
      setDialogOpen(false);
      void checkProxy(proxy.proxyId);
    } catch {
      // Mutation hooks already surface desktop/API errors through toastBrowserError.
    }
  }

  function openCreateDialog() {
    closeCreateMenu();
    setEditingProxyId(null);
    editorCheckProxyMutation.reset();
    setDialogOpen(true);
  }

  function openBatchDialog() {
    closeCreateMenu();
    setBatchDialogOpen(true);
  }

  function openEditDialog(proxyId: string) {
    setEditingProxyId(proxyId);
    editorCheckProxyMutation.reset();
    setDialogOpen(true);
  }

  async function checkProxy(proxyId: string) {
    if (!(await ensureNetworkReady())) {
      return;
    }

    checkProxyMutation.mutate(
      { proxyId },
      {
        onSuccess: (result) => {
          if (result.status === 'ok') {
            toast.success('代理检测通过');
          } else {
            toast.error(result.message || '代理检测未通过');
          }
        },
      },
    );
  }

  async function checkManyProxies(proxyIds: string[]) {
    if (!(await ensureNetworkReady())) {
      return;
    }

    checkProxiesMutation.mutate(
      { proxyIds },
      {
        onSuccess: () => {
          toast.success(`已检测 ${proxyIds.length} 个代理`);
        },
      },
    );
  }

  async function deleteProxies(proxyIds: string[]) {
    await deleteProxiesMutation.mutateAsync({ proxyIds });
    toast.success(`已删除 ${proxyIds.length} 个代理`);
  }

  async function updateProxyRemark(proxyId: string, remark: string) {
    await updateProxyMutation.mutateAsync({ proxyId, remark });
    toast.success('备注已保存');
  }

  async function resolveProxyForCopy(proxyId: string) {
    return getProxy({ proxyId });
  }

  async function copyProxyText(text: string) {
    await writeClipboardText({ text });
  }

  async function checkProxyFromEditor(request: CheckProxyRequest) {
    if (!(await ensureNetworkReady())) {
      return;
    }

    editorCheckProxyMutation.mutate(request, {
      onSuccess: (result) => {
        if (result.status === 'ok') {
          toast.success('代理检测通过');
        } else {
          toast.error(result.message || '代理检测未通过');
        }
      },
    });
  }

  async function importProxyBatch(requests: CreateProxyRequest[]) {
    setBatchImporting(true);
    const savedProxyIds: string[] = [];

    try {
      for (const request of requests) {
        try {
          const proxy = await createProxyMutation.mutateAsync(request);
          savedProxyIds.push(proxy.proxyId);
        } catch {
          // useCreateProxyMutation 会展示具体保存错误，批量弹窗负责汇总数量。
        }
      }
      if (savedProxyIds.length > 0) {
        await proxiesQuery.refetch();
      }
      return savedProxyIds;
    } finally {
      setBatchImporting(false);
    }
  }

  const checkingProxyIds = useMemo(() => {
    if (checkProxiesMutation.isPending) {
      return new Set(checkProxiesMutation.variables?.proxyIds ?? []);
    }
    if (checkProxyMutation.isPending && checkingProxyId) {
      return new Set([checkingProxyId]);
    }
    return new Set<string>();
  }, [
    checkProxiesMutation.isPending,
    checkProxiesMutation.variables,
    checkProxyMutation.isPending,
    checkingProxyId,
  ]);

  return (
    <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-border/60 flex shrink-0 items-center justify-between gap-4 border-b px-4 py-2">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium">代理</h1>
        </div>
        <div>
          <DropdownMenu open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
            <div
              onPointerEnter={openCreateMenu}
              onPointerLeave={scheduleCloseCreateMenu}
            >
              <DropdownMenuTrigger asChild>
                <Button size="sm">
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

          <ResponsiveDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingProxyId(null);
                editorCheckProxyMutation.reset();
              }
            }}
          >
            <ResponsiveDialogContent className="sm:max-w-lg">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>
                  {editingProxyId ? '编辑代理' : '新建代理'}
                </ResponsiveDialogTitle>
                <ResponsiveDialogDescription className="sr-only">
                  创建或编辑可复用代理配置。
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <ResponsiveDialogBody>
                <ProxyEditor
                  key={
                    editingProxyId
                      ? `${editingProxyId}:${editingProxyQuery.data?.updatedAt ?? 'loading'}`
                      : 'create'
                  }
                  mode={editingProxyId ? 'edit' : 'create'}
                  formId={proxyEditorFormId}
                  proxy={editingProxyQuery.data}
                  checkResult={editorCheckProxyMutation.data}
                  isChecking={editorCheckProxyMutation.isPending}
                  onCheck={(request) => void checkProxyFromEditor(request)}
                  onFormChange={() => editorCheckProxyMutation.reset()}
                  onSubmit={submitProxy}
                />
              </ResponsiveDialogBody>
              <ResponsiveDialogFooter>
                <DialogActionButton
                  action="cancel"
                  onClick={() => setDialogOpen(false)}
                >
                  取消
                </DialogActionButton>
                <DialogActionButton
                  type="submit"
                  form={proxyEditorFormId}
                  disabled={
                    createProxyMutation.isPending ||
                    updateProxyMutation.isPending ||
                    editorCheckProxyMutation.isPending
                  }
                  loading={editorCheckProxyMutation.isPending || savingProxy}
                  loadingText={
                    editorCheckProxyMutation.isPending ? '检测中' : '保存中'
                  }
                >
                  保存
                </DialogActionButton>
              </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ProxyBatchImportDialog
            open={batchDialogOpen}
            existingProxies={proxies}
            isImporting={batchImporting}
            onBeforeCheck={ensureNetworkReady}
            onOpenChange={setBatchDialogOpen}
            onImport={importProxyBatch}
            onCheckProxy={checkProxyApi}
          />
        </div>
      </div>
      <ProxyTable
        data={filteredProxies}
        isLoading={proxiesQuery.isLoading}
        isChecking={
          checkProxyMutation.isPending || checkProxiesMutation.isPending
        }
        isDeleting={deleteProxiesMutation.isPending}
        isDuplicating={duplicateProxyMutation.isPending}
        updatingProxyId={updateProxyMutation.variables?.proxyId ?? null}
        checkingProxyIds={checkingProxyIds}
        onRefresh={proxiesQuery.refetch}
        onCheck={checkProxy}
        onCheckMany={checkManyProxies}
        onEdit={openEditDialog}
        onDuplicate={(proxyId) =>
          duplicateProxyMutation.mutate(proxyId, {
            onSuccess: () => toast.success('代理已复制'),
          })
        }
        onDelete={deleteProxies}
        onUpdateRemark={updateProxyRemark}
        onResolveCopyProxy={resolveProxyForCopy}
        onCopyProxyText={copyProxyText}
      />
    </section>
  );
}

function proxyCheckRequestFromSubmitValue(
  value: ProxyEditorSubmitValue,
  existingProxy?: ProxyConfig | null,
): CheckProxyRequest {
  const hasSubmittedPassword = Object.hasOwn(value, 'password');
  const password = hasSubmittedPassword
    ? (value.password ?? null)
    : (existingProxy?.password ?? null);

  return {
    proxyConfig: {
      type: value.type ?? existingProxy?.type ?? 'socks5',
      host: value.host ?? existingProxy?.host ?? null,
      port: value.port ?? existingProxy?.port ?? null,
      username: value.username ?? existingProxy?.username ?? null,
      password,
      server: value.server ?? existingProxy?.server ?? null,
      pacUrl: value.pacUrl ?? existingProxy?.pacUrl ?? null,
      bypassList: [...(value.bypassList ?? existingProxy?.bypassList ?? [])],
    },
    ipChecker: value.ipChecker ?? existingProxy?.ipChecker ?? null,
  };
}
