import { RefreshButton } from '@/components/refresh-button';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-gate';
import { hasPermission } from '@/features/auth/permissions';
import type { AuthRoute } from '@/features/auth/types';
import { formatDateTimeTitle, formatUpdatedAt } from '@/lib/date-time';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
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
import { RecentEnvironments } from './recent-environments';
import type { DashboardChartPoint, DashboardMetric } from './types';

const DASHBOARD_PERMISSION = 'index:overview';

/** Re-reads the clock so 刚刚更新 moves on to 更新于 1 分钟前 without a refetch. */
function UpdatedAtLabel({ value }: { value: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [value]);

  return (
    <span
      className="text-muted-foreground text-[0.6875rem]"
      title={formatDateTimeTitle(value)}
    >
      {formatUpdatedAt(value, now)}
    </span>
  );
}

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
  const canView = hasPermission(access, DASHBOARD_PERMISSION);
  const query = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: getDashboardOverview,
    enabled: canView,
  });

  if (!canView) {
    return (
      <Navigate
        replace
        to={firstAuthorizedHref(access.routes) ?? '/settings/profile'}
      />
    );
  }

  const data = query.data;
  const breakdowns: Partial<Record<string, StatusBreakdown>> = data
    ? {
        environments: {
          points: data.charts.environment_status,
          tones: ENVIRONMENT_TONES,
        },
        proxies: { points: data.charts.proxy_status, tones: PROXY_TONES },
      }
    : {};

  return (
    <section className="bg-background flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 pt-2 pb-4 sm:px-5">
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h1 className="text-[1.0625rem] font-semibold tracking-tight">
            工作台
          </h1>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {data ? <UpdatedAtLabel value={data.generated_at} /> : null}
            <RefreshButton
              size="sm"
              variant="outline"
              isRefreshing={query.isFetching}
              onRefresh={query.refetch}
              successMessage="工作台已刷新"
            />
          </div>
        </div>

        <div className="bg-card overflow-hidden rounded-lg border">
          {query.isLoading ? (
            <LoadingState className="min-h-20" label="工作台加载中..." />
          ) : query.isError ? (
            <p className="text-destructive px-4 py-3 text-xs">
              统计加载失败：{query.error.message}
            </p>
          ) : data?.metrics.length ? (
            <div className="grid grid-cols-2 border-b sm:grid-cols-3 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none">
              {data.metrics.map((metric) => (
                <MetricCell
                  key={metric.key}
                  metric={metric}
                  breakdown={breakdowns[metric.key]}
                />
              ))}
            </div>
          ) : null}

          <RecentEnvironments />
        </div>
      </div>
    </section>
  );
}

type StatusBreakdown = {
  points: DashboardChartPoint[];
  tones: Record<string, string>;
};

/** Short legend names so the cell's one line never truncates. */
const SHORT_LABELS: Record<string, string> = {
  running: '运行',
  idle: '空闲',
  disabled: '停用',
  healthy: '正常',
  unchecked: '待测',
  unhealthy: '异常',
};

const ENVIRONMENT_TONES: Record<string, string> = {
  running: 'bg-success',
  idle: 'bg-muted-foreground/35',
  disabled: 'bg-muted-foreground/15',
};

const PROXY_TONES: Record<string, string> = {
  healthy: 'bg-success',
  unchecked: 'bg-warning',
  unhealthy: 'bg-destructive',
};

function MetricCell({
  metric,
  breakdown,
}: {
  metric: DashboardMetric;
  breakdown?: StatusBreakdown;
}) {
  const Icon =
    METRIC_ICONS[metric.key as keyof typeof METRIC_ICONS] ??
    DashboardSquare01Icon;
  const total = breakdown?.points.reduce((sum, p) => sum + p.value, 0) ?? 0;
  return (
    <Link
      to={metric.href}
      data-slot="dashboard-metric-cell"
      className="hover:bg-muted/50 focus-visible:ring-ring/30 -mr-px -mb-px flex min-w-0 flex-col gap-1 border-r border-b px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset"
    >
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-3.5" />
        {metric.title}
      </span>
      <span className="text-[1.375rem] leading-7 font-semibold tracking-tight tabular-nums">
        {metric.value}
      </span>
      {breakdown && total > 0 ? (
        <span className="flex flex-col gap-1">
          <span className="bg-muted flex h-1 overflow-hidden rounded-full">
            {breakdown.points.map((point) =>
              point.value > 0 ? (
                <span
                  key={point.key}
                  className={
                    breakdown.tones[point.key] ?? 'bg-muted-foreground/30'
                  }
                  style={{ width: `${(point.value / total) * 100}%` }}
                />
              ) : null,
            )}
          </span>
          <span className="text-muted-foreground truncate text-[0.6875rem]">
            {breakdown.points
              .filter((point) => point.value > 0)
              .map(
                (point) =>
                  `${SHORT_LABELS[point.key] ?? point.label} ${point.value}`,
              )
              .join(' · ')}
          </span>
        </span>
      ) : (
        <span className="text-muted-foreground truncate text-[0.6875rem]">
          {metric.secondary_label} {metric.secondary_value}
        </span>
      )}
    </Link>
  );
}

/** Where to send someone who may not see the dashboard: their first menu page. */
function firstAuthorizedHref(routes: AuthRoute[] | undefined): string | null {
  for (const route of routes ?? []) {
    if (route.menu_type === 'C' && !route.hidden) {
      const href = ROUTE_ALIASES[route.path] ?? route.path;
      if (!['/dashboard', '/index'].includes(href)) {
        return href;
      }
    }
    const child = firstAuthorizedHref(route.children);
    if (child) {
      return child;
    }
  }
  return null;
}
