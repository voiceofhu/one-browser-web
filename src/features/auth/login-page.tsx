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
import { CopyButton } from '@/components/ui/copy-button';
import { Spinner } from '@/components/ui/spinner';
import {
  consumeAuthExpiredNotice,
  readAuthSessionStatus,
} from '@/features/auth/session';
import { isUnauthorizedAuthError } from '@/features/auth/auth-errors';
import { AppDownloadCard } from '@/features/app-download/download-card';
import { requestDownloadPrompt } from '@/features/app-download/session';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { Door01Icon, Globe02Icon } from '@hugeicons/core-free-icons';
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
import { InteractiveGridBackground } from './interactive-grid-background';
import { markLoginRedirect, recentlyRedirected } from './login-redirect-guard';
import { useLoginAppWindowSize } from './use-app-window-size';
import { useAuthDeepLinks } from './use-auth-deep-links';

const APP_LOGO_SRC = '/pwa-512x512.png';

type LoginPageCopy = {
  appLogoAlt: string;
  title: string;
  openAuthLogin: string;
  webAuthLogin: string;
  webDescription: string;
  desktopDownload: string;
  desktopDescription: string;
  openingAuthLogin: string;
  copyLoginLink: string;
  copyingLoginLink: string;
  copied: string;
  copySuccess: string;
  copyError: string;
  exitApp: string;
  authExpired: string;
  openLoginError: string;
  exitAppError: string;
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
    copyLoginLink: '复制登录链接',
    copyingLoginLink: '正在复制...',
    copied: '已复制',
    copySuccess: '登录链接已复制',
    copyError: '无法复制登录链接',
    exitApp: '退出应用',
    authExpired: '登录信息已过期，请重新登录',
    openLoginError: '无法打开网页登录',
    exitAppError: '无法退出应用',
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
    copyLoginLink: 'Copy sign-in link',
    copyingLoginLink: 'Copying...',
    copied: 'Copied',
    copySuccess: 'Sign-in link copied',
    copyError: 'Unable to copy sign-in link',
    exitApp: 'Quit app',
    authExpired: 'Your session has expired. Sign in again.',
    openLoginError: 'Unable to open the sign-in page',
    exitAppError: 'Unable to quit the app',
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
        const authorization = await authorizeDesktopHandoff();
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
      if (notice !== null) {
        setAuthNotice(notice || copy.authExpired);
      }
    }, 0);

    return () => window.clearTimeout(noticeTimer);
  }, [copy.authExpired]);

  const autoLogin = !isDesktop && autoLoginAllowed && !authNotice;
  React.useEffect(() => {
    if (!sessionChecked || !autoLogin) return;
    markLoginRedirect();
    prepareWebLoginUrl(currentBrowserReturnTo(), selectAccount)
      .then((loginUrl) => window.location.replace(loginUrl))
      .catch((error: unknown) => {
        setAutoLoginAllowed(false);
        toast.error(
          error instanceof Error ? error.message : copy.openLoginError,
        );
      });
  }, [autoLogin, copy.openLoginError, selectAccount, sessionChecked]);

  if (!sessionChecked || autoLogin) {
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

  async function exitApp() {
    if (typeof window === 'undefined' || !window.__TAURI_INTERNALS__) {
      window.close();
      return;
    }

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.exitAppError);
    }
  }

  if (!isDesktop) {
    return (
      <main className="bg-muted/40 text-foreground relative flex min-h-svh w-full items-center justify-center px-4 py-8">
        <LoginPageControls />
        <div className="flex w-full max-w-sm flex-col gap-3 text-left">
          <section className="bg-card text-card-foreground flex flex-col rounded-xl p-5">
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
                className="bg-muted/60 mt-3 rounded-md border-0 px-2.5 py-2"
                aria-live="polite"
              >
                <AlertDescription>
                  {authNotice || loginConfigMessage}
                </AlertDescription>
              </Alert>
            ) : null}
            <Button
              className="mt-4 h-8 w-full rounded-md px-3"
              disabled={opening}
              onClick={() => void openWebLogin()}
              size="lg"
            >
              {opening ? <Spinner data-icon="inline-start" /> : null}
              {opening ? copy.openingAuthLogin : copy.webAuthLogin}
            </Button>
          </section>
          <section className="bg-card text-card-foreground rounded-xl p-5">
            <h2 className="text-sm font-medium">{copy.desktopDownload}</h2>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {copy.desktopDescription}
            </p>
            <AppDownloadCard
              showHeader={false}
              className="[&_a]:bg-primary [&_a]:text-primary-foreground [&_a:hover]:bg-primary/90 mt-3 rounded-none border-0 bg-transparent p-0 shadow-none ring-0 [&_[data-slot=button]]:rounded-md [&_[data-slot=card-content]]:gap-2.5 [&_[data-slot=card-content]]:px-0"
            />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className="bg-background text-foreground relative isolate grid min-h-dvh place-items-center overflow-hidden rounded-[var(--app-radius)] px-4 py-8"
      onMouseDown={(event) => void startWindowDrag(event)}
    >
      <InteractiveGridBackground className="opacity-40" />
      <LoginPageControls />
      <section className="relative z-10 flex w-full max-w-72 flex-col">
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
          <h1 className="text-foreground text-base/6 font-semibold tracking-tight">
            {copy.title}
          </h1>
        </div>

        {authNotice || !canOpenLogin ? (
          <Alert
            className="bg-muted/60 mt-3 rounded-md border-0 px-2.5 py-2"
            aria-live="polite"
          >
            <AlertDescription>
              {authNotice || loginConfigMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-4 flex w-full flex-col gap-1.5">
          <Button
            className="h-8 w-full rounded-md px-3"
            disabled={opening || !canOpenLogin}
            onClick={() => void openWebLogin()}
            size="lg"
            title={!canOpenLogin ? loginConfigMessage : undefined}
          >
            {opening ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <HugeiconsIcon
                icon={Globe02Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
            )}
            {opening
              ? copy.openingAuthLogin
              : isDesktop
                ? copy.openAuthLogin
                : copy.webAuthLogin}
          </Button>

          {isDesktop ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <CopyButton
                variant="ghost"
                className="text-muted-foreground min-w-0 rounded-md px-1.5"
                disabled={!canOpenLogin}
                getText={() => prepareWebLoginUrl(currentBrowserReturnTo())}
                idleLabel={copy.copyLoginLink}
                copyingLabel={copy.copyingLoginLink}
                copiedLabel={copy.copied}
                successMessage={copy.copySuccess}
                errorMessage={copy.copyError}
                size="default"
              >
                {(stage) =>
                  stage === 'copying'
                    ? copy.copyingLoginLink
                    : copy.copyLoginLink
                }
              </CopyButton>

              <Button
                variant="ghost"
                className="text-muted-foreground min-w-0 rounded-md px-1.5"
                onClick={() => void exitApp()}
                size="default"
              >
                <HugeiconsIcon
                  icon={Door01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                {copy.exitApp}
              </Button>
            </div>
          ) : null}
        </div>
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
      <ThemeToggleButton className="text-muted-foreground rounded-md border-transparent bg-transparent hover:bg-muted/70 dark:bg-transparent dark:hover:bg-muted/70" />
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
    return '/';
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
