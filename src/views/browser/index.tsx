import { useAuth } from '@/features/auth/auth-gate';
import { hasPermission } from '@/features/auth/permissions';
import type { AuthRoute } from '@/features/auth/types';
import { resolveRouteIcon } from '@/features/browser-shell/route-icons';
import { getDashboardOverview } from '@/views/dashboard/api';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from 'react-router-dom';

const GROUP_PATH = '/browser';

const ROUTE_ALIASES: Record<string, string> = {
  '/browser/environment': '/environments',
  '/browser/proxy': '/proxies',
  '/browser/team': '/teams',
  '/browser/member': '/members',
  '/browser/assets': '/versions',
};

const DESCRIPTIONS: Record<string, string> = {
  '/environments': '创建、分组和启动浏览器环境，每个环境独立指纹与代理。',
  '/proxies': '添加 HTTP、SOCKS5 代理，检测出口 IP，绑定到环境。',
  '/teams': '切换和管理团队，团队内的环境与代理互相共享。',
  '/members': '邀请成员，按角色分配权限和可用的环境。',
  '/system/role': '定义团队角色，决定成员能看到和操作哪些功能。',
  '/versions': '上传和发布浏览器安装包，设置当前下载版本。',
};

type ModuleLink = {
  href: string;
  title: string;
  icon: ReturnType<typeof resolveRouteIcon>;
};

/** `/browser` — the 浏览器管理 group's own page: one entry per module. */
export default function BrowserOverviewPage() {
  const { access } = useAuth();
  const modules = collectModules(access.routes);
  const canViewMetrics = hasPermission(access, 'index:overview');
  const query = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: getDashboardOverview,
    enabled: canViewMetrics,
  });
  const metricByHref = new Map(
    (query.data?.metrics ?? []).map((metric) => [metric.href, metric]),
  );

  return (
    <section className="bg-background flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-3 pt-2 pb-6 sm:px-5">
        <header className="flex min-h-10 flex-col justify-center">
          <h1 className="text-[1.0625rem] font-semibold tracking-tight">
            浏览器管理
          </h1>
          <p className="text-muted-foreground text-xs">
            环境、代理、团队与安装包都在这里管理。
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const metric = metricByHref.get(module.href);
            return (
              <Link
                key={module.href}
                to={module.href}
                className="group bg-card hover:bg-muted/40 focus-visible:ring-ring/40 flex min-h-32 flex-col gap-3 rounded-lg border p-4 transition-colors outline-none focus-visible:ring-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-md">
                    <HugeiconsIcon
                      icon={module.icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </span>
                  <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {module.title}
                  </h2>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                {DESCRIPTIONS[module.href] ? (
                  <p className="text-muted-foreground text-xs leading-5">
                    {DESCRIPTIONS[module.href]}
                  </p>
                ) : null}
                {metric ? (
                  <p className="mt-auto flex items-baseline gap-2">
                    <span className="text-xl font-semibold tracking-tight tabular-nums">
                      {metric.value}
                    </span>
                    <span className="text-muted-foreground text-[0.6875rem]">
                      {metric.secondary_label} {metric.secondary_value}
                    </span>
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function collectModules(routes: AuthRoute[] | undefined): ModuleLink[] {
  const group = routes?.find((route) => route.path === GROUP_PATH);
  const modules: ModuleLink[] = [];

  function visit(route: AuthRoute) {
    if (route.menu_type === 'C' && !route.hidden) {
      modules.push({
        href: ROUTE_ALIASES[route.path] ?? route.path,
        title: route.meta.title,
        icon: resolveRouteIcon(route.meta.icon),
      });
    }
    route.children?.forEach(visit);
  }

  group?.children?.forEach(visit);
  return modules;
}
