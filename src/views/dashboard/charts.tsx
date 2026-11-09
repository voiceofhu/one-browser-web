import { EChartsChart } from '@/components/echarts-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/components/theme/runtime';
import { cn } from '@/lib/utils';
import type { EChartsCoreOption } from 'echarts/core';
import * as React from 'react';

import type {
  DashboardActivityPoint,
  DashboardChartPoint,
  DashboardMetric,
} from './types';

const COLORS = [
  '#2563eb',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#64748b',
];

export function ResourceDistributionChart({
  data,
  metrics,
  onNavigate,
}: {
  data: DashboardChartPoint[];
  metrics: DashboardMetric[];
  onNavigate: (href: string) => void;
}) {
  const palette = useChartPalette();
  const hrefByLabel = React.useMemo(
    () => new Map(metrics.map((item) => [item.title, item.href])),
    [metrics],
  );
  const option = React.useMemo<EChartsCoreOption>(
    () => ({
      color: COLORS,
      grid: { left: 12, right: 12, top: 24, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: palette.grid } },
        axisLabel: { color: palette.muted, interval: 0 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: palette.grid } },
        axisLabel: { color: palette.muted },
      },
      series: [
        {
          type: 'bar',
          data: data.map((item) => ({
            value: item.value,
            itemStyle: {
              color: palette.primary,
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barMaxWidth: 24,
          // ECharts cannot auto-lift OKLCH theme colors; retain the SVG fill on hover.
          emphasis: { itemStyle: { color: 'inherit' } },
          label: { show: true, position: 'top', color: palette.text },
        },
      ],
    }),
    [data, palette],
  );

  return (
    <ChartCard title="资源规模">
      <EChartsChart
        option={option}
        className="h-44 w-full cursor-pointer"
        onItemClick={(label) => {
          const href = hrefByLabel.get(label);
          if (href) onNavigate(href);
        }}
      />
    </ChartCard>
  );
}

export function StatusPieChart({
  title,
  data,
}: {
  title: string;
  data: DashboardChartPoint[];
}) {
  const palette = useChartPalette();
  const option = React.useMemo<EChartsCoreOption>(
    () => ({
      color: COLORS,
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['52%', '72%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: palette.surface, borderWidth: 2 },
          label: { color: palette.text, formatter: '{b} ({c})' },
          data: data.map((item) => ({ name: item.label, value: item.value })),
        },
      ],
    }),
    [data, palette],
  );

  return (
    <ChartCard title={title}>
      <EChartsChart option={option} className="h-44 w-full" />
    </ChartCard>
  );
}

export function ActivityChart({ data }: { data: DashboardActivityPoint[] }) {
  const palette = useChartPalette();
  const series = React.useMemo(
    () =>
      [
        { key: 'teams', name: '团队', color: COLORS[0] },
        { key: 'environments', name: '环境', color: COLORS[1] },
        { key: 'proxies', name: '代理', color: COLORS[2] },
      ].filter((item) =>
        data.some(
          (point) =>
            Number(point[item.key as keyof DashboardActivityPoint] ?? 0) > 0,
        ),
      ),
    [data],
  );
  const option = React.useMemo<EChartsCoreOption>(
    () => ({
      color: series.map((item) => item.color),
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: palette.muted } },
      grid: { left: 12, right: 18, top: 36, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((item) => item.date.slice(5)),
        axisLine: { lineStyle: { color: palette.grid } },
        axisLabel: { color: palette.muted },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: palette.grid } },
        axisLabel: { color: palette.muted },
      },
      series: series.map((item) => ({
        name: item.name,
        type: 'line',
        smooth: true,
        symbolSize: 7,
        areaStyle: { opacity: 0.08 },
        data: data.map((point) =>
          Number(point[item.key as keyof DashboardActivityPoint] ?? 0),
        ),
      })),
    }),
    [data, palette, series],
  );

  return (
    <ChartCard title="最近 7 天新增趋势" className="lg:col-span-2">
      <EChartsChart option={option} className="h-48 w-full" />
    </ChartCard>
  );
}

function ChartCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        'bg-card rounded-lg shadow-none ring-0 data-[size=sm]:gap-0 data-[size=sm]:py-0',
        className,
      )}
    >
      <CardHeader className="pt-2.5 pb-0 group-data-[size=sm]/card:px-3">
        <CardTitle className="text-[0.8125rem] font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-1.5 group-data-[size=sm]/card:px-2">
        {children}
      </CardContent>
    </Card>
  );
}

function useChartPalette() {
  const { resolvedTheme } = useTheme();
  return React.useMemo(() => {
    const primary =
      typeof window === 'undefined'
        ? '#2563eb'
        : getComputedStyle(document.documentElement)
            .getPropertyValue('--primary')
            .trim() || '#2563eb';
    return resolvedTheme === 'dark'
      ? {
          text: '#e2e8f0',
          muted: '#94a3b8',
          grid: '#334155',
          surface: '#1f1f1f',
          primary,
        }
      : {
          text: '#1d1d1f',
          muted: '#86868b',
          grid: '#ececec',
          surface: '#ffffff',
          primary,
        };
  }, [resolvedTheme]);
}
