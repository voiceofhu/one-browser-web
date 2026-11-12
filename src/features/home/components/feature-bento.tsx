import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  ChromeIcon,
  FingerPrintIcon,
  Layers01Icon,
  Route01Icon,
  SourceCodeIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type * as React from 'react';

export function FeatureBento() {
  return (
    <div className="grid gap-3 md:grid-cols-6">
      <Cell
        className="md:col-span-4"
        icon={FingerPrintIcon}
        title="每个环境一套独立指纹"
        description="Cookie、缓存、时区、语言、WebGL 与 Canvas 各自独立，多账号同时在线也互不关联。"
      >
        <FingerprintDiff />
      </Cell>
      <Cell
        className="md:col-span-2"
        icon={ChromeIcon}
        title="Chromium 内核"
        description="跟随 Chrome 稳定版更新，网站看到的是一台普通、最新的 Chrome。"
      >
        <div className="flex flex-1 items-end">
          <p className="text-5xl font-semibold tracking-tight">Stable</p>
        </div>
      </Cell>
      <Cell
        className="md:col-span-3"
        icon={Route01Icon}
        title="自有代理 + 前置代理"
        description="环境代理可先经过 Clash、v2rayN 等本机代理再连接，启动前自动检测出口 IP。"
      >
        <ProxyChain />
      </Cell>
      <Cell
        className="md:col-span-3"
        icon={UserGroupIcon}
        title="团队共享，按角色授权"
        description="邀请成员、分配角色，环境在团队内共享，每次操作都有日志可查。"
      >
        <TeamList />
      </Cell>
      <Cell
        className="md:col-span-2"
        icon={Layers01Icon}
        title="批量管理"
        description="分组、备注、批量启动，网页和客户端看到的是同一份配置。"
      >
        <BatchSelect />
      </Cell>
      <Cell
        className="md:col-span-4"
        icon={SourceCodeIcon}
        title="本地 API 与 SDK"
        description="用 Puppeteer、Playwright 或 Selenium 直接驱动任意环境，Node.js 与 Python 都有 SDK。"
      >
        <CodeSample />
      </Cell>
    </div>
  );
}

function Cell({
  icon,
  title,
  description,
  className,
  children,
}: {
  icon: IconSvgElement;
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        'bg-card flex min-h-64 min-w-0 flex-col gap-5 rounded-xl border p-5 sm:p-6',
        className,
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={icon}
            strokeWidth={2}
            className="text-primary size-4 shrink-0"
          />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6 text-pretty">
          {description}
        </p>
      </div>
      {children}
    </article>
  );
}

const fingerprintRows = [
  ['系统', 'Windows 11', 'macOS 15'],
  ['时区', 'America/New_York', 'Europe/London'],
  ['语言', 'en-US', 'en-GB'],
  ['屏幕', '1920 × 1080', '1512 × 982'],
  ['WebGL', 'NVIDIA RTX 3060', 'Apple M3'],
  ['Canvas', 'a91f…3c0e', '5d27…e81b'],
] as const;

function FingerprintDiff() {
  return (
    <div className="mt-auto overflow-hidden rounded-lg border text-xs">
      <div className="bg-muted/50 text-muted-foreground grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b px-3 py-2 font-medium">
        <span />
        <span>amz-us-01</span>
        <span>tiktok-uk-02</span>
      </div>
      <dl className="divide-y">
        {fingerprintRows.map(([label, a, b]) => (
          <div
            key={label}
            className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-3 py-1.5"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="truncate font-mono">{a}</dd>
            <dd className="truncate font-mono">{b}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ProxyChain() {
  const hops = ['本机', 'Clash', 'SOCKS5', '网站'];
  return (
    <div className="mt-auto flex flex-col gap-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs">
        {hops.map((hop, index) => (
          <li key={hop} className="flex items-center gap-1.5">
            <span
              className={cn(
                'rounded-md border px-2.5 py-1 font-medium',
                index === 2 && 'border-primary/40 bg-primary/5 text-primary',
              )}
            >
              {hop}
            </span>
            {index < hops.length - 1 && (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="text-muted-foreground size-3.5"
              />
            )}
          </li>
        ))}
      </ol>
      <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          strokeWidth={2}
          className="text-success size-4 shrink-0"
        />
        <span className="text-muted-foreground">出口 IP</span>
        <span className="font-mono">203.0.113.24</span>
        <span className="text-muted-foreground ml-auto truncate">
          美国 · 纽约
        </span>
      </div>
    </div>
  );
}

const members = [
  { initials: 'ZH', name: 'Zhang', role: '所有者' },
  { initials: 'LI', name: 'Li', role: '管理员' },
  { initials: 'WA', name: 'Wang', role: '成员' },
] as const;

function TeamList() {
  return (
    <ul className="mt-auto divide-y rounded-lg border text-xs">
      {members.map((member) => (
        <li key={member.name} className="flex items-center gap-2.5 px-3 py-2">
          <Avatar size="sm">
            <AvatarFallback>{member.initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{member.name}</span>
          <Badge variant="outline" className="ml-auto h-5 px-2">
            {member.role}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function BatchSelect() {
  const rows = [
    { name: 'amz-us-01', checked: true },
    { name: 'amz-us-02', checked: true },
    { name: 'amz-us-03', checked: false },
  ];
  return (
    <div className="mt-auto flex flex-col gap-2 text-xs">
      <ul className="divide-y rounded-lg border">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-2.5 px-3 py-2">
            <Checkbox checked={row.checked} tabIndex={-1} aria-hidden />
            <span className="font-mono">{row.name}</span>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground">已选 2 个环境 · 批量启动</p>
    </div>
  );
}

const codeLines: [string, string][] = [
  ['text-muted-foreground', "import { OneBrowser } from '@one-browser/sdk';"],
  ['', ''],
  ['', 'const ob = new OneBrowser();'],
  ['', "const browser = await ob.connect('amz-us-01', { puppeteer });"],
  ['', 'const [page] = await browser.pages();'],
  ['', "await page.goto('https://ipwhere.net/');"],
];

function CodeSample() {
  return (
    <pre className="bg-muted/50 mt-auto overflow-x-auto rounded-lg border p-4 font-mono text-xs leading-6">
      <code>
        {codeLines.map(([tone, line], index) => (
          <span key={index} className={cn('block', tone)}>
            {line || ' '}
          </span>
        ))}
      </code>
    </pre>
  );
}
