import { AppImage as Image } from '@/components/app-image';
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { CodeBlock, CodeTabs } from './code-block';
import {
  EndpointsTable,
  ErrorsTable,
  SdkMethodsTable,
  StartOptionsTable,
} from './reference-tables';
import {
  curlStartSample,
  envSample,
  errorResponseSample,
  headlessSamples,
  installSamples,
  listSamples,
  quickstartSamples,
  startResponseSample,
} from './sdk-samples';

const sections = [
  { id: 'overview', title: '工作方式' },
  { id: 'prepare', title: '准备工作' },
  { id: 'install', title: '安装 SDK' },
  { id: 'quickstart', title: '快速开始' },
  { id: 'find-profile', title: '查找环境 ID' },
  { id: 'headless', title: '无界面运行' },
  { id: 'sdk-reference', title: 'SDK 方法' },
  { id: 'http-api', title: 'HTTP 接口' },
  { id: 'errors', title: '错误处理' },
  { id: 'notes', title: '注意事项' },
] as const;

const flow = [
  {
    step: '1',
    title: '脚本调用本地 API',
    body: '向本机 127.0.0.1:27523 发送启动请求，带上访问令牌。',
  },
  {
    step: '2',
    title: 'App 启动环境',
    body: '按环境配置加载指纹、代理和前置代理，检测出口后启动内核。',
  },
  {
    step: '3',
    title: '返回 CDP 地址',
    body: '内核在本机随机端口开放调试协议，App 返回 ws 地址。',
  },
  {
    step: '4',
    title: '自动化库接管',
    body: 'Puppeteer、Playwright 或 Selenium 连接后照常写脚本。',
  },
] as const;

const notes: readonly ReactNode[] = [
  <>
    <b>使用默认 context。</b>环境的 Cookie、缓存和登录状态都在默认 context
    里。Playwright 的 <Code>browser.newContext()</Code> 或 Puppeteer 的{' '}
    <Code>createBrowserContext()</Code>{' '}
    会新建一个空白会话，指纹不变，但没有登录状态。
  </>,
  <>
    <b>结束时先断开再停止。</b>推荐 <Code>disconnect()</Code> 后调用{' '}
    <Code>stop()</Code>，由 App 正常退出浏览器并保存 Cookie；直接{' '}
    <Code>browser.close()</Code> 也能结束，但不保证会话数据完整写入。
  </>,
  <>
    <b>不要修改指纹相关设置。</b>
    User-Agent、时区、语言、视口等由环境配置决定。在脚本里调用{' '}
    <Code>setUserAgent</Code>、<Code>emulateTimezone</Code>{' '}
    等会让页面看到的数据和环境不一致，反而更容易被识别。连接时保持{' '}
    <Code>defaultViewport: null</Code>（SDK 已默认）。
  </>,
  <>
    <b>一个环境同一时间只能运行一次。</b>已在 App
    窗口中打开的环境需要先关闭，再以自动化模式启动。
  </>,
  <>
    <b>团队云端环境暂不支持。</b>需要服务器租约的远程环境（ID 以{' '}
    <Code>remote-env-</Code> 开头）只能在 App 内启动。
  </>,
  <>
    <b>令牌等同于本机控制权。</b>
    拿到令牌的程序可以启动、停止和删除你的环境。不要提交到代码仓库；泄露后在
    设置 → 本地 API 中重新生成，旧令牌会立即失效。
  </>,
  <>
    <b>调试端口只在本机开放。</b>CDP 端口随机分配并只监听
    127.0.0.1，环境停止后端口随之关闭。
  </>,
];

export function DocsPage() {
  return (
    <main className="bg-background text-foreground h-dvh overflow-y-auto scroll-smooth px-5 pt-[env(safe-area-inset-top)] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
      <title>开发文档 · One Browser</title>
      <div className="mx-auto max-w-6xl">
        <DocsHeader />
        <Separator />

        <div className="grid gap-10 py-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
          <aside className="hidden lg:block">
            <nav
              aria-label="文档目录"
              className="sticky top-6 flex flex-col gap-0.5 text-[13px]"
            >
              <p className="text-muted-foreground mb-2 px-2 text-xs font-medium">
                目录
              </p>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-2 py-1.5 transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="max-w-3xl min-w-0">
            <Badge variant="outline" className="mb-4 h-6 px-2.5">
              SDK · v0.1
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              用代码控制 One Browser
            </h1>
            <p className="text-muted-foreground mt-4 text-sm leading-7">
              Node.js 和 Python SDK 通过本机 One Browser
              客户端启动环境，再把浏览器交给 Puppeteer、Playwright 或
              Selenium。指纹、代理和前置代理沿用环境配置，脚本只负责页面操作。
            </p>

            <Section id="overview" title="工作方式">
              <ol className="grid gap-3 sm:grid-cols-2">
                {flow.map((item) => (
                  <li key={item.step} className="rounded-lg border p-4">
                    <span className="bg-muted text-muted-foreground inline-flex size-6 items-center justify-center rounded-md font-mono text-xs">
                      {item.step}
                    </span>
                    <p className="mt-3 text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-1 text-[13px] leading-6">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ol>
              <P>
                返回的地址就是标准的 Chrome DevTools Protocol 地址，任何支持{' '}
                <Code>browserWSEndpoint</Code>（Puppeteer）、
                <Code>connectOverCDP</Code>（Playwright）或{' '}
                <Code>debuggerAddress</Code>（Selenium）的库都可以直接使用。
              </P>
            </Section>

            <Section id="prepare" title="准备工作">
              <ol className="text-muted-foreground list-decimal space-y-2 pl-5 text-sm leading-7">
                <li>
                  安装并登录 One Browser 客户端（
                  <Link to="/download" className="text-foreground underline">
                    下载
                  </Link>
                  ），在客户端中创建好环境。
                </li>
                <li>
                  打开 <b className="text-foreground">设置 → 本地 API</b>
                  ，开启服务。本地 API 默认关闭，只监听 127.0.0.1。
                </li>
                <li>
                  复制 <b className="text-foreground">访问令牌</b>
                  ，保存到环境变量，SDK 会自动读取：
                </li>
              </ol>
              <CodeBlock code={envSample} label="terminal" />
            </Section>

            <Section id="install" title="安装 SDK">
              <P>
                SDK 本身不依赖第三方库，自动化库按需安装。要求 Node.js 18+ 或
                Python 3.9+。
              </P>
              <CodeTabs samples={installSamples} />
            </Section>

            <Section id="quickstart" title="快速开始">
              <P>
                把 <Code>你的环境 ID</Code> 换成实际的环境
                ID，运行后会打开浏览器访问出口 IP 检测页并打印标题。
              </P>
              <CodeTabs samples={quickstartSamples} />
            </Section>

            <Section id="find-profile" title="查找环境 ID">
              <P>用 SDK 分页列出本机 App 中的环境：</P>
              <CodeTabs samples={listSamples} />
            </Section>

            <Section id="headless" title="无界面运行">
              <P>
                无界面模式只能在 <Code>dev</Code> 模式下使用，SDK
                会自动处理。无界面运行时显卡、屏幕等信息和有界面时不同，对风控敏感的网站建议用有界面模式。
              </P>
              <CodeTabs samples={headlessSamples} />
            </Section>

            <Section id="sdk-reference" title="SDK 方法">
              <SdkMethodsTable />
              <h3 className="mt-6 text-sm font-semibold">启动参数</h3>
              <StartOptionsTable />
            </Section>

            <Section id="http-api" title="HTTP 接口">
              <P>
                不使用 SDK 时可以直接调用本地 API，适合 Go、Java
                等其他语言。每个请求都要带{' '}
                <Code>Authorization: Bearer &lt;访问令牌&gt;</Code>
                ；请求体为 JSON，字段使用 snake_case。
              </P>
              <CodeBlock code={curlStartSample} label="terminal" />
              <P>成功时返回：</P>
              <CodeBlock code={startResponseSample} label="response.json" />
              <EndpointsTable />
            </Section>

            <Section id="errors" title="错误处理">
              <P>
                失败时 HTTP 状态码不是 200，<Code>code</Code> 不为 0，
                <Code>msg</Code> 是原因。SDK 会抛出 <Code>OneBrowserError</Code>
                ，带 <Code>status</Code> 和 <Code>code</Code>。
              </P>
              <CodeBlock code={errorResponseSample} label="response.json" />
              <ErrorsTable />
            </Section>

            <Section id="notes" title="注意事项">
              <ul className="space-y-3">
                {notes.map((note, index) => (
                  <li
                    key={index}
                    className="text-muted-foreground [&_b]:text-foreground border-l-2 pl-4 text-sm leading-7 [&_b]:font-medium"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </Section>
          </article>
        </div>
      </div>
    </main>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="mt-12 scroll-mt-6 space-y-4"
    >
      <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">
        <a href={`#${id}`} className="hover:underline">
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-sm leading-7">{children}</p>;
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-[12.5px]">
      {children}
    </code>
  );
}

function DocsHeader() {
  return (
    <header className="flex min-h-16 items-center justify-between gap-3">
      <Link to="/" className="flex shrink-0 items-center gap-2.5">
        <Image
          src="/pwa-512x512.png"
          alt="One Browser"
          width={36}
          height={36}
          className="size-9 rounded-lg"
          draggable={false}
        />
        <span className="text-sm font-semibold tracking-tight">
          One Browser
        </span>
        <span className="text-muted-foreground hidden text-sm sm:inline">
          / 开发文档
        </span>
      </Link>
      <nav aria-label="文档导航" className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-8 text-xs sm:inline-flex"
          asChild
        >
          <Link to="/download">下载</Link>
        </Button>
        <ThemeToggleButton className="text-muted-foreground hover:bg-muted/70 dark:hover:bg-muted/70 rounded-md border-transparent bg-transparent dark:bg-transparent" />
        <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
          <Link to="/">首页</Link>
        </Button>
      </nav>
    </header>
  );
}
