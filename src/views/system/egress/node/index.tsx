import { DialogActionButton } from '@/components/ui/dialog-action-button';
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { CopyButton } from '@/components/ui/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TablePagination } from '@/components/table-pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  BrowserTableRefreshButton,
  BrowserTableSearchField,
  BrowserTableToolbar,
} from '@/features/browser/components/table-toolbar';
import { isTauriRuntime } from '@/lib/desktop';
import { formatDisplayDateTime } from '@/lib/date-time';
import { getApiBaseUrl } from '@/lib/http';
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  ServerStack03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ColumnDef,
  RowSelectionState,
  VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';
import { toast } from 'sonner';

import {
  cancelEgressEnrollment,
  createEgressEnrollment,
  deleteEgressNode,
  getEgressReleaseStatus,
  listEgressNodes,
  updateEgressNode,
  updateEgressNodeStatus,
} from './api';
import { NodeBulkActions } from './node-bulk-actions';
import type {
  CreateEgressEnrollmentResult,
  EgressNodeResource,
  EgressNodeStatus,
  EgressUpgradeResource,
} from './types';

const QUERY_KEY = ['system', 'egress-nodes'] as const;
const RELEASE_QUERY_KEY = ['system', 'egress-releases'] as const;
const PAGE_SIZE_OPTIONS = [15, 30, 50] as const;
const STATUS_OPTIONS: Array<{
  value: 'all' | EgressNodeStatus;
  label: string;
}> = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待接入' },
  { value: 'installing', label: '安装中' },
  { value: 'init', label: '初始化' },
  { value: 'healthy', label: '健康' },
  { value: 'degraded', label: '降级' },
  { value: 'draining', label: '排空中' },
  { value: 'unhealthy', label: '异常' },
  { value: 'disabled', label: '已禁用' },
  { value: 'expired', label: '已过期' },
];

type EditorState =
  | { mode: 'create' }
  | { mode: 'edit'; node: EgressNodeResource }
  | { mode: 'enroll'; node: EgressNodeResource };

export default function EgressNodePage() {
  const { access } = useAuth();
  const queryClient = useQueryClient();
  const canList = hasPermission(access, 'system:egress:list');
  const canCreate = hasButtonPermission(access, 'system:egress:create');
  const canUpdate = hasButtonPermission(access, 'system:egress:update');
  const canDelete = hasButtonPermission(access, 'system:egress:delete');
  const [keyword, setKeyword] = React.useState('');
  const [status, setStatus] = React.useState<'all' | EgressNodeStatus>('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);
  const [editor, setEditor] = React.useState<EditorState | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<EgressNodeResource | null>(null);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const deferredKeyword = React.useDeferredValue(keyword.trim());
  const query = useQuery({
    queryKey: [...QUERY_KEY, deferredKeyword, status, page, pageSize],
    queryFn: () =>
      listEgressNodes({
        keyword: deferredKeyword || undefined,
        status: status === 'all' ? undefined : status,
        page,
        page_size: pageSize,
      }),
    enabled: canList,
    refetchInterval: isTauriRuntime() ? 3_000 : false,
  });
  const releaseQuery = useQuery({
    queryKey: RELEASE_QUERY_KEY,
    queryFn: getEgressReleaseStatus,
    enabled: canList && canUpdate,
    staleTime: 5 * 60 * 1000,
  });
  const nodes = React.useMemo(() => query.data?.list ?? [], [query.data?.list]);
  const total = query.data?.total ?? 0;
  const selectedNodes = React.useMemo(
    () => nodes.filter((node) => rowSelection[node.egress_id]),
    [nodes, rowSelection],
  );

  React.useEffect(() => {
    if (!canList || isTauriRuntime()) return;
    const source = new EventSource(
      `${getApiBaseUrl()}/system/egress-nodes/events`,
      { withCredentials: true },
    );
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    };
    source.addEventListener('egress-node', refresh);
    return () => {
      source.removeEventListener('egress-node', refresh);
      source.close();
    };
  }, [canList, queryClient]);

  const actionMutation = useMutation({
    mutationFn: async (action: {
      kind: 'draining' | 'enabled' | 'delete';
      node: EgressNodeResource;
    }) => {
      if (action.kind === 'delete') {
        return action.node.lifecycle === 'pending'
          ? cancelEgressEnrollment(action.node.egress_id)
          : deleteEgressNode(action.node.egress_id);
      }
      return updateEgressNodeStatus(action.node.egress_id, action.kind);
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(action.kind === 'delete' ? '节点已删除' : '节点状态已更新');
      setDeleteTarget(null);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : '节点操作失败'),
  });
  const columns = React.useMemo<ColumnDef<EgressNodeResource>[]>(
    () => [
      ...(canUpdate
        ? [
            {
              id: 'select',
              header: ({ table }) => (
                <Checkbox
                  aria-label="选择全部节点"
                  checked={
                    table.getIsAllRowsSelected()
                      ? true
                      : table.getIsSomeRowsSelected()
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={(checked) =>
                    table.toggleAllRowsSelected(Boolean(checked))
                  }
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  aria-label={`选择节点 ${row.original.display_name}`}
                  checked={row.getIsSelected()}
                  onCheckedChange={(checked) =>
                    row.toggleSelected(Boolean(checked))
                  }
                />
              ),
              enableHiding: false,
              enableSorting: false,
              meta: {
                headerClassName: 'sticky left-0 z-30 bg-muted/95',
                cellClassName:
                  'sticky left-0 z-20 bg-card group-data-[state=selected]/row:bg-muted group-hover/row:bg-muted/50',
              },
            } satisfies ColumnDef<EgressNodeResource>,
          ]
        : []),
      {
        accessorKey: 'display_name',
        header: '节点',
        cell: ({ row }) => (
          <div className="min-w-44">
            <div className="truncate font-medium">
              {row.original.display_name}
            </div>
            <code className="text-muted-foreground block truncate text-xs">
              {row.original.egress_id}
            </code>
          </div>
        ),
        meta: { label: '节点' },
      },
      {
        id: 'runtime',
        header: '版本',
        cell: ({ row }) => <NodeRuntime node={row.original} />,
        meta: { label: '版本' },
      },
      {
        accessorKey: 'public_endpoint',
        header: '接入点',
        cell: ({ row }) => (
          <div className="min-w-52">
            <div className="truncate">{row.original.public_endpoint}</div>
            <div className="text-muted-foreground text-xs">
              {row.original.tls_enabled ? 'TLS / H2' : '开发 H2'}
            </div>
          </div>
        ),
        meta: { label: '接入点' },
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => <NodeStatus node={row.original} />,
        meta: { label: '状态' },
      },
      {
        accessorKey: 'load_percent',
        header: '负载',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.load_percent === null
              ? '-'
              : `${row.original.load_percent}%`}
          </span>
        ),
        meta: { label: '负载' },
      },
      {
        id: 'connections',
        header: '连接 / 流',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.active_connections}/{row.original.max_connections} ·{' '}
            {row.original.active_streams}/{row.original.max_streams}
          </span>
        ),
        meta: { label: '连接 / 流' },
      },
      {
        accessorKey: 'heartbeat_at',
        header: '最近心跳',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDisplayDateTime(row.original.heartbeat_at)}
          </span>
        ),
        meta: { label: '最近心跳' },
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <NodeActions
            node={row.original}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
            disabled={actionMutation.isPending}
            onEdit={() => setEditor({ mode: 'edit', node: row.original })}
            onEnroll={() => setEditor({ mode: 'enroll', node: row.original })}
            onStatus={(nextStatus) =>
              actionMutation.mutate({ kind: nextStatus, node: row.original })
            }
            onDelete={() => setDeleteTarget(row.original)}
          />
        ),
        enableHiding: false,
      },
    ],
    [actionMutation, canCreate, canDelete, canUpdate],
  );

  if (!canList) {
    return (
      <Empty className="bg-muted min-h-full">
        <EmptyHeader>
          <EmptyTitle>暂无节点管理权限</EmptyTitle>
          <EmptyDescription>请联系管理员授予节点查看权限。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden">
      <BrowserTableToolbar
        filters={
          <div className="flex items-center gap-1.5">
            <BrowserTableSearchField
              value={keyword}
              placeholder="搜索节点名称、ID、域名"
              ariaLabel="搜索节点"
              className="w-56"
              onValueChange={(value) => {
                setKeyword(value);
                setPage(1);
                setRowSelection({});
              }}
            />
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as typeof status);
                setPage(1);
                setRowSelection({});
              }}
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        }
        actions={
          <>
            <BrowserTableRefreshButton
              isRefreshing={query.isFetching}
              onRefresh={query.refetch}
              successMessage="节点列表已刷新"
            />
            {canCreate ? (
              <Button size="sm" onClick={() => setEditor({ mode: 'create' })}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                新增节点
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
        {query.isError ? (
          <Empty className="min-h-full">
            <EmptyHeader>
              <EmptyTitle>节点列表加载失败</EmptyTitle>
              <EmptyDescription>{query.error.message}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <BrowserDataTable
            columns={columns}
            data={nodes}
            emptyTitle="暂无节点"
            emptyDescription="新增节点后，复制安装命令到目标服务器执行。"
            getRowId={(node) => node.egress_id}
            isLoading={query.isLoading}
            density="compact"
            enableRowSelection={canUpdate}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        )}
      </div>

      <TablePagination
        currentPage={page}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        total={total}
        isUpdating={query.isFetching && !query.isLoading}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          setRowSelection({});
        }}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
          setRowSelection({});
        }}
      />

      {canUpdate ? (
        <NodeBulkActions
          nodes={selectedNodes}
          releaseStatus={releaseQuery.data}
          releaseLoading={releaseQuery.isLoading}
          onSelectionChange={(egressIds) =>
            setRowSelection(
              Object.fromEntries(egressIds.map((egressId) => [egressId, true])),
            )
          }
          onUpdated={() =>
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
          }
        />
      ) : null}

      <NodeEditorDialog
        key={
          editor
            ? editor.mode === 'create'
              ? 'create'
              : `${editor.mode}:${editor.node.egress_id}`
            : 'closed'
        }
        state={editor}
        onClose={() => setEditor(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: QUERY_KEY })}
      />
      <DeleteNodeDialog
        node={deleteTarget}
        pending={actionMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            actionMutation.mutate({ kind: 'delete', node: deleteTarget });
          }
        }}
      />
    </section>
  );
}

function NodeRuntime({ node }: { node: EgressNodeResource }) {
  const upgrade = node.upgrade;
  if (node.lifecycle === 'pending') {
    return <span className="text-muted-foreground">待安装</span>;
  }
  return (
    <div className="flex min-w-28 flex-col gap-0.5">
      <span className="font-mono tabular-nums">
        {node.runtime_version || '未知版本'}
      </span>
      {upgrade ? (
        <span
          className={
            upgrade.status === 'failed'
              ? 'text-destructive text-[0.625rem]'
              : 'text-muted-foreground text-[0.625rem]'
          }
          title={upgrade.message || undefined}
        >
          {upgradeStatusLabel(upgrade.status)} · {upgrade.target_version}
        </span>
      ) : node.self_upgrade ? (
        <span className="text-muted-foreground text-[0.625rem]">
          支持远程升级
        </span>
      ) : (
        <span className="text-warning text-[0.625rem]">不支持远程升级</span>
      )}
    </div>
  );
}

function upgradeStatusLabel(status: EgressUpgradeResource['status']) {
  switch (status) {
    case 'pending':
    case 'accepted':
      return '等待升级';
    case 'running':
      return '升级中';
    case 'succeeded':
      return '升级成功';
    case 'failed':
      return '升级失败';
  }
}

function NodeStatus({ node }: { node: EgressNodeResource }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={
          node.online
            ? 'bg-success size-1.5 rounded-full'
            : 'bg-muted-foreground/40 size-1.5 rounded-full'
        }
      />
      <Badge variant={statusVariant(node.status)}>
        {statusLabel(node.status)}
      </Badge>
      <Badge variant="outline">
        {node.environment === 'production' ? '正式' : '开发'}
      </Badge>
    </div>
  );
}

function NodeActions({
  node,
  canCreate,
  canUpdate,
  canDelete,
  disabled,
  onEdit,
  onEnroll,
  onStatus,
  onDelete,
}: {
  node: EgressNodeResource;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  disabled: boolean;
  onEdit: () => void;
  onEnroll: () => void;
  onStatus: (status: 'draining' | 'enabled') => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="节点操作">
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {canUpdate && node.lifecycle === 'active' ? (
            <DropdownMenuItem disabled={disabled} onSelect={onEdit}>
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
              修改名称
            </DropdownMenuItem>
          ) : null}
          {canCreate && (node.lifecycle === 'pending' || !node.online) ? (
            <DropdownMenuItem disabled={disabled} onSelect={onEnroll}>
              <HugeiconsIcon icon={ServerStack03Icon} strokeWidth={2} />
              {node.lifecycle === 'pending' ? '重新生成命令' : '重新接入'}
            </DropdownMenuItem>
          ) : null}
          {canUpdate && node.lifecycle === 'active' ? (
            <DropdownMenuItem
              disabled={disabled}
              onSelect={() => onStatus(node.draining ? 'enabled' : 'draining')}
            >
              <HugeiconsIcon
                icon={node.draining ? PlayIcon : PauseIcon}
                strokeWidth={2}
              />
              {node.draining ? '恢复接入' : '开始排空'}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? <DropdownMenuSeparator /> : null}
          {canDelete ? (
            <DropdownMenuItem
              variant="destructive"
              disabled={disabled}
              onSelect={onDelete}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              删除节点
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NodeEditorDialog({
  state,
  onClose,
  onSaved,
}: {
  state: EditorState | null;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) {
  const node = state && state.mode !== 'create' ? state.node : null;
  const [domain, setDomain] = React.useState(node?.domain ?? '');
  const [displayName, setDisplayName] = React.useState(
    node?.display_name ?? '',
  );
  const [maxConnections, setMaxConnections] = React.useState(
    String(node?.max_connections ?? 256),
  );
  const [maxStreams, setMaxStreams] = React.useState(
    String(node?.max_streams ?? 2048),
  );
  const [result, setResult] =
    React.useState<CreateEgressEnrollmentResult | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      if (state?.mode === 'edit' && node) {
        await updateEgressNode(node.egress_id, displayName.trim());
        return null;
      }
      return createEgressEnrollment({
        domain: domain.trim(),
        display_name: displayName.trim(),
        max_connections: Number(maxConnections),
        max_streams: Number(maxStreams),
        ...(state?.mode === 'enroll' && node
          ? { replace: true, replace_egress_id: node.egress_id }
          : {}),
      });
    },
    onSuccess: async (nextResult) => {
      await onSaved();
      if (nextResult) {
        setResult(nextResult);
        toast.success('接入命令已生成');
      } else {
        toast.success('节点名称已更新');
        onClose();
      }
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : '节点保存失败'),
  });

  return (
    <ResponsiveDialog
      open={Boolean(state)}
      onOpenChange={(open) => !open && !mutation.isPending && onClose()}
    >
      <ResponsiveDialogContent className="sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {state?.mode === 'edit'
              ? '修改节点'
              : state?.mode === 'enroll'
                ? '重新接入节点'
                : '新增节点'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {result
              ? '复制一种安装命令到目标服务器执行。'
              : '配置节点身份和容量。'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="flex flex-col gap-3">
          {result ? (
            <>
              <CommandField
                title="Native 安装"
                command={result.native_install_command}
              />
              <CommandField
                title="Docker 安装"
                command={result.docker_install_command}
              />
              <p className="text-muted-foreground text-xs">
                命令有效期至 {formatDisplayDateTime(result.expires_at)}
                ，请勿公开接入令牌。
              </p>
            </>
          ) : (
            <>
              {state?.mode !== 'edit' ? (
                <Field label="接入域名">
                  <Input
                    value={domain}
                    disabled={state?.mode === 'enroll'}
                    onChange={(event) => setDomain(event.target.value)}
                    placeholder="egress.example.com"
                  />
                </Field>
              ) : null}
              <Field label="节点名称">
                <Input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </Field>
              {state?.mode !== 'edit' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="最大连接数">
                    <Input
                      type="number"
                      min={1}
                      max={16384}
                      value={maxConnections}
                      onChange={(event) =>
                        setMaxConnections(event.target.value)
                      }
                    />
                  </Field>
                  <Field label="最大流数量">
                    <Input
                      type="number"
                      min={1}
                      max={65535}
                      value={maxStreams}
                      onChange={(event) => setMaxStreams(event.target.value)}
                    />
                  </Field>
                </div>
              ) : null}
            </>
          )}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            variant="outline"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            {result ? '完成' : '取消'}
          </DialogActionButton>
          {!result ? (
            <DialogActionButton
              action="confirm"
              disabled={
                mutation.isPending ||
                !displayName.trim() ||
                (state?.mode !== 'edit' && !domain.trim())
              }
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending
                ? '保存中…'
                : state?.mode === 'edit'
                  ? '保存'
                  : '生成接入命令'}
            </DialogActionButton>
          ) : null}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function CommandField({ title, command }: { title: string; command: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Label>{title}</Label>
        <CopyButton text={command} size="xs">
          复制
        </CopyButton>
      </div>
      <Textarea
        readOnly
        value={command}
        className="min-h-24 font-mono text-xs"
      />
    </div>
  );
}

function Field({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      {children}
    </div>
  );
}

function DeleteNodeDialog({
  node,
  pending,
  onClose,
  onConfirm,
}: {
  node: EgressNodeResource | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ResponsiveDialog
      open={Boolean(node)}
      onOpenChange={(open) => !open && !pending && onClose()}
    >
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>确认删除节点</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            活跃分配、运行环境或连接仍在使用时，Backend 会拒绝删除。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <p className="text-sm">确定删除「{node?.display_name ?? ''}」吗？</p>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            取消
          </DialogActionButton>
          <DialogActionButton
            action="confirm"
            variant="destructive"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? '删除中…' : '确认删除'}
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function statusLabel(status: EgressNodeStatus) {
  const labels: Record<EgressNodeStatus, string> = {
    pending: '待接入',
    installing: '安装中',
    expired: '已过期',
    init: '初始化',
    healthy: '健康',
    degraded: '降级',
    draining: '排空中',
    unhealthy: '异常',
    disabled: '已禁用',
  };
  return labels[status];
}

function statusVariant(
  status: EgressNodeStatus,
): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'healthy') return 'success';
  if (status === 'degraded' || status === 'draining' || status === 'installing')
    return 'secondary';
  if (status === 'unhealthy' || status === 'disabled' || status === 'expired')
    return 'destructive';
  return 'outline';
}
