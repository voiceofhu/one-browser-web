import { AppImage } from '@/components/app-image';
import { SweepShine } from '@/components/ui/sweep-shine';
import { cn } from '@/lib/utils';

export function AppLoading({
  className,
  label = '加载中...',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        'bg-background text-foreground grid min-h-svh flex-1 place-content-center justify-items-center gap-3 px-5 py-6 text-center',
        className,
      )}
    >
      <AppImage
        src="/pwa-512x512.png"
        alt="有个浏览器"
        width={88}
        height={88}
        priority
        draggable={false}
        className="size-[5.5rem] object-contain select-none"
      />
      <h1 className="text-base font-semibold">One Browser</h1>
      <SweepShine className="text-muted-foreground text-sm">
        {label}
      </SweepShine>
    </div>
  );
}
