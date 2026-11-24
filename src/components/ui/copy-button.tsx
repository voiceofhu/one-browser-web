import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { copyTextToClipboard } from '@/lib/clipboard';
import { CheckIcon, Copy01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

type CopyStage = 'idle' | 'copying' | 'copied';

type CopyButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'onClick'
> & {
  text?: string | null;
  getText?: () => string | Promise<string>;
  idleLabel?: string;
  copyingLabel?: string;
  copiedLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  resetDelay?: number;
  showToast?: boolean;
  children?: React.ReactNode | ((stage: CopyStage) => React.ReactNode);
};

function CopyButton({
  text,
  getText,
  idleLabel = '复制',
  copyingLabel = '正在复制...',
  copiedLabel = '已复制',
  successMessage = '已复制',
  errorMessage = '复制失败',
  resetDelay = 2000,
  showToast = true,
  children,
  disabled,
  title,
  'aria-label': ariaLabel,
  ...props
}: CopyButtonProps) {
  const [stage, setStage] = React.useState<CopyStage>('idle');
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isCopying = stage === 'copying';
  const isCopied = stage === 'copied';
  const label = isCopying ? copyingLabel : isCopied ? copiedLabel : idleLabel;
  const hasVisibleContent = children !== undefined;

  React.useEffect(() => {
    return () => {
      clearResetTimer(resetTimerRef);
    };
  }, []);

  async function copy() {
    if (isCopying) {
      return;
    }

    clearResetTimer(resetTimerRef);
    setStage('copying');

    try {
      const nextText = getText ? await getText() : text;
      if (!nextText) {
        throw new Error('copy source is empty');
      }

      await copyTextToClipboard(nextText);
      setStage('copied');
      if (showToast) {
        toast.success(successMessage);
      }
      resetTimerRef.current = setTimeout(() => {
        setStage('idle');
        resetTimerRef.current = null;
      }, resetDelay);
    } catch {
      setStage('idle');
      if (showToast) {
        toast.error(errorMessage);
      }
    }
  }

  const content = (
    <>
      {isCopying ? (
        <Spinner data-icon={hasVisibleContent ? 'inline-start' : undefined} />
      ) : (
        <HugeiconsIcon
          icon={isCopied ? CheckIcon : Copy01Icon}
          strokeWidth={2}
          data-icon={hasVisibleContent ? 'inline-start' : undefined}
        />
      )}
      {typeof children === 'function' ? children(stage) : children}
    </>
  );
  const buttonProps: React.ComponentProps<typeof Button> = {
    ...props,
    type: props.type ?? 'button',
    disabled: disabled || isCopying,
    'aria-busy': isCopying,
    'aria-label': ariaLabel ?? label,
    title: title ?? label,
    onClick: () => void copy(),
    children: content,
  };

  return <Button {...buttonProps} />;
}

function clearResetTimer(
  timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
) {
  if (!timerRef.current) {
    return;
  }

  clearTimeout(timerRef.current);
  timerRef.current = null;
}

export { CopyButton };
export type { CopyStage };
