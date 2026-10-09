import { RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SweepShine } from '@/components/ui/sweep-shine';
import * as React from 'react';

export interface UpdateAvailableNoticeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void | Promise<void>;
  title?: string;
  description?: string;
  currentVersion?: string;
  latestVersion?: string;
  updateLabel?: string;
  updatingLabel?: string;
  closeLabel?: string;
  resetUpdatingAfterUpdate?: boolean;
}

export function UpdateAvailableNotice({
  open,
  onOpenChange,
  onUpdate,
  title = '新版本已发布',
  description = '点击更新，刷新页面后即可使用新版本。',
  currentVersion,
  latestVersion,
  updateLabel = '立即更新',
  updatingLabel = '正在更新…',
  closeLabel = '稍后提醒',
  resetUpdatingAfterUpdate = false,
}: UpdateAvailableNoticeProps) {
  const [updating, setUpdating] = React.useState(false);

  async function handleUpdate() {
    setUpdating(true);
    try {
      await onUpdate?.();
    } finally {
      if (resetUpdatingAfterUpdate) {
        setUpdating(false);
      }
    }
  }

  if (!open) return null;

  return (
    <div>
      <Card
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        aria-label={title}
        className="animate-in bg-card ring-foreground/5 fade-in slide-in-from-bottom-3 relative gap-0 rounded-xl border-0 px-4 py-4 shadow-lg ring-1 duration-300 motion-reduce:animate-none"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <RefreshCwIcon
              aria-hidden="true"
              className="text-primary size-4 shrink-0"
            />
            <p className="text-base leading-6 font-semibold">{title}</p>
          </div>
          {latestVersion ? (
            <p className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm leading-5">
              {currentVersion ? <span>当前版本：{currentVersion}</span> : null}
              <span>最新版本：{latestVersion}</span>
            </p>
          ) : null}
          <p className="text-muted-foreground mt-2 text-sm leading-5">
            {description}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => void handleUpdate()}
              disabled={updating}
              aria-busy={updating || undefined}
            >
              <SweepShine
                active={updating}
                className={updating ? 'text-primary-foreground/70' : undefined}
              >
                {updating ? updatingLabel : updateLabel}
              </SweepShine>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-muted-foreground h-8 px-0 text-xs hover:bg-transparent"
              onClick={() => onOpenChange(false)}
              disabled={updating}
              aria-label={closeLabel}
            >
              {closeLabel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
