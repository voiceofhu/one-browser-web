import { AppImage } from '@/components/app-image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { SweepShine } from '@/components/ui/sweep-shine';
import {
  authorizeDesktopHandoff,
  buildWebLoginUrl,
  completeOidcLogin,
  getCurrentUser,
} from '@/features/auth/api';
import { requestDownloadPrompt } from '@/features/app-download/session';
import { resolveErrorState } from '@/views/error/error-state';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

type CallbackState =
  | { status: 'loading'; message: string }
  | { status: 'error'; message: string; error?: unknown };

export function CallbackPage() {
  const started = useRef(false);
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: 'loading',
    message: '正在完成 One User 登录…',
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const parameters = new URLSearchParams(window.location.search);
    const state = parameters.get('state')?.trim() || '';
    const code = parameters.get('code')?.trim() || '';
    const error = parameters.get('error')?.trim() || '';
    const errorDescription = parameters.get('error_description')?.trim() || '';
    window.history.replaceState(null, '', '/callback');

    if (!state || (!code && !error)) {
      // The callback URL is an external input that is validated after mount.
      // oxlint-disable-next-line react/set-state-in-effect
      setCallbackState({
        status: 'error',
        message: '登录回调参数不完整，请重新登录。',
      });
      return;
    }

    void completeOidcLogin({
      state,
      ...(code ? { code } : {}),
      ...(error ? { error } : {}),
      ...(errorDescription ? { errorDescription } : {}),
    })
      .then(async (result) => {
        await getCurrentUser();
        if (isDesktopCallback(result.returnTo)) {
          const authorization = await authorizeDesktopHandoff(
            desktopHandoffState(result.returnTo),
          );
          if (import.meta.env.DEV) {
            console.info('[auth-deep-link]', authorization.callback_url);
          }
          setCallbackState({
            status: 'loading',
            message: 'App 授权已完成，正在进入 Web…',
          });
          window.setTimeout(() => {
            window.location.replace('/dashboard');
          }, 800);
          window.location.assign(authorization.callback_url);
          return;
        }

        requestDownloadPrompt();
        window.location.replace(normalizeReturnTo(result.returnTo));
      })
      .catch((callbackError: unknown) => {
        setCallbackState({
          status: 'error',
          error: callbackError,
          message:
            callbackError instanceof Error
              ? callbackError.message
              : '登录失败，请重新尝试。',
        });
      });
  }, []);

  if (callbackState.status === 'error') {
    const errorState = resolveErrorState(
      callbackState.error ?? new Error(callbackState.message),
    );
    const originalCode =
      typeof callbackState.error === 'object' && callbackState.error !== null && 'code' in callbackState.error
        ? callbackState.error.code
        : undefined;
    const diagnostic = [
      errorState.code,
      typeof originalCode === 'string' || typeof originalCode === 'number'
        ? `Code: ${originalCode}`
        : '',
      callbackState.message,
    ].filter(Boolean).join('\n');

    return (
      <main className="bg-muted text-foreground flex h-dvh min-w-0 overflow-y-auto px-4 py-6">
        <section className="bg-card m-auto w-full max-w-sm overflow-hidden rounded-sm border">
          <header className="bg-muted/40 flex items-center justify-between gap-2 border-b px-3 py-2">
            <span className="text-xs font-medium">One Browser</span>
            <Badge variant="outline" className="font-mono">
              {errorState.code}
            </Badge>
          </header>
          <div className="space-y-3 p-3">
            <Alert className="border-0 bg-transparent p-0">
              <AlertTitle>
                <h1 className="text-sm font-semibold">
                  {errorState.kind === 'unknown' ? '授权未完成' : errorState.title}
                </h1>
              </AlertTitle>
              <AlertDescription>
                {errorState.kind === 'unknown'
                  ? '本次登录授权未能完成，请重新登录。'
                  : errorState.description}
              </AlertDescription>
            </Alert>
            <pre className="bg-muted/40 max-h-40 overflow-auto rounded-sm border px-2.5 py-2 font-mono text-xs/5 whitespace-pre-wrap break-words">
              {callbackState.message}
            </pre>
            <CopyButton text={diagnostic} variant="ghost" size="sm">
              复制错误详情
            </CopyButton>
          </div>
          <footer className="bg-muted/40 flex flex-wrap gap-2 border-t px-3 py-2">
            <Button onClick={() => window.location.assign(buildWebLoginUrl('/dashboard'))}>
              重新登录
            </Button>
            <Button asChild variant="outline">
              <Link to="/">返回首页</Link>
            </Button>
          </footer>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground grid h-dvh place-items-center overflow-y-auto border-0 px-4 py-6">
      <section className="flex w-full max-w-sm flex-col items-center text-center">
        <AppImage
          src="/pwa-512x512.png"
          alt="有个浏览器"
          width={48}
          height={48}
          className="size-12 object-contain"
          priority
        />
        <SweepShine asChild>
          <h1 className="mt-4 text-sm font-semibold">
            正在完成授权
          </h1>
        </SweepShine>
        <p className="text-muted-foreground mt-2 text-xs/5" role="status">
          {callbackState.message}
        </p>
      </section>
    </main>
  );
}

function isDesktopCallback(returnTo: string) {
  try {
    const url = new URL(returnTo, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname !== '/callback') {
      return false;
    }
    return (
      url.searchParams.get('desktop') === '1' ||
      desktopHandoffState(returnTo) !== undefined
    );
  } catch {
    return false;
  }
}

/** Mirrors the backend's `is_desktop_return_to`: app-started logins carry both values. */
function desktopHandoffState(returnTo: string) {
  try {
    const url = new URL(returnTo, window.location.origin);
    const state = url.searchParams.get('handoff_state') || '';
    const challenge = url.searchParams.get('code_challenge') || '';
    return isBase64Url256(state) && isBase64Url256(challenge)
      ? state
      : undefined;
  } catch {
    return undefined;
  }
}

function isBase64Url256(value: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}

function normalizeReturnTo(value: string) {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}
