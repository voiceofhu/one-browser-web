import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { resolveErrorState } from '@/views/error/error-state';

export function ResourceTableLoading({ columnCount = 5 }: { columnCount?: number }) {
  const columns = Array.from({ length: columnCount }, (_, index) => index);

  return (
    <Table className="min-w-[640px]" aria-label="数据加载中" aria-busy="true">
      <TableHeader className="bg-muted">
        <TableRow aria-hidden="true" className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead key={column} className="h-8">
              <Skeleton className="h-3 w-16 rounded-sm" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }, (_, index) => (
          <TableRow key={index} aria-hidden="true" className="hover:bg-transparent">
            {columns.map((column) => (
              <TableCell key={column} className="h-10 py-1.5">
                <Skeleton className="h-3 w-3/4 max-w-32 rounded-sm" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ResourceError({
  error,
  isRetrying,
  onRetry,
}: {
  error: unknown;
  isRetrying?: boolean;
  onRetry?: () => void;
}) {
  const state = resolveErrorState(error);

  return (
    <Empty className="min-h-56 rounded-none px-4 py-8">
      <EmptyHeader className="gap-1.5">
        <span className="text-muted-foreground font-mono text-[11px]">{state.code}</span>
        <EmptyTitle className="text-sm">{state.title}</EmptyTitle>
        <EmptyDescription>{state.description}</EmptyDescription>
        <p className="text-muted-foreground text-xs">{state.hint}</p>
      </EmptyHeader>
      <EmptyContent className="flex-row flex-wrap justify-center gap-2">
        {onRetry ? (
          <Button size="sm" variant="outline" disabled={isRetrying} onClick={onRetry}>
            {isRetrying ? '重试中' : '重新加载'}
          </Button>
        ) : null}
        <CopyButton
          size="sm"
          variant="ghost"
          text={`${state.code}\n${state.title}\n${state.description}`}
        >
          复制错误
        </CopyButton>
      </EmptyContent>
    </Empty>
  );
}

export function ResourceEmpty() {
  return (
    <Empty className="min-h-56 rounded-none px-4 py-8">
      <EmptyHeader>
        <EmptyTitle>暂无数据</EmptyTitle>
        <EmptyDescription>当前权限范围内没有可显示的记录。</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
