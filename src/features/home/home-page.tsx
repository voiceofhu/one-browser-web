import { AppImage as Image } from '@/components/app-image';
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AppDownloadCard } from '@/features/app-download/download-card';
import { useI18n } from '@/i18n/provider';
import {
  ArrowDown01Icon,
  ArrowRight02Icon,
  Download01Icon,
  FingerPrintIcon,
  Globe02Icon,
  Layers01Icon,
  Route01Icon,
  ServerStack01Icon,
  ShieldKeyIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from 'react-router-dom';

const APP_LOGO_SRC = '/pwa-512x512.png';

const highlights = [
  '独立指纹环境',
  '平台线路',
  '前置代理',
  '团队协作',
] as const;

const features = [
  {
    icon: FingerPrintIcon,
    title: '多环境指纹隔离',
    description:
      '每个环境独立的 Cookie、缓存与浏览器指纹，多账号同时登录互不关联。',
  },
  {
    icon: Layers01Icon,
    title: '批量管理环境',
    description:
      '分组、备注与批量操作，环境配置保存在账号下，网页与客户端看到的是同一份。',
  },
  {
    icon: ServerStack01Icon,
    title: '平台线路',
    description:
      '内置平台 Egress 线路，自动选择或固定默认线路，无需自备代理也能上手。',
  },
  {
    icon: Route01Icon,
    title: '自有代理',
    description:
      '支持 HTTP、SOCKS5 等代理并检测出口 IP，每个环境可绑定不同代理。',
  },
  {
    icon: ShieldKeyIcon,
    title: '前置代理',
    description:
      '可跟随 Clash、v2rayN 等系统代理或手动指定，让线路与代理先经过本机代理再连接。',
  },
  {
    icon: UserGroupIcon,
    title: '团队与权限',
    description: '邀请成员、按角色分配权限，环境在团队内共享，操作有日志可查。',
  },
] as const;

export function HomePage() {
  return (
    <main className="bg-background text-foreground h-dvh overflow-y-auto scroll-smooth px-5 pt-[env(safe-area-inset-top)] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <HomeHeader />
        <Separator />

        <div className="grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-16">
          <section className="min-w-0">
            <Badge variant="outline" className="mb-5 h-6 gap-1.5 px-2.5">
              <HugeiconsIcon icon={FingerPrintIcon} strokeWidth={2} />
              团队协作指纹浏览器
            </Badge>
            <h1 className="text-[2rem] leading-[1.2] font-semibold tracking-tight sm:text-5xl">
              <span className="block">一台电脑，</span>
              <span className="text-foreground/70 mt-1 block">
                管好成百上千个浏览器环境
              </span>
            </h1>
            <p className="text-muted-foreground mt-5 max-w-md text-sm leading-7">
              有个浏览器为每个账号准备独立的指纹环境，搭配平台线路、自有代理和前置代理，团队成员共享环境、分权协作。
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button
                size="lg"
                className="min-h-11 flex-1 px-5 sm:flex-none"
                asChild
              >
                <Link to="/dashboard">
                  进入控制台
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    strokeWidth={2}
                    data-icon="inline-end"
                  />
                </Link>
              </Button>
              <Button variant="ghost" className="min-h-11 px-4" asChild>
                <a href="#features">
                  了解功能
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    strokeWidth={2}
                    data-icon="inline-end"
                  />
                </a>
              </Button>
            </div>
            <p className="text-muted-foreground mt-2 text-xs leading-5">
              未登录时会先跳转到 One 账号授权登录。
            </p>

            <ul className="mt-7 flex max-w-md flex-wrap gap-2">
              {highlights.map((item) => (
                <li key={item}>
                  <Badge
                    variant="outline"
                    className="h-8 rounded-lg px-2.5 font-normal"
                  >
                    {item}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="download"
            aria-labelledby="download-title"
            className="bg-card min-w-0 scroll-mt-6 rounded-2xl border p-5 shadow-sm sm:p-6"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
                <HugeiconsIcon
                  icon={Download01Icon}
                  strokeWidth={2}
                  className="size-5"
                />
              </span>
              <div className="min-w-0">
                <h2 id="download-title" className="text-base font-semibold">
                  下载桌面客户端
                </h2>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  浏览器环境在桌面客户端中运行，支持 macOS、Windows 与 Linux。
                </p>
              </div>
            </div>
            <AppDownloadCard
              showHeader={false}
              className="[&_a]:bg-primary [&_a]:text-primary-foreground [&_a:hover]:bg-primary/90 rounded-none border-0 bg-transparent p-0 shadow-none ring-0 [&_[data-slot=button]]:rounded-md [&_[data-slot=card-content]]:gap-2.5 [&_[data-slot=card-content]]:px-0"
            />
          </section>
        </div>

        <Separator />
        <section
          id="features"
          aria-labelledby="features-title"
          className="scroll-mt-6 py-8 sm:py-10"
        >
          <div className="mb-5 max-w-xl">
            <h2
              id="features-title"
              className="text-xl font-semibold tracking-tight"
            >
              多账号运营需要的，都在这里
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              网页端管理环境、代理和团队，桌面客户端负责启动与运行浏览器。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon, title, description }) => (
              <Card key={title}>
                <CardHeader className="gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <HugeiconsIcon
                      icon={icon}
                      strokeWidth={2}
                      className="text-muted-foreground size-4 shrink-0"
                    />
                    <CardTitle className="text-sm">
                      <h3>{title}</h3>
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs leading-6">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
        <Separator />
        <footer className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 pt-5 text-xs">
          <span>One Browser</span>
          <span>Web · macOS · Windows · Linux</span>
        </footer>
      </div>
    </main>
  );
}

function HomeHeader() {
  const { locale, setLocale } = useI18n();
  const nextLocale = locale === 'zh-CN' ? 'en-US' : 'zh-CN';

  return (
    <header className="flex min-h-16 items-center justify-between gap-3">
      <Link to="/" className="flex shrink-0 items-center gap-2.5">
        <Image
          src={APP_LOGO_SRC}
          alt="有个浏览器"
          width={36}
          height={36}
          priority
          className="size-9 rounded-lg"
          draggable={false}
        />
        <span className="text-sm font-semibold tracking-tight">
          One Browser
        </span>
      </Link>
      <nav aria-label="首页导航" className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-8 text-xs md:inline-flex"
          asChild
        >
          <a href="#features">功能</a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-8 text-xs sm:inline-flex"
          asChild
        >
          <a href="#download">下载</a>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label={
            nextLocale === 'en-US' ? 'Switch to English' : '切换到中文'
          }
          onClick={() => setLocale(nextLocale)}
        >
          <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} />
        </Button>
        <ThemeToggleButton className="text-muted-foreground hover:bg-muted/70 dark:hover:bg-muted/70 rounded-md border-transparent bg-transparent dark:bg-transparent" />
        <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
          <Link to="/login?redirect=%2Fdashboard">登录</Link>
        </Button>
      </nav>
    </header>
  );
}
