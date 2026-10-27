import { useI18n } from '@/i18n/provider';
import { locales, type Locale } from '@/i18n';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { SweepShine } from '@/components/ui/sweep-shine';
import {
  consumeAuthExpiredNotice,
  readAuthSessionStatus,
} from '@/features/auth/session';
import { isUnauthorizedAuthError } from '@/features/auth/auth-errors';
import { AppDownloadCard } from '@/features/app-download/download-card';
import { requestDownloadPrompt } from '@/features/app-download/session';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { http } from '@/lib/http';
import { Globe02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { toast } from 'sonner';

import { AppImage as Image } from '@/components/app-image';
import { useRouter, useSearchParams } from '@/router/compat';
import {
  WEB_LOGIN_URL_ENV,
  authorizeDesktopHandoff,
  getCurrentUser,
  getWebLoginConfig,
  prepareWebLoginUrl,
} from './api';
import { markLoginRedirect, recentlyRedirected } from './login-redirect-guard';
import { useLoginAppWindowSize } from './use-app-window-size';
import { useAuthDeepLinks } from './use-auth-deep-links';

const APP_LOGO_SRC = '/pwa-512x512.png';
const AUTO_LOGIN_SECONDS = 10;

type LoginPageCopy = {
  appLogoAlt: string;
  title: string;
  openAuthLogin: string;
  webAuthLogin: string;
  webDescription: string;
  desktopDownload: string;
  desktopDescription: string;
  openingAuthLogin: string;
  autoOpenWebLogin: (seconds: number) => string;
  authExpired: string;
  openLoginError: string;
  missingLoginUrl: (envName: string) => string;
  unsupportedLoginUrlProtocol: (envName: string) => string;
  invalidLoginUrl: (envName: string) => string;
};

const LOGIN_PAGE_COPY: Record<'zh-CN' | 'en-US', LoginPageCopy> = {
  'zh-CN': {
    appLogoAlt: '有个浏览器',
    title: '登录有个浏览器',
    openAuthLogin: '打开网址授权登录',
    webAuthLogin: '授权登录',
    webDescription: '授权登录后，管理浏览器环境与团队。',
    desktopDownload: '桌面客户端',
    desktopDescription: '下载 One Browser，使用完整的浏览器功能。',
    openingAuthLogin: '正在打开...',
    autoOpenWebLogin: (seconds) => `${seconds} 秒后自动打开网页版登录`,
    authExpired: '登录信息已过期，请重新登录',
    openLoginError: '无法打开网页登录',
    missingLoginUrl: (envName) => `请配置 ${envName}`,
    unsupportedLoginUrlProtocol: (envName) => `${envName} 只支持 http 或 https`,
    invalidLoginUrl: (envName) => `${envName} 不是有效链接`,
  },
  'en-US': {
    appLogoAlt: 'One Browser',
    title: 'Sign in to One Browser',
    openAuthLogin: 'Authorize sign-in',
    webAuthLogin: 'Authorize sign-in',
    webDescription: 'Sign in to manage browser environments and your team.',
    desktopDownload: 'Desktop app',
    desktopDescription: 'Download One Browser for the full desktop experience.',
    openingAuthLogin: 'Opening...',
    autoOpenWebLogin: (seconds) => `Opening web sign-in in ${seconds}s`,
    authExpired: 'Your session has expired. Sign in again.',
    openLoginError: 'Unable to open the sign-in page',
    missingLoginUrl: (envName) => `Please configure ${envName}`,
    unsupportedLoginUrlProtocol: (envName) =>
      `${envName} only supports http or https`,
    invalidLoginUrl: (envName) => `${envName} is not a valid URL`,
  },
};

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

type LoginPageProps = {
  authManaged?: boolean;
};

export function LoginPage({ authManaged = false }: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const copy = useLoginPageCopy();
  const [opening, setOpening] = React.useState(false);
  const [authNotice, setAuthNotice] = React.useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = React.useState(authManaged);
  const [autoLoginAllowed, setAutoLoginAllowed] = React.useState(
    () => !recentlyRedirected(),
  );
  const isDesktop = isTauriRuntime();
  const loginConfig = React.useMemo(() => getWebLoginConfig(), []);
  const canOpenLogin = !isDesktop || loginConfig.status === 'ready';
  const loginConfigMessage = localizedLoginConfigMessage(loginConfig, copy);
  const redirectTo = searchParams.get('redirect');
  const selectAccount = searchParams.get('prompt') === 'select_account';
  const safeRedirectTo = React.useMemo(
    () => normalizeAppRedirect(redirectTo),
    [redirectTo],
  );
  const handoff = React.useMemo(
    () => parseDesktopHandoff(searchParams),
    [searchParams],
  );
  const handoffStartedRef = React.useRef(false);

  useLoginAppWindowSize(sessionChecked);

  const applyAuthSession = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['auth'] });
    if (!isDesktop) {
      requestDownloadPrompt();
    }
    router.replace(safeRedirectTo);
  }, [isDesktop, queryClient, router, safeRedirectTo]);

  useAuthDeepLinks(applyAuthSession, !authManaged && isDesktop);

  React.useEffect(() => {
    if (authManaged) {
      return;
    }

    if (isDesktop) {
      let cancelled = false;
      void readAuthSessionStatus().then((status) => {
        if (cancelled) {
          return;
        }
        if (status.authenticated) {
          applyAuthSession();
          return;
        }
        setSessionChecked(true);
      });

      return () => {
        cancelled = true;
      };
    }

    if (handoffStartedRef.current) {
      return;
    }
    handoffStartedRef.current = true;
    void getCurrentUser()
      .then(async () => {
        if (!handoff) {
          applyAuthSession();
          return;
        }
        const authorization = await authorizeDesktopHandoff(handoff.state);
        window.location.assign(authorization.callback_url);
      })
      .catch((error: unknown) => {
        if (!isUnauthorizedAuthError(error)) {
          setAuthNotice(
            error instanceof Error ? error.message : copy.openLoginError,
          );
        }
        setSessionChecked(true);
      });

    return undefined;
  }, [applyAuthSession, authManaged, copy.openLoginError, handoff, isDesktop]);

  React.useEffect(() => {
    const noticeTimer = window.setTimeout(() => {
      const notice = consumeAuthExpiredNotice();
      if (
        notice !== null &&
        !['请先登录', 'login required'].includes(notice.trim().toLowerCase())
      ) {
        setAuthNotice(notice || copy.authExpired);
      }
    }, 0);

    return () => window.clearTimeout(noticeTimer);
  }, [copy.authExpired]);

  // The web login page stays up for a short countdown so visitors can grab the
  // desktop app first; any interaction with the download card cancels it.
  const autoLogin = !isDesktop && autoLoginAllowed && !authNotice;
  const [countdown, setCountdown] = React.useState(AUTO_LOGIN_SECONDS);
  const autoRedirecting = sessionChecked && autoLogin && countdown === 0;
  React.useEffect(() => {
    if (!sessionChecked || !autoLogin || countdown === 0) return;
    const timer = window.setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [autoLogin, countdown, sessionChecked]);
  React.useEffect(() => {
    if (!autoRedirecting) return;
    markLoginRedirect();
    prepareWebLoginUrl(currentBrowserReturnTo(), selectAccount)
      .then((loginUrl) => window.location.replace(loginUrl))
      .catch((error: unknown) => {
        setAutoLoginAllowed(false);
        toast.error(
          error instanceof Error ? error.message : copy.openLoginError,
        );
      });
  }, [autoRedirecting, copy.openLoginError, selectAccount]);

  if (!sessionChecked) {
    return null;
  }

  async function openWebLogin() {
    if (!canOpenLogin) {
      toast.error(localizedLoginConfigMessage(loginConfig, copy));
      return;
    }

    setOpening(true);
    try {
      const loginUrl = await prepareWebLoginUrl(
        currentBrowserReturnTo(),
        selectAccount,
      );
      if (isDesktop) {
        await desktopInvoke('open_external_url', {
          request: { url: loginUrl },
        });
      } else {
        window.location.assign(loginUrl);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.openLoginError);
    } finally {
      setOpening(false);
    }
  }

  if (!isDesktop) {
    return (
      <main className="bg-muted/40 text-foreground relative flex min-h-svh w-full items-center justify-center px-4 py-8">
        <LoginPageControls />
        <div className="flex w-full max-w-sm flex-col gap-3 text-left">
          <Card className="gap-0 p-5">
            <div className="flex items-center gap-2.5">
              <Image
                src={APP_LOGO_SRC}
                alt={copy.appLogoAlt}
                width={40}
                height={40}
                priority
                className="size-10 shrink-0 rounded-lg select-none"
                draggable={false}
              />
              <div>
                <h1 className="text-base font-semibold tracking-tight">
                  One Browser
                </h1>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {copy.title}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mt-4 text-xs leading-5">
              {copy.webDescription}
            </p>
            {authNotice || !canOpenLogin ? (
              <Alert
                variant="destructive"
                className="border-destructive/20 bg-destructive/5 mt-3 rounded-md px-2.5 py-2"
                aria-live="polite"
              >
                <AlertDescription>
                  {authNotice || loginConfigMessage}
                </AlertDescription>
              </Alert>
            ) : null}
            <Button
              className="mt-4 h-8 w-full rounded-md px-3"
              disabled={opening || autoRedirecting}
              onClick={() => void openWebLogin()}
              size="lg"
            >
              {opening || autoRedirecting ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {opening || autoRedirecting
                ? copy.openingAuthLogin
                : copy.webAuthLogin}
            </Button>
            {autoLogin && countdown > 0 ? (
              <p
                className="text-muted-foreground mt-2 text-center text-xs tabular-nums"
                aria-live="polite"
              >
                {copy.autoOpenWebLogin(countdown)}
              </p>
            ) : null}
          </Card>
          <Card
            className="gap-0 p-5"
            onPointerDownCapture={() => setAutoLoginAllowed(false)}
          >
            <h2 className="text-sm font-medium">{copy.desktopDownload}</h2>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {copy.desktopDescription}
            </p>
            <AppDownloadCard
              showHeader={false}
              className="[&_a]:bg-primary [&_a]:text-primary-foreground [&_a:hover]:bg-primary/90 mt-3 rounded-none border-0 bg-transparent p-0 shadow-none ring-0 [&_[data-slot=button]]:rounded-md [&_[data-slot=card-content]]:gap-2.5 [&_[data-slot=card-content]]:px-0"
            />
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main
      className="bg-background text-foreground relative grid min-h-dvh place-items-center overflow-hidden rounded-[var(--app-radius)] px-5 py-6 select-none"
      onMouseDown={(event) => void startWindowDrag(event)}
    >
      <LoginPageControls />
      <section className="flex w-full max-w-sm flex-col items-center px-6 py-8 text-center">
        <Image
          src={APP_LOGO_SRC}
          alt={copy.appLogoAlt}
          width={88}
          height={88}
          priority
          className="size-[5.5rem] shrink-0"
          draggable={false}
        />
        <h1 className="mt-3 text-lg/6 font-semibold">{copy.title}</h1>
        <p className="text-muted-foreground mt-1.5 text-sm/6">
          {copy.webDescription}
        </p>

        {authNotice || !canOpenLogin ? (
          <Alert
            variant="destructive"
            className="border-destructive/20 bg-destructive/5 mt-4 w-full cursor-text text-left select-text"
            aria-live="polite"
          >
            <AlertDescription>
              {authNotice || loginConfigMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="mt-5 h-9 w-full gap-1.5 rounded-lg px-3 text-sm"
          disabled={opening || !canOpenLogin}
          aria-busy={opening}
          onClick={() => void openWebLogin()}
          size="lg"
          title={!canOpenLogin ? loginConfigMessage : undefined}
        >
          {!opening && (
            <HugeiconsIcon
              icon={Globe02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
          )}
          <SweepShine active={opening}>
            {opening ? copy.openingAuthLogin : copy.openAuthLogin}
          </SweepShine>
        </Button>
        {import.meta.env.DEV ? <DevLoginButton /> : null}
      </section>
    </main>
  );
}

function LoginPageControls() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground rounded-md"
            aria-label={locale === 'zh-CN' ? '切换语言' : 'Change language'}
          >
            <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(value) => setLocale(value as Locale)}
          >
            {locales.map((option) => (
              <DropdownMenuRadioItem key={option.code} value={option.code}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ThemeToggleButton className="text-muted-foreground hover:bg-muted/70 dark:hover:bg-muted/70 rounded-md border-transparent bg-transparent dark:bg-transparent" />
    </div>
  );
}

function useLoginPageCopy() {
  const { locale } = useI18n();
  return LOGIN_PAGE_COPY[locale];
}

function localizedLoginConfigMessage(
  loginConfig: ReturnType<typeof getWebLoginConfig>,
  copy: LoginPageCopy,
) {
  if (loginConfig.status === 'ready') {
    return '';
  }

  if (loginConfig.reason === 'missing-env') {
    return copy.missingLoginUrl(WEB_LOGIN_URL_ENV);
  }
  if (loginConfig.reason === 'unsupported-protocol') {
    return copy.unsupportedLoginUrlProtocol(WEB_LOGIN_URL_ENV);
  }
  return copy.invalidLoginUrl(WEB_LOGIN_URL_ENV);
}

function normalizeAppRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard';
  }

  return value;
}

function currentBrowserReturnTo() {
  if (typeof window === 'undefined') {
    return '/';
  }
  return `${window.location.pathname}${window.location.search}`;
}

function parseDesktopHandoff(searchParams: URLSearchParams) {
  const state = searchParams.get('handoff_state')?.trim() || '';
  const codeChallenge = searchParams.get('code_challenge')?.trim() || '';
  if (!isBase64Url256(state) || !isBase64Url256(codeChallenge)) {
    return null;
  }
  return { state, codeChallenge };
}

function isBase64Url256(value: string) {
  return (
    value.length === 43 &&
    [...value].every((character) => /[A-Za-z0-9_-]/.test(character))
  );
}

/**
 * Development builds only: signs in as the backend's `DEV_LOGIN_USER`
 * without going through One User.
 */
function DevLoginButton() {
  const [pending, setPending] = React.useState(false);

  async function login() {
    setPending(true);
    try {
      const response = await http.post<{
        callback_url: string;
        user_name: string;
      }>('/auth/dev/login');
      await desktopInvoke('complete_dev_login', {
        url: response.data.callback_url,
      });
      toast.success(`已用开发账号 ${response.data.user_name} 登录`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '开发登录失败');
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      className="mt-2 h-8 w-full rounded-lg px-3 text-xs"
      variant="ghost"
      disabled={pending}
      onClick={() => void login()}
    >
      {pending ? '登录中…' : '开发登录（跳过 One User）'}
    </Button>
  );
}
