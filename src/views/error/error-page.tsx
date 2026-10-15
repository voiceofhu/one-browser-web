import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { cn } from '@/lib/utils';
import { AlertCircleIcon, RefreshIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { resolveErrorState } from './error-state';

export default function ErrorPage({
  error,
  reset,
  embedded = false,
}: {
  error: unknown;
  reset?: () => void;
  embedded?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const state = resolveErrorState(error, 'page');
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined;
  const details = [
    `One Browser · ${state.code}`,
    `Path: ${location.pathname}`,
    typeof errorCode === 'string' || typeof errorCode === 'number'
      ? `Code: ${errorCode}`
      : '',
    message,
  ]
    .filter(Boolean)
    .join('\n');

  function retry() {
    if (state.kind === 'resource' || !reset) {
      window.location.reload();
      return;
    }
    reset();
  }

  return (
    <main
      className={cn(
        'bg-background text-foreground flex min-w-0 flex-col p-3 sm:p-4',
        embedded ? 'min-h-72 flex-1' : 'h-dvh overflow-y-auto',
      )}
    >
      <title>{`${state.title} · One Browser`}</title>
      <section className="bg-card my-auto w-full max-w-lg shrink-0 self-center overflow-hidden rounded-md border">
        <header className="bg-muted/30 flex items-center justify-between gap-3 border-b px-3 py-2">
          <span className="text-xs font-medium">One Browser</span>
          <Badge variant="outline" className="rounded-sm font-mono">
            {state.code}
          </Badge>
        </header>
        <div className="space-y-3 p-3">
          <Alert className="rounded-sm border-0 bg-transparent p-0">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="text-muted-foreground size-4"
            />
            <AlertTitle className="text-sm font-semibold">
              {state.title}
            </AlertTitle>
            <AlertDescription>{state.description}</AlertDescription>
          </Alert>
          <p className="text-muted-foreground border-l-2 pl-2 text-xs leading-relaxed">
            {state.hint}
          </p>
          <Accordion type="single" collapsible className="rounded-sm">
            <AccordionItem value="details">
              <AccordionTrigger className="py-1.5">错误详情</AccordionTrigger>
              <AccordionContent className="space-y-2 pb-2">
                <pre className="bg-muted/40 text-muted-foreground max-h-40 overflow-auto rounded-sm border p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {details}
                </pre>
                <CopyButton
                  text={details}
                  variant="outline"
                  size="sm"
                  idleLabel="复制错误详情"
                >
                  {(stage) => (stage === 'copied' ? '已复制' : '复制错误详情')}
                </CopyButton>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <footer className="bg-muted/20 flex flex-wrap items-center gap-2 border-t px-3 py-2">
          {state.kind === 'unauthorized' ? (
            <Button asChild>
              <Link to="/login">重新登录</Link>
            </Button>
          ) : state.kind !== 'not-found' ? (
            <Button type="button" onClick={retry}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
              {state.kind === 'resource' ? '重新加载页面' : '重试'}
            </Button>
          ) : null}
          <Button
            asChild
            variant={state.kind === 'not-found' ? 'default' : 'outline'}
          >
            <Link to="/">返回首页</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              window.history.length > 1
                ? navigate(-1)
                : navigate('/', { replace: true })
            }
          >
            返回上一页
          </Button>
        </footer>
      </section>
    </main>
  );
}
