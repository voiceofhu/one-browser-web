# One Browser Web

One Browser 的 Vite + React SPA。页面和业务模块由旧 `one-browser-app`
迁移而来，路由由 React Router 管理，组件体系保留 shadcn/ui + Tailwind CSS。

## 本地开发

```bash
pnpm install
make -C ../backend dev
```

后端 `make dev` 统一清理 Web/Backend 端口，先启动 Vite，再启动后端热更新。退出时同时清理两个服务。仅启动 Web 可使用 `pnpm dev`，仍保留自身的 Web 端口清理，兼容桌面 App 调用。

开发服务监听 `http://127.0.0.1:27515`，并把 `/api`、`/healthz`、
`/docs`、`/openapi.json` 代理到 `VITE_DEV_BACKEND_URL`；默认 backend 为
`http://127.0.0.1:27514`。

使用 Vite 热更新时，Backend 的 `APP_PUBLIC_URL` 和 One User redirect 必须指向 `27515`，而 `APP_API_PUBLIC_URL` 保持 `http://127.0.0.1:27514/api` 供 Tauri handoff exchange 使用。代理 `changeOrigin` 不会改浏览器写请求的 `Origin`；错误配置会被 Backend 的 CSRF 校验拒绝。完整示例见 `../backend/README.md`。

复制 `.env.example` 为本地环境文件后，可按需设置：

- `VITE_API_URL`：浏览器请求使用的 API 根路径，默认 `/api`。
- `VITE_BASE_URL`：静态站点基础路径，默认 `/`。
- `VITE_DEV_BACKEND_URL`：仅 Vite 开发代理使用。
- `VITE_WEB_LOGIN_URL`：仅 Tauri 使用的 One Browser OIDC 起点，必须是允许的 origin 加精确 `/api/auth/oidc/start`；该端点立即重定向到 One User 统一登录，普通浏览器也使用同源路径。
- `VITE_TURNSTILE_SITE_KEY`：邀请页面的人机验证站点 Key。
- `VITE_DESKTOP_API_MOCK`：浏览器中是否启用旧桌面平台 mock。

## 页面路由

- `/`：浏览器环境
- `/proxies`：代理
- `/teams`、`/members`、`/roles`、`/permissions`：团队与权限
- `/versions`：浏览器版本资源
- `/settings`：设置
- `/account/profile`、`/account/password`、`/account/invite`：账户设置
- `/login`、`/callback`、`/team-invite`：登录、One User 回调与团队邀请

生产构建输出到 `dist/`。One Browser backend 应在根路由托管该目录，并对
SPA 深层路由回退到 `index.html`；API 始终保留在 `/api`。

## 登录边界

- 普通浏览器只发起 One User Authorization Code + S256 登录，并以 `credentials: same-origin` 使用 Backend 的 HttpOnly access 与本地 BFF session Cookie。上游 refresh token 只由 Backend 加密保存在 Redis；页面不会读取 token，也不会把 token 写入 URL 或 localStorage。
- One User 精确回调 Web `/callback`；该页面把一次性 `code/state` 同源提交到 Backend，读取同步后的用户，再创建独立 DesktopApp session。Backend 返回包含 App access/refresh token、有效期和 `api_url` 的完整 deep link；Web 立即触发，Rust 校验后把 refresh token 保存在系统 Keychain，WebView 内只短暂保留 access token。
- 新路径不再消费 URL token 或旧 token-bearing deep link；Backend 的旧认证接口仍为兼容客户端保留。

## 命令

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm build:stage
```

## 网页更新检测

生产构建通过 `public/app-update-checker.worker.js` 对固定应用首页发起 `HEAD`（`cache: no-store`），首次记录 ETag，后续 ETag 变化才提示刷新；不比较版本号或 Last-Modified。缺少 ETag、请求失败均不提示更新；HEAD 不受支持时回退 GET。

打开页面、返回可见标签页、网络恢复和页面可见时每分钟检查一次。开发模式禁用检查；点击更新后刷新，未保存内容需先保存。后端为首页 HEAD 返回基于实际 HTML 内容的 SHA-256 ETag；独立静态托管或代理也必须保留首页 ETag。
