import { AppImage as Image } from '@/components/app-image';
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppDownloadCard } from '@/features/app-download/download-card';
import { useI18n } from '@/i18n/provider';
import {
  ArrowRight02Icon,
  Download01Icon,
  FingerPrintIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Languages } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EnvironmentWindow } from './components/environment-window';
import { FeatureBento } from './components/feature-bento';

const APP_LOGO_SRC = '/pwa-512x512.png';

export function HomePage() {
  return (
    <main className="bg-background text-foreground h-dvh overflow-y-auto scroll-smooth pb-[max(2rem,env(safe-area-inset-bottom))]">
      <HomeHeader />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="flex flex-col items-center pt-14 pb-12 text-center sm:pt-20 sm:pb-16">
          <Badge variant="outline" className="h-6 gap-1.5 rounded-full px-3">
            <HugeiconsIcon icon={FingerPrintIcon} strokeWidth={2} />
            团队协作指纹浏览器
          </Badge>
          <h1 className="mt-6 max-w-3xl text-[1.75rem] leading-[1.2] font-semibold tracking-tight text-balance sm:text-6xl">
            一台电脑，
            <span className="text-muted-foreground block">
              管好成百上千个浏览器环境
            </span>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-7 text-balance">
            每个账号一套独立指纹和代理，团队共享环境、分权协作，还能用代码批量驱动。
          </p>
          <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button size="lg" className="h-11 px-6" asChild>
              <Link to="/dashboard">
                进入控制台
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-6" asChild>
              <a href="#download">
                <HugeiconsIcon
                  icon={Download01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                下载客户端
              </a>
            </Button>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            macOS · Windows · Linux
          </p>

          <EnvironmentWindow className="mt-14 w-full text-left sm:mt-16" />
        </section>

        <section
          id="features"
          aria-labelledby="features-title"
          className="scroll-mt-20 py-12 sm:py-16"
        >
          <div className="mb-8 max-w-xl">
            <h2
              id="features-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              多账号运营需要的，都在这里
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
              网页端管理环境、代理和团队，桌面客户端负责启动与运行浏览器。
            </p>
          </div>
          <FeatureBento />
        </section>

        <section
          id="download"
          aria-labelledby="download-title"
          className="grid scroll-mt-20 items-center gap-8 border-t py-12 sm:py-16 lg:grid-cols-2 lg:gap-16"
        >
          <div>
            <h2
              id="download-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              下载桌面客户端
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md text-sm leading-6">
              浏览器环境在桌面客户端中运行，支持 macOS、Windows 与
              Linux。登录同一个 One 账号，环境自动同步。
            </p>
            <Button variant="link" className="mt-3 h-auto px-0" asChild>
              <Link to="/developers">
                查看开发文档
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                />
              </Link>
            </Button>
          </div>
          <div className="bg-card rounded-xl border p-5 sm:p-6">
            <AppDownloadCard
              showHeader={false}
              className="[&_a]:bg-primary [&_a]:text-primary-foreground [&_a:hover]:bg-primary/90 rounded-none border-0 bg-transparent p-0 shadow-none ring-0 [&_[data-slot=button]]:rounded-md [&_[data-slot=card-content]]:gap-2.5 [&_[data-slot=card-content]]:px-0"
            />
          </div>
        </section>

        <footer className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t pt-6 text-xs">
          <span>© One Browser</span>
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
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-20 border-b pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src={APP_LOGO_SRC}
            alt="有个浏览器"
            width={28}
            height={28}
            priority
            className="size-7 rounded-md"
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
            size="sm"
            className="hidden h-8 text-xs sm:inline-flex"
            asChild
          >
            <Link to="/developers">开发文档</Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            aria-label={
              nextLocale === 'en-US' ? 'Switch to English' : '切换到中文'
            }
            onClick={() => setLocale(nextLocale)}
          >
            <Languages aria-hidden="true" className="size-4" />
          </Button>
          <ThemeToggleButton
            size="icon"
            className="text-muted-foreground hover:text-foreground border-border dark:bg-input/30 bg-transparent [&_svg]:size-4!"
          />
          <Button
            size="sm"
            variant="outline"
            className="ml-1 h-7 px-3 text-xs"
            asChild
          >
            <Link to="/login?redirect=%2Fdashboard">登录</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
