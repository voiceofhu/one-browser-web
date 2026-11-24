import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type {
  ProxyCheckResult,
  ProxyConfig,
  ProxyListItem,
} from '@/features/browser/contracts';
import { cn } from '@/lib/utils';
import { Copy01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { toast } from '@/components/ui/toast';

import { CountryFlag } from '../../components/country-flag';
import { ProxyStatusBadge } from '../../components/status-badge';
import {
  type CopyStage,
  latencyToneClass,
  proxyAddress,
  proxyLocation,
} from '../model/proxy-table';

export function ProxyAddressCell({
  canEdit,
  proxy,
  onEdit,
  onResolveCopyProxy,
  onCopyProxyText,
}: {
  canEdit: boolean;
  proxy: ProxyListItem;
  onEdit: (proxyId: string) => void;
  onResolveCopyProxy: (proxyId: string) => Promise<ProxyConfig>;
  onCopyProxyText: (text: string) => Promise<void>;
}) {
  const location = proxyLocation(proxy);
  const url = proxyAddress(proxy);
  const [copyStage, setCopyStage] = useState<CopyStage>('idle');

  const isCopyPending = copyStage !== 'idle';
  const copyLabel = copyButtonLabel(copyStage);

  async function requestCopyProxyUrl() {
    if (isCopyPending) {
      return;
    }

    setCopyStage('loading');

    let source: ProxyConfig;

    try {
      source = await onResolveCopyProxy(proxy.proxyId);
    } catch {
      toast.error('读取代理密码失败');
      setCopyStage('idle');
      return;
    }

    setCopyStage('copying');

    try {
      await onCopyProxyText(proxyAddress(source));
      toast.success('已复制代理 URL');
    } catch {
      toast.error('复制失败');
    } finally {
      setCopyStage('idle');
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex min-w-0 items-center">
        {canEdit ? (
          <button
            type="button"
            className="focus-visible:ring-ring/30 min-w-0 truncate text-left font-medium underline-offset-4 group-hover/row:underline hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            title="编辑代理"
            onClick={() => onEdit(proxy.proxyId)}
          >
            {url}
          </button>
        ) : (
          <span className="min-w-0 truncate font-medium" title={url}>
            {url}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            'transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100',
            isCopyPending ? 'opacity-100' : 'opacity-0',
          )}
          aria-busy={isCopyPending}
          aria-label={copyLabel}
          title={copyLabel}
          disabled={isCopyPending}
          onClick={() => void requestCopyProxyUrl()}
        >
          {isCopyPending ? (
            <Spinner className="size-3" />
          ) : (
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
          )}
        </Button>
      </div>
      <div className="text-muted-foreground flex min-w-0 items-center gap-2">
        <CountryFlag code={location.code} />
        <span className="truncate" title={location.title}>
          {location.detail}
        </span>
        {location.latencyLabel && location.latencyTone ? (
          <>
            <span
              aria-hidden="true"
              className="text-muted-foreground/70 shrink-0"
            >
              ·
            </span>
            <span
              className={cn(
                'shrink-0 font-medium tabular-nums',
                latencyToneClass[location.latencyTone],
              )}
            >
              {location.latencyLabel}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function copyButtonLabel(stage: CopyStage) {
  if (stage === 'loading') {
    return '正在获取代理 URL';
  }

  if (stage === 'copying') {
    return '正在复制代理 URL';
  }

  return '复制代理 URL';
}

export function NoteCell({
  canEdit,
  proxy,
  isSaving,
  onSave,
}: {
  canEdit: boolean;
  proxy: ProxyListItem;
  isSaving?: boolean;
  onSave: (proxyId: string, remark: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(proxy.remark);
  const [localSaving, setLocalSaving] = useState(false);
  const trimmedDraft = draft.trim();
  const savedRemark = proxy.remark.trim();
  const unchanged = trimmedDraft === savedRemark;
  const saving = Boolean(isSaving || localSaving);

  if (!canEdit) {
    return (
      <span
        className={cn(
          'text-muted-foreground max-w-40 truncate',
          !proxy.remark && 'italic',
        )}
        title={proxy.remark || '无备注'}
      >
        {proxy.remark || '无备注'}
      </span>
    );
  }

  function cancelEditing() {
    setDraft(proxy.remark);
    setIsEditing(false);
  }

  async function saveRemark() {
    if (unchanged || saving) {
      return;
    }
    setLocalSaving(true);
    try {
      await onSave(proxy.proxyId, trimmedDraft);
      setIsEditing(false);
    } finally {
      setLocalSaving(false);
    }
  }

  return (
    <Popover
      open={isEditing}
      onOpenChange={(open) => {
        if (open) {
          setDraft(proxy.remark);
          setIsEditing(true);
          return;
        }

        if (!saving) {
          cancelEditing();
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'text-muted-foreground hover:text-foreground focus-visible:ring-ring/30 max-w-40 truncate text-left focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none',
            !proxy.remark && 'italic',
          )}
          title={proxy.remark || '无备注'}
        >
          {proxy.remark || '无备注'}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        className="w-80 max-w-[calc(100vw-2rem)] gap-3 p-3"
      >
        <Textarea
          autoFocus
          value={draft}
          placeholder="无备注"
          className="h-24 min-h-24 resize-none text-sm"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              cancelEditing();
            }
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              void saveRemark();
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={cancelEditing}>
            取消
          </Button>
          <Button
            type="button"
            disabled={unchanged || saving}
            onClick={() => void saveRemark()}
          >
            {saving ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ProxyStatusCell({ result }: { result: ProxyCheckResult }) {
  if (result.status === 'unchecked') {
    return <span className="text-muted-foreground italic">未检测</span>;
  }

  const detail =
    result.message && result.message !== 'ok' ? result.message : null;

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <ProxyStatusBadge status={result.status} />
      {detail ? (
        <span className="text-muted-foreground max-w-40 truncate text-xs">
          {detail}
        </span>
      ) : null}
    </div>
  );
}

export function ProxyEnabledSwitch({
  proxy,
  canUpdate,
  isUpdating,
  onChange,
}: {
  proxy: ProxyListItem;
  canUpdate: boolean;
  isUpdating: boolean;
  onChange: (proxyId: string, enabled: boolean) => void;
}) {
  return (
    <Switch
      size="sm"
      checked={proxy.enabled}
      disabled={!canUpdate || isUpdating}
      aria-label={`${proxy.name}代理状态`}
      onCheckedChange={(enabled) => onChange(proxy.proxyId, enabled)}
    />
  );
}
