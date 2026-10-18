import { AppLoading } from '@/components/app-loading';
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Separator } from '@/components/ui/separator';
import { getWebLoginConfig, prepareWebLoginUrl } from '@/features/auth/api';
import { isReducedMotionPreferred } from '@/features/auth/components/auth-motion';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { resolveErrorState } from '@/views/error/error-state';
import {
  AlertCircleIcon,
  ArrowReloadVerticalIcon,
  Login02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { gsap } from 'gsap';
import * as React from 'react';

import { AppImage as Image } from '@/components/app-image';
import { toast } from 'sonner';

const APP_LOGO_SRC = '/pwa-512x512.png';

export type AuthGateStatusProps = {
  title: string;
  message: string;
  tone?: 'loading' | 'error';
  busy?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onLogin?: () => void;
};

export function AuthGateStatus({
  title,
  message,
  tone = 'loading',
  busy = false,
  error,
  onRetry,
  onLogin,
}: AuthGateStatusProps) {
  const [openingLogin, setOpeningLogin] = React.useState(false);
  const loginConfig = React.useMemo(() => getWebLoginConfig(), []);
  const isLoading = tone === 'loading';
  const errorState = resolveErrorState(error ?? new Error(message));
  const errorTitle = errorState.kind === 'unknown' ? title : errorState.title;
  const originalCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined;
  const diagnostic = [
    errorState.code,
    title,
    typeof originalCode === 'string' || typeof originalCode === 'number'
      ? `Code: ${originalCode}`
      : '',
    message,
  ].filter(Boolean).join('\n');

  async function openWebLogin() {
    if (onLogin) {
      onLogin();
      return;
    }
    if (isTauriRuntime() && loginConfig.status !== 'ready') {
      toast.error(loginConfig.message);
      return;
    }

    setOpeningLogin(true);
    try {
      const loginUrl = await prepareWebLoginUrl();
      if (isTauriRuntime()) {
        await desktopInvoke('open_external_url', {
          request: { url: loginUrl },
        });
      } else {
        window.location.assign(loginUrl);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '无法打开网页登录');
    } finally {
      setOpeningLogin(false);
    }
  }

  if (isLoading) {
    return <AppLoadingStatus title={title} message={message} />;
  }

  return (
    <main
      className="bg-muted text-foreground relative flex h-dvh min-w-0 overflow-y-auto px-4 py-12"
      onMouseDown={(event) => void startWindowDrag(event)}
    >
      <ThemeToggleButton className="absolute top-3 right-3 z-20" />
      <section
        className="relative m-auto flex w-full max-w-sm flex-col gap-3"
        aria-live="assertive"
      >
        <header className="flex items-center gap-2">
          <Image
            src={APP_LOGO_SRC}
            alt="有个浏览器"
            width={32}
            height={32}
            priority
            className="size-8 shrink-0 object-contain select-none"
            draggable={false}
          />
          <span className="flex-1 text-sm font-semibold">One Browser</span>
          <Badge variant="outline" className="font-mono">
            {errorState.code}
          </Badge>
        </header>
        <Separator />
        <Alert className="bg-background rounded-sm border px-3 py-2.5 shadow-none">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
          <AlertTitle>
            <h1 className="text-sm font-semibold">{errorTitle}</h1>
          </AlertTitle>
          <AlertDescription className="text-xs/5">
            {errorState.kind === 'unknown'
              ? '登录状态或授权信息未能完成同步，请重试或重新登录。'
              : errorState.description}
          </AlertDescription>
        </Alert>
        <div className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs font-medium">错误详情</p>
            <CopyButton
              text={diagnostic}
              variant="ghost"
              size="sm"
              aria-label="复制错误详情"
            >
              复制
            </CopyButton>
          </div>
          <pre
            data-no-window-drag
            className="bg-background max-h-36 overflow-auto rounded-sm border px-2.5 py-2 font-mono text-xs/5 whitespace-pre-wrap break-words select-text"
          >
            {message}
          </pre>
        </div>
        <p className="text-muted-foreground text-xs/5">
          {errorState.kind === 'unknown'
            ? '重试会重新同步账号、权限和工作区数据。'
            : errorState.hint}
        </p>
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          {onRetry ? (
            <Button disabled={busy} onClick={onRetry}>
              <HugeiconsIcon
                icon={ArrowReloadVerticalIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              {busy ? '正在重试...' : '重试'}
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="bg-background"
            disabled={openingLogin}
            onClick={() => void openWebLogin()}
          >
            <HugeiconsIcon
              icon={Login02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            重新登录
          </Button>
        </div>
      </section>
    </main>
  );
}

function AppLoadingStatus({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const statusText = formatLoadingStatusText(title, message);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    gsap.killTweensOf(container);
    if (isReducedMotionPreferred()) {
      gsap.set(container, { autoAlpha: 1, y: 0 });
      return;
    }
    const tween = gsap.fromTo(
      container,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power3.out' },
    );
    return () => {
      tween.kill();
      gsap.killTweensOf(container);
    };
  }, [message, title]);

  return (
    <main
      className="bg-background text-foreground relative isolate flex min-h-dvh items-center justify-center overflow-hidden border-0 px-6 py-8 select-none"
      onMouseDown={(event) => void startWindowDrag(event)}
    >
      <section
        ref={containerRef}
        className="flex w-full max-w-80 flex-col items-center text-center"
        aria-live="polite"
        aria-busy="true"
      >
        <AppLoading className="min-h-0 w-full p-0" label={title} />
        <p className="sr-only">{statusText}</p>
      </section>
    </main>
  );
}

async function startWindowDrag(event: React.MouseEvent<HTMLElement>) {
  if (
    event.button !== 0 ||
    event.defaultPrevented ||
    typeof window === 'undefined' ||
    !window.__TAURI_INTERNALS__
  ) {
    return;
  }
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (
    target?.closest(
      'a,button,input,textarea,select,[role="button"],[data-no-window-drag]',
    )
  ) {
    return;
  }
  event.preventDefault();
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().startDragging();
  } catch (error) {
    console.warn('Window drag failed.', error);
  }
}

function formatLoadingStatusText(title: string, message: string) {
  const normalizedTitle = normalizeStatusSentencePart(title);
  const normalizedMessage = normalizeStatusSentencePart(message);
  return !normalizedMessage || normalizedMessage === normalizedTitle
    ? `${normalizedTitle}。`
    : `${normalizedTitle}，${normalizedMessage}。`;
}

function normalizeStatusSentencePart(value: string) {
  return value.trim().replace(/[。.!！?？]+$/u, '');
}
