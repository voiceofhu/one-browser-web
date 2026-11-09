import type { CodeSample } from './code-block';

export const LOCAL_API = 'http://127.0.0.1:27523';

export const installSamples: readonly CodeSample[] = [
  {
    id: 'node',
    label: 'Node.js',
    file: 'terminal',
    code: `npm i @one-browser/sdk puppeteer-core
# 用 Playwright 时：npm i @one-browser/sdk playwright-core`,
  },
  {
    id: 'python',
    label: 'Python',
    file: 'terminal',
    code: `pip install one-browser playwright
# 用 Selenium 时：pip install one-browser selenium`,
  },
];

export const envSample = `export ONE_BROWSER_TOKEN="在 App 设置 → 本地 API 复制的访问令牌"
# 可选，端口改过时才需要
export ONE_BROWSER_API="${LOCAL_API}"`;

export const quickstartSamples: readonly CodeSample[] = [
  {
    id: 'node-puppeteer',
    label: 'Node · Puppeteer',
    file: 'puppeteer.mjs',
    code: `import puppeteer from 'puppeteer-core';
import { OneBrowser } from '@one-browser/sdk';

const ob = new OneBrowser(); // 读取 ONE_BROWSER_TOKEN
const profileId = '你的环境 ID';

// 启动环境并连接，等价于 puppeteer.connect({ browserWSEndpoint })
const browser = await ob.connect(profileId, { puppeteer });
try {
  const [page] = await browser.pages();
  await page.goto('https://ip.huzhihui.com/');
  console.log(await page.title());
} finally {
  await browser.disconnect(); // 断开脚本连接
  await ob.stop(profileId); // 由 App 正常关闭浏览器并保存 Cookie
}`,
  },
  {
    id: 'node-playwright',
    label: 'Node · Playwright',
    file: 'playwright.mjs',
    code: `import { chromium } from 'playwright-core';
import { OneBrowser } from '@one-browser/sdk';

const ob = new OneBrowser();
const profileId = '你的环境 ID';

const session = await ob.start(profileId);
const browser = await chromium.connectOverCDP(session.wsEndpoint);
try {
  // 必须用默认 context：环境的 Cookie 与登录状态都在这里
  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://ip.huzhihui.com/');
  console.log(await page.title());
} finally {
  await ob.stop(profileId);
}`,
  },
  {
    id: 'python-playwright',
    label: 'Python · Playwright',
    file: 'playwright_demo.py',
    code: `from playwright.sync_api import sync_playwright
from one_browser import OneBrowser

ob = OneBrowser()  # 读取 ONE_BROWSER_TOKEN

# 退出 with 时自动停止环境
with ob.session("你的环境 ID") as s, sync_playwright() as p:
    browser = p.chromium.connect_over_cdp(s.ws_endpoint)
    context = browser.contexts[0]  # 默认 context，带环境的 Cookie
    page = context.pages[0] if context.pages else context.new_page()
    page.goto("https://ip.huzhihui.com/")
    print(page.title())`,
  },
  {
    id: 'python-selenium',
    label: 'Python · Selenium',
    file: 'selenium_demo.py',
    code: `from selenium import webdriver
from one_browser import OneBrowser

ob = OneBrowser()

with ob.session("你的环境 ID") as s:
    options = webdriver.ChromeOptions()
    options.debugger_address = s.debugger_address  # 例如 127.0.0.1:51234
    # chromedriver 主版本需要和 One Browser 内核一致
    driver = webdriver.Chrome(options=options)
    driver.get("https://ip.huzhihui.com/")
    print(driver.title)`,
  },
];

export const headlessSamples: readonly CodeSample[] = [
  {
    id: 'node',
    label: 'Node.js',
    file: 'headless.mjs',
    code: `const session = await ob.start(profileId, { headless: true });
// 等价于 { headless: true, mode: 'dev' }`,
  },
  {
    id: 'python',
    label: 'Python',
    file: 'headless.py',
    code: `session = ob.start(profile_id, headless=True)
# 等价于 headless=True, mode="dev"`,
  },
];

export const listSamples: readonly CodeSample[] = [
  {
    id: 'node',
    label: 'Node.js',
    file: 'list.mjs',
    code: `const { list, total } = await ob.listProfiles({ page: 1, pageSize: 50 });
for (const profile of list) {
  console.log(profile.profile_id, profile.name, profile.status);
}`,
  },
  {
    id: 'python',
    label: 'Python',
    file: 'list.py',
    code: `page = ob.list_profiles(page=1, page_size=50)
for profile in page["list"]:
    print(profile["profile_id"], profile["name"], profile["status"])`,
  },
];

export const curlStartSample = `curl -s ${LOCAL_API}/api/browser-profile/start \\
  -H "Authorization: Bearer $ONE_BROWSER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"profile_id": "你的环境 ID", "automation": true}'`;

export const startResponseSample = `{
  "code": 0,
  "msg": "success",
  "data": {
    "profile_id": "你的环境 ID",
    "status": "Active",
    "pid": 48211,
    "debug_port": 51234,
    "ws": {
      "puppeteer": "ws://127.0.0.1:51234/devtools/browser/6f1c…",
      "selenium": "127.0.0.1:51234"
    },
    "webdriver": null
  }
}`;

export const errorResponseSample = `{ "code": 409, "msg": "profile is already running", "data": null }`;
