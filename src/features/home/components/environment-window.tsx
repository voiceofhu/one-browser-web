import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Add01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type SampleEnvironment = {
  name: string;
  group: string;
  proxy: string;
  ip: string;
  os: string;
  running: boolean;
};

// Illustrative rows; IPs come from the RFC 5737 documentation ranges.
const environments: SampleEnvironment[] = [
  {
    name: 'amz-us-01',
    group: 'Amazon',
    proxy: 'SOCKS5 · US',
    ip: '203.0.113.24',
    os: 'Windows 11',
    running: true,
  },
  {
    name: 'tiktok-uk-02',
    group: 'TikTok',
    proxy: 'HTTP · GB',
    ip: '198.51.100.7',
    os: 'macOS 15',
    running: true,
  },
  {
    name: 'ebay-de-03',
    group: 'eBay',
    proxy: 'SOCKS5 · DE',
    ip: '192.0.2.181',
    os: 'Windows 10',
    running: false,
  },
  {
    name: 'ads-jp-04',
    group: 'Facebook',
    proxy: 'SOCKS5 · JP',
    ip: '203.0.113.90',
    os: 'macOS 14',
    running: true,
  },
  {
    name: 'shopee-sg-05',
    group: 'Shopee',
    proxy: 'HTTP · SG',
    ip: '198.51.100.62',
    os: 'Windows 11',
    running: false,
  },
];

const columns =
  'grid grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[1.2fr_0.8fr_1fr_auto] lg:grid-cols-[1.2fr_0.7fr_0.9fr_1fr_0.8fr_auto]';

/** Static product illustration of the environment list for the home hero. */
export function EnvironmentWindow({ className }: { className?: string }) {
  return (
    <figure
      aria-label="环境列表示意"
      className={cn(
        'bg-card overflow-hidden rounded-xl border shadow-sm',
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="bg-border size-2.5 rounded-full" />
          <span className="bg-border size-2.5 rounded-full" />
          <span className="bg-border size-2.5 rounded-full" />
        </div>
        <span className="text-sm font-medium">环境</span>
        <span className="text-muted-foreground text-xs tabular-nums">128</span>
        <div className="text-muted-foreground bg-muted/60 ml-auto hidden h-7 w-48 items-center gap-2 rounded-md px-2.5 text-xs sm:flex">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
          搜索环境
        </div>
        <Button size="sm" className="pointer-events-none h-7" tabIndex={-1}>
          <HugeiconsIcon
            icon={Add01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          新建环境
        </Button>
      </div>

      <div
        className={cn(
          columns,
          'text-muted-foreground border-b px-4 py-2 text-[0.6875rem] font-medium',
        )}
      >
        <span>名称</span>
        <span className="hidden sm:block">分组</span>
        <span className="hidden lg:block">代理</span>
        <span className="hidden sm:block">出口 IP</span>
        <span className="hidden lg:block">系统</span>
        <span>状态</span>
      </div>
      <ul className="divide-y text-xs">
        {environments.map((env) => (
          <li key={env.name} className={cn(columns, 'px-4 py-2.5')}>
            <span className="truncate font-medium">{env.name}</span>
            <span className="text-muted-foreground hidden truncate sm:block">
              {env.group}
            </span>
            <span className="text-muted-foreground hidden truncate lg:block">
              {env.proxy}
            </span>
            <span className="hidden font-mono tabular-nums sm:block">
              {env.ip}
            </span>
            <span className="text-muted-foreground hidden truncate lg:block">
              {env.os}
            </span>
            {env.running ? (
              <Badge variant="success" className="h-5 px-2">
                运行中
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-muted-foreground h-5 px-2"
              >
                已停止
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </figure>
  );
}
