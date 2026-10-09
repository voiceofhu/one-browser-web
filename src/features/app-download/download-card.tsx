import { formatDateTimeTitle, formatDisplayDateTime } from '@/lib/date-time';
import { AnimatedSegmentedTabs } from '@/components/ui/animated-segmented-tabs';
import { LoadingState } from '@/components/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { isTauriRuntime } from '@/lib/desktop';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Download01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';

import { getLatestAppDownload } from './api';
import {
  PLATFORM_OPTIONS,
  detectBrowserTarget,
  detectBrowserTargetSync,
  getDefaultTargetForPlatform,
  getTargetLabel,
  getTargetsForPlatform,
  normalizeTarget,
  sameTarget,
  targetKey,
} from './targets';

export function AppDownloadCard({
  className,
  showHeader = true,
}: {
  className?: string;
  showHeader?: boolean;
}) {
  const [recommendedTarget, setRecommendedTarget] = React.useState(() =>
    normalizeTarget(detectBrowserTargetSync()),
  );
  const [selectedTarget, setSelectedTarget] =
    React.useState(recommendedTarget);
  const [isTargetResolved, setIsTargetResolved] = React.useState(false);
  const initialTargetRef = React.useRef(recommendedTarget);
  const platformTargets = getTargetsForPlatform(selectedTarget.platform);
  const query = useQuery({
    queryKey: [
      'app-downloads',
      'latest',
      selectedTarget.platform,
      selectedTarget.arch,
    ],
    queryFn: () => getLatestAppDownload(selectedTarget),
    enabled: !isTauriRuntime() && isTargetResolved,
    retry: false,
  });

  React.useEffect(() => {
    let mounted = true;
    void detectBrowserTarget().then((detectedTarget) => {
      if (!mounted) return;
      const target = normalizeTarget(detectedTarget);
      setRecommendedTarget(target);
      setSelectedTarget((current) =>
        sameTarget(current, initialTargetRef.current) ? target : current,
      );
      setIsTargetResolved(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (isTauriRuntime()) return null;

  const download = query.data;
  const loading =
    !isTargetResolved || query.isLoading || (query.isFetching && !download);
  const isRecommended = sameTarget(selectedTarget, recommendedTarget);

  return (
    <Card id="download-client" className={cn('scroll-mt-4', className)}>
      {showHeader ? (
        <CardHeader>
          <CardTitle>下载 One Browser</CardTitle>
          <CardDescription>
            选择系统和架构，查询最新版桌面客户端安装包。
          </CardDescription>
        </CardHeader>
      ) : null}
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
          <AnimatedSegmentedTabs
            label="选择系统"
            className="max-w-full"
            listClassName="max-w-full overflow-x-auto"
            triggerClassName="px-2 text-xs"
            value={selectedTarget.platform}
            options={PLATFORM_OPTIONS.map((item) => ({
              value: item.platform,
              label: item.label,
            }))}
            onValueChange={(platform) =>
              setSelectedTarget(
                getDefaultTargetForPlatform(platform, recommendedTarget),
              )
            }
          />
          <AnimatedSegmentedTabs
            label="选择架构"
            className="ml-auto max-w-full"
            listClassName="max-w-full overflow-x-auto"
            triggerClassName="px-2 text-xs"
            value={targetKey(selectedTarget)}
            options={platformTargets.map((item) => ({
              value: targetKey(item),
              label: item.arch === 'arm64' ? 'Apple 芯片' : '64 位',
            }))}
            onValueChange={(value) => {
              const target = platformTargets.find(
                (item) => targetKey(item) === value,
              );
              if (target) setSelectedTarget(target);
            }}
          />
        </div>

        {loading ? (
          <LoadingState
            className="min-h-20 bg-transparent py-5"
            label="正在查询安装包..."
          />
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold">
                  {getTargetLabel(selectedTarget)}
                </h3>
                {isRecommended ? <Badge>推荐</Badge> : null}
              </div>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                {download?.fileName ?? '当前平台暂无可用安装包'}
              </p>
              {download ? (
                <p className="text-muted-foreground mt-1 truncate text-[0.6875rem]">
                  版本 {download.version || '-'} · {formatBytes(download.fileSize)} ·{' '}
                  <span title={formatDateTimeTitle(download.updatedAt)}>
                    {formatDisplayDateTime(download.updatedAt)}
                  </span>
                </p>
              ) : null}
            </div>
            {download ? (
              <Button asChild className="w-full sm:w-auto sm:min-w-28">
                <a href={download.url} download={download.fileName}>
                  <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
                  下载
                </a>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => void query.refetch()}
              >
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
                重新查询
              </Button>
            )}
          </div>
        )}

        {query.isError && !loading ? (
          <div className="text-destructive flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate">
              {query.error instanceof Error
                ? query.error.message
                : '安装包查询失败'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => void query.refetch()}
            >
              重试
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatBytes(value: number) {
  if (!Number.isFinite(value)) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

