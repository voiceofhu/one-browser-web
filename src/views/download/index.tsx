import { AppImage } from '@/components/app-image';
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppDownloadCard } from '@/features/app-download/download-card';
import { locales, type Locale } from '@/i18n';
import { useI18n } from '@/i18n/provider';
import { Languages } from 'lucide-react';

export default function DownloadPage() {
  const { locale, setLocale } = useI18n();

  return (
    <main className="bg-muted text-foreground h-dvh overflow-y-auto">
      <header className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <AppImage
            src="/pwa-512x512.png"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-md"
          />
          <span className="truncate text-sm font-semibold">One Browser</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="border-border/60 bg-muted text-foreground hover:bg-muted dark:bg-muted dark:hover:bg-muted shadow-none"
                aria-label={locale === 'zh-CN' ? '切换语言' : 'Change language'}
              >
                <Languages aria-hidden="true" className="size-3" />
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
          <ThemeToggleButton />
        </div>
      </header>
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="sr-only">下载 One Browser</h1>
        <p className="text-muted-foreground text-sm">
          选择系统和架构，查询最新版桌面客户端安装包。
        </p>
        <AppDownloadCard
          showHeader={false}
          className="rounded-none border-0 bg-transparent py-0 shadow-none ring-0 [&>[data-slot=card-content]]:px-0"
        />
      </section>
    </main>
  );
}
