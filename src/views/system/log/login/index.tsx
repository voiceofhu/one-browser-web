import { DialogActionButton } from '@/components/ui/dialog-action-button';
import { LoadingState } from '@/components/loading-state';
import { TablePagination } from '@/components/table-pagination';
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  BrowserTableFilterTabs,
  BrowserTableRefreshButton,
  BrowserTableSearchField,
  BrowserTableToolbar,
} from '@/features/browser/components/table-toolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTimeTitle, formatDisplayDateTime } from '@/lib/date-time';
import { http } from '@/lib/http';
import { useQuery } from '@tanstack/react-query';
import { FileViewIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';

type StatusFilter = 'all' | '0' | '1';

type LoginLogRecord = {
  info_id: number;
  user_name: string;
  ip_addr: string;
  status: '0' | '1';
  msg: string;
  login_at: string;
};

type LoginLogDetail = LoginLogRecord & {
  login_location: string;
  browser: string;
  os: string;
};

type PageResponse<T> = { list: T[]; total: number };

const PAGE_SIZE = 15;
const STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '成功', value: '0' },
  { label: '失败', value: '1' },
] satisfies Array<{ label: string; value: StatusFilter }>;

export default function LoginLogPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [page, setPage] = React.useState(1);
  const [detailId, setDetailId] = React.useState<number | null>(null);
  const keyword = React.useDeferredValue(search.trim());
  const query = useQuery({
    queryKey: ['system-login-logs', { keyword, page, status }],
    queryFn: () => listLoginLogs(page, keyword, status),
    placeholderData: (previousData) => previousData,
  });
  const total = query.data?.total ?? 0;

  return (
    <>
      <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <BrowserTableToolbar
          filters={
            <>
              <BrowserTableFilterTabs
                label="登录结果筛选"
                value={status}
                options={STATUS_OPTIONS}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              />
              <BrowserTableSearchField
                className="w-full sm:w-72"
                value={search}
                placeholder="搜索登录日志"
                ariaLabel="搜索登录日志"
                onValueChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
              />
            </>
          }
          actions={
            <BrowserTableRefreshButton
              isRefreshing={query.isFetching}
              onRefresh={query.refetch}
              successMessage="登录日志已刷新"
            />
          }
        />

        <div className="min-h-0 flex-1 overflow-auto">
          {query.isLoading ? (
            <LoadingState label="登录日志加载中..." />
          ) : query.isError ? (
            <ErrorState error={query.error} />
          ) : query.data?.list.length ? (
            <Table>
              <TableHeader className="bg-muted/70 sticky top-0 z-10 backdrop-blur-xl">
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>IP 地址</TableHead>
                  <TableHead>结果</TableHead>
                  <TableHead>消息</TableHead>
                  <TableHead>登录时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.list.map((log) => (
                  <TableRow key={log.info_id}>
                    <TableCell className="font-medium">
                      {log.user_name || '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.ip_addr || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === '0' ? 'success' : 'destructive'}
                      >
                        {log.status === '0' ? '成功' : '失败'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-muted-foreground block max-w-96 truncate text-xs"
                        title={log.msg}
                      >
                        {log.msg || '—'}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      title={formatDateTimeTitle(log.login_at)}
                    >
                      {formatDisplayDateTime(log.login_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="查看登录日志详情"
                        title="查看详情"
                        onClick={() => setDetailId(log.info_id)}
                      >
                        <HugeiconsIcon icon={FileViewIcon} strokeWidth={2} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState />
          )}
        </div>

        <TablePagination
          currentPage={page}
          pageSize={PAGE_SIZE}
          total={total}
          isUpdating={query.isFetching && !query.isLoading}
          onPageChange={setPage}
        />
      </section>

      {detailId === null ? null : (
        <LoginLogDetailDialog
          infoId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </>
  );
}

async function listLoginLogs(
  page: number,
  keyword: string,
  status: StatusFilter,
) {
  const params: Record<string, string | number | boolean> = {
    page,
    page_size: PAGE_SIZE,
  };
  if (keyword) params.keyword = keyword;
  if (status !== 'all') params.status = status;
  const response = await http.get<PageResponse<LoginLogRecord>>(
    '/system/login-logs',
    params,
  );
  return response.data;
}

async function getLoginLog(infoId: number) {
  const response = await http.get<LoginLogDetail>(
    `/system/login-logs/${infoId}`,
  );
  return response.data;
}

function LoginLogDetailDialog({
  infoId,
  onClose,
}: {
  infoId: number;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ['system-login-log', infoId],
    queryFn: () => getLoginLog(infoId),
  });

  return (
    <ResponsiveDialog open onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>登录日志详情</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            查看本次登录的客户端、来源和处理结果。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          {query.isLoading ? (
            <LoadingState className="min-h-48" label="日志详情加载中..." />
          ) : query.isError ? (
            <ErrorState error={query.error} />
          ) : query.data ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="用户名" value={query.data.user_name} />
              <DetailField
                label="结果"
                value={query.data.status === '0' ? '成功' : '失败'}
              />
              <DetailField label="IP 地址" value={query.data.ip_addr} mono />
              <DetailField label="登录地点" value={query.data.login_location} />
              <DetailField label="浏览器" value={query.data.browser} />
              <DetailField label="操作系统" value={query.data.os} />
              <DetailField
                label="登录时间"
                value={formatDateTimeTitle(query.data.login_at)}
              />
              <DetailField label="消息" value={query.data.msg} wide />
            </div>
          ) : null}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            type="button"
            variant="outline"
            onClick={onClose}
          >
            关闭
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function DetailField({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string;
  value: string | undefined;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={`mt-1 text-sm break-all ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value || '—'}
      </p>
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyTitle>登录日志加载失败</EmptyTitle>
        <EmptyDescription>
          {error instanceof Error ? error.message : '请稍后重试'}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function EmptyState() {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyTitle>暂无登录日志</EmptyTitle>
        <EmptyDescription>当前筛选条件下没有可显示的记录。</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
