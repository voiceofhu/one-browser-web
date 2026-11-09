import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReactNode } from 'react';

type Row = readonly [ReactNode, ReactNode, ReactNode];

function ReferenceTable({
  head,
  rows,
}: {
  head: readonly [string, string, string];
  rows: readonly Row[];
}) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {head.map((cell) => (
              <TableHead key={cell} className="h-9 whitespace-nowrap">
                {cell}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="align-top font-mono text-[12px] whitespace-nowrap">
                {row[0]}
              </TableCell>
              <TableCell className="text-muted-foreground align-top whitespace-nowrap">
                {row[1]}
              </TableCell>
              <TableCell className="min-w-64 align-top whitespace-normal">
                {row[2]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const c = (text: string) => (
  <code className="bg-muted rounded px-1 py-0.5 font-mono text-[12px]">
    {text}
  </code>
);

export function SdkMethodsTable() {
  return (
    <ReferenceTable
      head={['Node.js', 'Python', '说明']}
      rows={[
        [
          'new OneBrowser({ token, baseUrl })',
          'OneBrowser(token=, base_url=)',
          <>
            不传时读取环境变量 {c('ONE_BROWSER_TOKEN')} 和{' '}
            {c('ONE_BROWSER_API')}。没有令牌会直接报错。
          </>,
        ],
        [
          'start(id, options)',
          'start(id, **options)',
          <>
            以自动化模式启动环境，返回 {c('wsEndpoint')} / {c('ws_endpoint')}、
            {c('debuggerAddress')} / {c('debugger_address')}、{c('debugPort')}、
            {c('pid')}。
          </>,
        ],
        [
          'connect(id, { puppeteer })',
          '—',
          <>
            启动并调用 {c('puppeteer.connect')}，返回已连接的
            Browser；连接失败时自动停止环境。
          </>,
        ],
        [
          '—',
          'session(id, **options)',
          <>上下文管理器：进入时启动，退出 {c('with')} 时自动停止。</>,
        ],
        [
          'stop(id) / stopAll()',
          'stop(id) / stop_all()',
          '由 App 正常关闭浏览器（会先保存 Cookie 与会话），并关闭该环境的代理桥。',
        ],
        [
          'active(id)',
          'active(id)',
          <>
            查询单个环境的运行状态。从 App 窗口手动打开的环境没有自动化端口，
            {c('wsEndpoint')} 为 {c('null')}。
          </>,
        ],
        ['listActive()', 'list_active()', '本机所有正在运行的环境。'],
        [
          'listProfiles({ page, pageSize })',
          'list_profiles(page=, page_size=)',
          '分页列出环境，用来查找环境 ID。',
        ],
        ['status()', 'status()', 'App 与本地 API 状态。'],
      ]}
    />
  );
}

export function StartOptionsTable() {
  return (
    <ReferenceTable
      head={['参数', '类型', '说明']}
      rows={[
        ['profile_id', 'string', '必填。环境 ID。'],
        [
          'automation',
          'boolean',
          <>
            {c('true')} 时开放 CDP 端口并返回 {c('ws.puppeteer')}。SDK 总是传{' '}
            {c('true')}。
          </>,
        ],
        [
          'headless',
          'boolean',
          <>
            无界面运行，仅允许在 {c('dev')} 模式；SDK 传 {c('headless')}{' '}
            时会自动带上 {c('mode: "dev"')}。
          </>,
        ],
        [
          'mode',
          'string',
          <>
            {c('standard')} / {c('compat')} / {c('strict')} / {c('dev')}
            ，不传则使用环境自己的模式。
          </>,
        ],
        ['url', 'string', '启动后打开的网址。'],
        ['tabs', 'string[]', '启动后打开的多个网址。'],
      ]}
    />
  );
}

export function EndpointsTable() {
  return (
    <ReferenceTable
      head={['接口', '方法', '说明']}
      rows={[
        [
          '/api/browser-profile/start',
          'POST',
          <>启动环境。请求体见上表，返回运行信息（含 {c('ws.puppeteer')}）。</>,
        ],
        [
          '/api/browser-profile/stop',
          'POST',
          <>停止环境：{c('{"profile_id": "…"}')}。</>,
        ],
        ['/api/browser-profile/stop-all', 'POST', '停止全部环境：{}。'],
        [
          '/api/browser-profile/active?profile_id=…',
          'GET',
          '单个环境的运行信息。',
        ],
        ['/api/browser/local-active', 'GET', '本机所有运行中的环境。'],
        [
          '/api/browser-profile/list',
          'POST',
          <>{c('{"page": 1, "page_size": 50}')}，分页返回环境列表。</>,
        ],
        ['/api/status', 'GET', 'App 与本地 API 状态。'],
        ['/api/health', 'GET', '健康检查，同样需要令牌。'],
      ]}
    />
  );
}

export function ErrorsTable() {
  return (
    <ReferenceTable
      head={['HTTP', '含义', '处理方式']}
      rows={[
        [
          '401',
          '令牌错误',
          '令牌缺失、写错，或在 App 中重新生成过。到 设置 → 本地 API 复制新令牌。',
        ],
        [
          '403',
          '请求被拒绝',
          <>
            带了 {c('Origin')} 头（网页里的 fetch）或 Host 不是 127.0.0.1 /
            localhost。本地 API 只给本机脚本使用，网页无法调用。
          </>,
        ],
        ['404', '环境不存在', '检查环境 ID，可用 listProfiles 查询。'],
        [
          '409',
          '环境已在运行',
          <>
            先 {c('stop')} 再以自动化模式启动；从 App
            窗口打开的环境没有自动化端口。
          </>,
        ],
        [
          '400 / 500',
          '启动失败',
          <>
            {c('msg')} 会说明原因，例如代理检测未通过、出口 IP
            不一致、内核不支持远程调试等。
          </>,
        ],
        [
          '连接失败',
          'App 未运行',
          '打开 One Browser 客户端，并在 设置 → 本地 API 中开启服务。',
        ],
      ]}
    />
  );
}
