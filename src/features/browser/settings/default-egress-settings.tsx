import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { RefreshButton } from '@/components/refresh-button';
import { FieldDescription } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SweepShine } from '@/components/ui/sweep-shine';
import type { AppSettings } from '@/features/browser/contracts';
import {
  useEgressLineSnapshotQuery,
  useRefreshEgressLinesMutation,
} from '@/features/browser/egress/queries';
import {
  AUTO_EGRESS_VALUE,
  MANUAL_EGRESS_PREFIX,
  chooseRecommendedLine,
  egressSelectionPatch,
  egressSelectionValue,
  isSelectableLine,
} from '@/features/browser/egress/selection';
import type {
  EgressProbeResult,
  RemoteEgressLine,
} from '@/features/browser/egress/types';
import { type Locale, translateText } from '@/i18n';
import { useI18n } from '@/i18n/provider';
import { resolveErrorState } from '@/views/error/error-state';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';

import { useUpdateSettingsMutation } from './queries';

export function DefaultEgressSettings({ settings }: { settings: AppSettings }) {
  const { locale } = useI18n();
  const snapshotQuery = useEgressLineSnapshotQuery();
  const refreshMutation = useRefreshEgressLinesMutation();
  const updateSettingsMutation = useUpdateSettingsMutation();
  const snapshot = snapshotQuery.data;
  const lines = snapshot?.lines ?? [];
  const probes = snapshot?.probes ?? [];
  const probesById = new Map(probes.map((probe) => [probe.egressId, probe]));
  const recommended = chooseRecommendedLine(lines, probes);
  const selectionValue = egressSelectionValue(settings);
  const selectedLineMissing =
    snapshotQuery.isSuccess &&
    settings.egressSelectionMode === 'manual' &&
    Boolean(settings.preferredEgressId) &&
    !lines.some((line) => line.egress_id === settings.preferredEgressId);
  const isRefreshing = snapshotQuery.isFetching || refreshMutation.isPending;
  const snapshotError = snapshotQuery.isError
    ? resolveErrorState(snapshotQuery.error)
    : null;

  function saveSelection(value: string) {
    const patch = egressSelectionPatch(value);
    if (!patch) return;

    updateSettingsMutation.mutate(patch, {
      onSuccess: () => toast.success('默认线路已更新'),
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <section className="mb-3">
        <h3 className="mb-1 text-xs font-medium">
          默认线路
        </h3>
        <p className="text-muted-foreground mb-2 text-[12px] leading-relaxed font-normal">
          仅影响新打开的浏览器环境；已运行或已绑定的环境不会自动切换，避免出口
          IP 漂移。
        </p>

        <RadioGroup
          className="bg-card divide-border gap-0 divide-y overflow-hidden rounded-sm border"
          value={selectionValue}
          onValueChange={saveSelection}
          disabled={updateSettingsMutation.isPending}
        >
          <LineChoice
            id="egress-line-auto"
            value={AUTO_EGRESS_VALUE}
            title="自动选择"
            description={recommendedDescription(
              recommended,
              probesById,
              locale,
            )}
            badge={
              <Badge
                variant="outline"
                className="bg-foreground/10 text-foreground h-auto gap-0.5 border-transparent px-1.5 py-0.5 text-[11px] font-medium [&>svg]:size-3!"
              >
                <Zap aria-hidden="true" />
                推荐
              </Badge>
            }
          />

          {lines.map((line) => (
            <LineChoice
              key={line.egress_id}
              id={`egress-line-${line.egress_id}`}
              value={`${MANUAL_EGRESS_PREFIX}${line.egress_id}`}
              title={line.display_name || line.egress_id}
              description={lineDescription(
                line,
                probesById.get(line.egress_id),
                isRefreshing,
                locale,
              )}
              detail={lineMeta(line)}
              disabled={!isSelectableLine(line)}
              badge={
                <Badge
                  variant={lineBadgeVariant(line)}
                  className="h-auto px-1.5 py-0.5 text-[11px] font-medium"
                >
                  {lineStatusText(line)}
                </Badge>
              }
            />
          ))}

          {selectedLineMissing ? (
            <LineChoice
              id="egress-line-missing"
              value={`${MANUAL_EGRESS_PREFIX}${settings.preferredEgressId}`}
              title={settings.preferredEgressId ?? '已选择线路'}
              description="该线路已不在服务器列表中；设置已保留，启动时将明确报错。"
              disabled
              badge={
                <Badge
                  variant="destructive"
                  className="h-auto px-1.5 py-0.5 text-[11px] font-medium"
                >
                  不可用
                </Badge>
              }
            />
          ) : null}
        </RadioGroup>

        {snapshotQuery.isLoading ? (
          <div
            role="status"
            aria-label="线路加载中"
            className="text-muted-foreground flex items-center justify-center px-3 py-5 text-xs"
          >
            <SweepShine>线路加载中...</SweepShine>
          </div>
        ) : null}
        {snapshotError ? (
          <Alert variant="destructive" className="mt-2 rounded-sm">
            <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
            <AlertTitle>线路：{snapshotError.title}</AlertTitle>
            <AlertDescription className="space-y-1.5">
              <p className="mb-0!">{snapshotError.description}</p>
              <p className="mb-0!">{snapshotError.hint}</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-[11px]">{snapshotError.code}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={snapshotQuery.isFetching}
                  onClick={() => void snapshotQuery.refetch()}
                >
                  {snapshotQuery.isFetching ? '读取中' : '重新读取'}
                </Button>
                <CopyButton
                  size="sm"
                  variant="ghost"
                  text={`${snapshotError.code}\n${snapshotError.title}\n${snapshotError.description}`}
                >
                  复制错误
                </CopyButton>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}
      </section>

      <div className="bg-background sticky bottom-0 -mx-3 mt-auto -mb-3 flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 md:-mx-4 md:px-4">
        <FieldDescription className="text-[12px] leading-relaxed font-normal">
          {snapshot?.testedAt
            ? localizedPrefix(
                '最近测试：',
                formatTestedAt(snapshot.testedAt, locale),
                locale,
              )
            : '尚未完成本机数据面测速'}
        </FieldDescription>
        <RefreshButton
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-[12px] font-medium"
          isRefreshing={isRefreshing}
          label={isRefreshing ? '测速中' : '重新测速'}
          onRefresh={() => refreshMutation.mutateAsync()}
          successMessage="线路测速已完成"
        />
      </div>
    </div>
  );
}

function LineChoice({
  badge,
  description,
  detail,
  disabled,
  id,
  title,
  value,
}: {
  badge: React.ReactNode;
  description: string;
  detail?: string;
  disabled?: boolean;
  id: string;
  title: string;
  value: string;
}) {
  return (
    <label
      htmlFor={id}
      data-disabled={disabled || undefined}
      data-slot="egress-line-choice"
      className="hover:bg-muted/50 grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-0.5 px-3 py-2 transition-colors data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,45%)]"
    >
      <RadioGroupItem
        id={id}
        value={value}
        disabled={disabled}
        className="row-span-2 data-checked:border-foreground data-checked:bg-foreground dark:data-checked:bg-foreground disabled:opacity-100 sm:row-span-1"
      />
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="text-foreground truncate text-[13px] font-medium" title={title}>
          {title}
        </span>
        {badge}
      </span>
      <span className="text-muted-foreground col-start-2 min-w-0 text-xs leading-relaxed font-normal break-words sm:col-start-3 sm:text-right">
        {[detail, description].filter(Boolean).join(' · ')}
      </span>
    </label>
  );
}

function recommendedDescription(
  line: RemoteEgressLine | undefined,
  probesById: Map<string, EgressProbeResult>,
  locale: Locale,
) {
  if (!line) {
    if (probesById.size > 0) {
      return '本机测速未发现可用线路；启动会明确报错，不会直连或偷换出口。';
    }
    return '按线路健康、容量和环境粘性选择';
  }
  const probe = probesById.get(line.egress_id);
  const metrics = [
    probe?.success && probe.latencyMs !== null
      ? `${translateText('本机', locale)} ${probe.latencyMs} ms`
      : null,
    loadText(line.load_percent, locale),
  ].filter(Boolean);
  return localizedPrefix(
    '当前推荐：',
    `${line.display_name || line.egress_id}${metrics.length ? ` · ${metrics.join(' · ')}` : ''}`,
    locale,
  );
}

function lineDescription(
  line: RemoteEgressLine,
  probe: EgressProbeResult | undefined,
  isRefreshing: boolean,
  locale: Locale,
) {
  const metrics = [];
  if (isRefreshing && isSelectableLine(line)) {
    metrics.push(translateText('测速中', locale));
  } else if (probe?.success && probe.latencyMs !== null) {
    metrics.push(`${translateText('本机', locale)} ${probe.latencyMs} ms`);
  } else if (probe && probe.successfulSamples > 0) {
    metrics.push(translateText('连接波动', locale));
  } else if (probe) {
    metrics.push(translateText('本机不可达', locale));
  } else if (isSelectableLine(line)) {
    metrics.push(translateText('等待本机测速', locale));
  }
  const load = loadText(line.load_percent, locale);
  if (load) metrics.push(load);
  return metrics.join(' · ') || translateText('暂无质量数据', locale);
}

function lineMeta(line: RemoteEgressLine) {
  return [line.region, line.carrier].filter(Boolean).join(' · ');
}

function loadText(loadPercent: number | null, locale: Locale) {
  if (loadPercent === null) return null;
  const label = translateText('负载', locale);
  if (loadPercent >= 80) {
    return `${label} ${loadPercent}%${localizedSuffix('（繁忙）', locale)}`;
  }
  if (loadPercent >= 60) {
    return `${label} ${loadPercent}%${localizedSuffix('（较忙）', locale)}`;
  }
  return `${label} ${loadPercent}%`;
}

function localizedPrefix(source: string, value: string, locale: Locale) {
  const separator = locale === 'en-US' ? ' ' : '';
  return `${translateText(source, locale)}${separator}${value}`;
}

function localizedSuffix(source: string, locale: Locale) {
  const separator = locale === 'en-US' ? ' ' : '';
  return `${separator}${translateText(source, locale)}`;
}

function lineStatusText(line: RemoteEgressLine) {
  if ((line.load_percent ?? 0) >= 100) return '容量已满';
  if (line.status === 'healthy') {
    return (line.load_percent ?? 0) >= 80 ? '繁忙' : '正常';
  }
  if (line.status === 'degraded') return '降级';
  if (line.status === 'draining') return '维护中';
  if (line.status === 'init') return '初始化';
  return '不可用';
}

function lineBadgeVariant(line: RemoteEgressLine) {
  if (line.status === 'healthy' && (line.load_percent ?? 0) < 80) {
    return 'success' as const;
  }
  if (line.status === 'degraded' || line.status === 'healthy') {
    return 'secondary' as const;
  }
  if (line.status === 'unhealthy') return 'destructive' as const;
  return 'outline' as const;
}

function formatTestedAt(value: string, locale: Locale) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? translateText('刚刚', locale)
    : date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
}
