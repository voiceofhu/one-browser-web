import { Skeleton } from '@/components/ui/skeleton';
import { TARGET_OPTIONS } from '@/features/app-download/targets';
import { formatDateTimeTitle, formatDisplayDateTime } from '@/lib/date-time';
import { cn } from '@/lib/utils';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { formatBytes } from '../model/upload-form';
import type { BrowserAssetResource } from '../types';

type Release = {
  key: string;
  label: string;
  asset?: BrowserAssetResource;
};

/**
 * What clients download right now: one tile per platform and architecture,
 * so a target without a current version stands out before anyone hits it.
 */
export function CurrentReleases({
  assets,
  isLoading,
}: {
  assets: BrowserAssetResource[];
  isLoading: boolean;
}) {
  const releases = buildReleases(assets);

  return (
    <section
      aria-label="当前发布"
      className="grid shrink-0 gap-2 border-b px-3 py-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {releases.map((release) =>
        isLoading ? (
          <Skeleton key={release.key} className="h-[4.5rem] rounded-lg" />
        ) : (
          <ReleaseTile key={release.key} release={release} />
        ),
      )}
    </section>
  );
}

function ReleaseTile({ release }: { release: Release }) {
  const { asset } = release;
  const updatedAt = asset ? asset.updated_at || asset.created_at : null;

  return (
    <div
      className={cn(
        'bg-card flex min-w-0 flex-col gap-1 rounded-lg border px-3 py-2.5',
        !asset && 'border-dashed',
      )}
    >
      <div className="flex items-center gap-1.5">
        {asset ? (
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            strokeWidth={2}
            className="text-primary size-3.5 shrink-0"
          />
        ) : null}
        <span className="text-muted-foreground truncate text-xs font-medium">
          {release.label}
        </span>
      </div>
      {asset ? (
        <>
          <span
            className="truncate text-base font-semibold tracking-tight tabular-nums"
            title={asset.file_name}
          >
            {asset.version || asset.file_name}
          </span>
          <span
            className="text-muted-foreground truncate text-[0.6875rem]"
            title={updatedAt ? formatDateTimeTitle(updatedAt) : undefined}
          >
            {formatBytes(asset.file_size)}
            {updatedAt ? ` · ${formatDisplayDateTime(updatedAt)}` : ''}
          </span>
        </>
      ) : (
        <>
          <span className="text-muted-foreground text-base font-semibold">
            未发布
          </span>
          <span className="text-muted-foreground text-[0.6875rem]">
            客户端在此平台暂无可下载的版本
          </span>
        </>
      )}
    </div>
  );
}

function buildReleases(assets: BrowserAssetResource[]): Release[] {
  const known = new Set(TARGET_OPTIONS.map(targetKey));
  const releases: Release[] = TARGET_OPTIONS.map((target) => ({
    key: targetKey(target),
    label: target.label,
    asset: assets.find((asset) => targetKey(asset) === targetKey(target)),
  }));
  for (const asset of assets) {
    const key = targetKey(asset);
    if (!known.has(key)) {
      known.add(key);
      releases.push({ key, label: `${asset.platform} ${asset.arch}`, asset });
    }
  }
  return releases;
}

function targetKey(target: { platform: string; arch: string }) {
  return `${target.platform}:${target.arch}`;
}
