import { RefreshButton } from '@/components/refresh-button';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { useAuth } from '@/features/auth/auth-gate';
import { hasPermission } from '@/features/auth/permissions';
import type { AuthRoute } from '@/features/auth/types';
import { resolveRouteIcon } from '@/features/browser-shell/route-icons';
import { formatDateTimeTitle, formatDisplayDateTime } from '@/lib/date-time';
import { useRouter } from '@/router/compat';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight01Icon,
  DashboardSquare01Icon,
  Notification01Icon,
  PackageOpenIcon,
  Route02Icon,
  UserGroupIcon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Navigate, Link } from 'react-router-dom';

import { getDashboardOverview } from './api';
import {
  ActivityChart,
  ResourceDistributionChart,
  StatusPieChart,
} from './charts';
import type { DashboardActivityPoint, DashboardMetric } from './types';

const DASHBOARD_PERMISSION = 'index:overview';

const METRIC_ICONS = {
  teams: UserGroupIcon,
  environments: DashboardSquare01Icon,
  proxies: Route02Icon,
  members: UserMultipleIcon,
  assets: PackageOpenIcon,
  notices: Notification01Icon,
} as const;

const ROUTE_ALIASES: Record<string, string> = {
  '/index': '/dashboard',
  '/browser/environment': '/environments',
  '/browser/proxy': '/proxies',
  '/browser/team': '/teams',
  '/browser/member': '/members',
  '/browser/assets': '/versions',
};

export default function DashboardOverviewPage() {
  const { access } = useAuth();
  const router = useRouter();
  const canView = hasPermission(access, DASHBOARD_PERMISSION);
  const quickLinks = flattenAuthorizedRoutes(access.routes);
  const query = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: getDashboardOverview,
    enabled: canView,
  });

  if (!canView) {
    return <Navigate replace to={quickLinks[0]?.href ?? '/account/profile'} />;
  }

  const data = query.data;
  const visibleMetrics = data?.metrics.filter(hasMetricValues) ?? [];
  const resourceData =
    data?.charts.resource_distribution.filter(hasChartPointValue) ?? [];
  const environmentData =
    data?.charts.environment_status.filter(hasChartPointValue) ?? [];
  const proxyData = data?.charts.proxy_status.filter(hasChartPointValue) ?? [];
  const activityHasValues = hasActivityValues(data?.charts.activity ?? []);
  const hasChartScope = Boolean(
    resourceData.length ||
    environmentData.length ||
    proxyData.length ||
    activityHasValues,
  );

  return (
    <section className="bg-muted/30 flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-2 p-2 sm:p-3">
        <div className="bg-card flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-sm border px-2.5 py-1">
          <h1 className="text-sm font-semibold">工作台</h1>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {data ? (
              <span
                className="text-muted-foreground text-[0.6875rem]"
                title={formatDateTimeTitle(data.generated_at)}
              >
                更新于 {formatDisplayDateTime(data.generated_at)}
              </span>
            ) : null}
            <RefreshButton
              size="sm"
              variant="outline"
              isRefreshing={query.isFetching}
              onRefresh={query.refetch}
              successMessage="工作台已刷新"
            />
          </div>
        </div>

        {!query.isLoading && visibleMetrics.length ? (
          <div className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-sm border md:grid-cols-3 xl:grid-cols-6">
            {visibleMetrics.map((metric) => (
              <MetricCard key={metric.key} metric={metric} />
            ))}
          </div>
        ) : null}

        {query.isLoading ? (
          <LoadingState
            className="bg-card min-h-48 rounded-sm border"
            label="工作台加载中..."
          />
        ) : query.isError ? (
          <Empty className="bg-card min-h-48 rounded-sm border">
            <EmptyHeader>
              <EmptyTitle>Dashboard 加载失败</EmptyTitle>
              <EmptyDescription>{query.error.message}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : data ? (
          <>
            {hasChartScope ? (
              <div className="grid gap-2 lg:grid-cols-2">
                {resourceData.length ? (
                  <ResourceDistributionChart
                    data={resourceData}
                    metrics={visibleMetrics}
                    onNavigate={router.push}
                  />
                ) : null}
                {environmentData.length ? (
                  <StatusPieChart title="环境状态" data={environmentData} />
                ) : null}
                {proxyData.length ? (
                  <StatusPieChart title="代理检测状态" data={proxyData} />
                ) : null}
                {activityHasValues ? (
                  <ActivityChart data={data.charts.activity} />
                ) : null}
              </div>
            ) : null}

            {quickLinks.length ? (
              <section className="bg-card overflow-hidden rounded-sm border">
                <h2 className="bg-muted/30 border-b px-2.5 py-1.5 text-xs font-semibold">
                  快捷入口
                </h2>
                <div className="bg-border grid gap-px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {quickLinks.map((item) => (
                    <Button
                      asChild
                      key={item.href}
                      variant="ghost"
                      className="bg-card h-8 min-w-0 justify-start gap-2 rounded-none px-2.5"
                    >
                      <Link to={item.href}>
                        <HugeiconsIcon
                          icon={item.icon}
                          strokeWidth={2}
                          className="text-muted-foreground size-3.5"
                        />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                          {item.title}
                        </span>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          strokeWidth={2}
                          className="text-muted-foreground size-3 shrink-0"
                        />
                      </Link>
                    </Button>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon =
    METRIC_ICONS[metric.key as keyof typeof METRIC_ICONS] ??
    DashboardSquare01Icon;
  return (
    <Button
      asChild
      variant="ghost"
      className="bg-card h-auto min-w-0 justify-start gap-2 rounded-none px-2.5 py-2 text-left whitespace-normal"
    >
      <Link to={metric.href}>
        <HugeiconsIcon
          icon={Icon}
          strokeWidth={2}
          className="text-muted-foreground size-4"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-muted-foreground truncate text-xs">
              {metric.title}
            </p>
            <p className="shrink-0 text-lg leading-6 font-semibold tabular-nums">
              {metric.value}
            </p>
          </div>
          <p className="text-muted-foreground truncate text-[0.6875rem] font-normal">
            {metric.secondary_label} {metric.secondary_value}
          </p>
        </div>
      </Link>
    </Button>
  );
}

function flattenAuthorizedRoutes(routes: AuthRoute[] | undefined) {
  const links: Array<{
    title: string;
    href: string;
    icon: ReturnType<typeof resolveRouteIcon>;
  }> = [];
  const seen = new Set<string>();

  function visit(route: AuthRoute) {
    if (route.menu_type === 'C' && !route.hidden) {
      const href = ROUTE_ALIASES[route.path] ?? route.path;
      if (!['/dashboard', '/index'].includes(href) && !seen.has(href)) {
        seen.add(href);
        links.push({
          title: route.meta.title,
          href,
          icon: resolveRouteIcon(route.meta.icon),
        });
      }
    }
    route.children?.forEach(visit);
  }

  routes?.forEach(visit);
  return links;
}

function hasMetricValues(metric: DashboardMetric) {
  return metric.value > 0 || metric.secondary_value > 0;
}

function hasChartPointValue(point: { value: number }) {
  return point.value > 0;
}

function hasActivityValues(data: DashboardActivityPoint[]) {
  return data.some(
    (point) =>
      Number(point.teams ?? 0) > 0 ||
      Number(point.environments ?? 0) > 0 ||
      Number(point.proxies ?? 0) > 0,
  );
}
