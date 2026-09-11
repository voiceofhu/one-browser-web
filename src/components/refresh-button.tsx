import { Button } from '@/components/ui/button';
import { Refresh01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';
import { toast } from 'sonner';

const MINIMUM_SPIN_MS = 1100;

type RefreshButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'onClick'
> & {
  isRefreshing?: boolean;
  label?: string;
  onRefresh: () => unknown | Promise<unknown>;
  successMessage?: string;
  iconOnly?: boolean;
};

export function RefreshButton({
  isRefreshing = false,
  label = '刷新',
  onRefresh,
  successMessage = '刷新成功',
  iconOnly = false,
  disabled,
  className,
  'aria-label': ariaLabel,
  ...buttonProps
}: RefreshButtonProps) {
  const [isInteracting, setIsInteracting] = React.useState(false);
  const busy = isRefreshing || isInteracting;
  const refreshLock = React.useRef(false);

  async function refresh() {
    if (busy || refreshLock.current) return;
    refreshLock.current = true;
    const startedAt = Date.now();
    setIsInteracting(true);
    let succeeded = false;
    try {
      const result = await onRefresh();
      succeeded = !isFailedRefreshResult(result);
    } catch {
      succeeded = false;
    }

    const remaining = MINIMUM_SPIN_MS - (Date.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, remaining));
    }

    if (succeeded) {
      toast.success(successMessage);
    } else {
      toast.error('刷新失败，请稍后重试');
    }
    refreshLock.current = false;
    setIsInteracting(false);
  }

  return (
    <Button
      className={['order-last', className].filter(Boolean).join(' ')}
      type="button"
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-label={ariaLabel ?? (iconOnly ? label : undefined)}
      onClick={() => void refresh()}
      {...buttonProps}
    >
      <HugeiconsIcon
        icon={Refresh01Icon}
        strokeWidth={2}
        data-icon={iconOnly ? undefined : 'inline-start'}
        className={busy ? 'animate-spin' : undefined}
      />
      {iconOnly ? null : label}
    </Button>
  );
}

function isFailedRefreshResult(result: unknown): boolean {
  if (Array.isArray(result)) return result.some(isFailedRefreshResult);
  return (
    typeof result === 'object' &&
    result !== null &&
    (('isError' in result && result.isError === true) ||
      ('status' in result && result.status === 'rejected'))
  );
}
