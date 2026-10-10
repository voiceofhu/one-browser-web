import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import * as React from 'react';

// Sub-parts must follow the root's Drawer/Dialog choice; mixing them renders a
// Radix part outside its root (`DialogPortal` must be used within `Dialog`).
const ResponsiveDialogMobileContext = React.createContext<boolean | null>(null);

function useResponsiveDialogIsMobile() {
  const fromRoot = React.useContext(ResponsiveDialogMobileContext);
  const fromViewport = useIsMobile();
  return fromRoot ?? fromViewport;
}

type ResponsiveDialogProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ResponsiveDialog({
  children,
  open,
  onOpenChange,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveDialogMobileContext.Provider value={isMobile}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      )}
    </ResponsiveDialogMobileContext.Provider>
  );
}

export function ResponsiveDialogTrigger({
  children,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useResponsiveDialogIsMobile();

  if (isMobile) {
    return <DrawerTrigger {...props}>{children}</DrawerTrigger>;
  }

  return <DialogTrigger {...props}>{children}</DialogTrigger>;
}

export function ResponsiveDialogContent({
  className,
  children,
}: React.ComponentProps<'div'>) {
  const isMobile = useResponsiveDialogIsMobile();

  if (isMobile) {
    return (
      <DrawerContent
        className={cn(
          'gap-0 overflow-hidden rounded-t-[var(--dialog-radius)] border border-border/70 bg-popover p-0 before:hidden data-[vaul-drawer-direction=bottom]:max-h-[90dvh] [&>div:first-child]:mt-3',
          className,
        )}
      >
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent
      className={cn(
        'flex max-h-[min(90vh,44rem)] flex-col gap-0 overflow-hidden rounded-[var(--dialog-radius)] p-0 ring-foreground/10 sm:max-w-2xl',
        className,
      )}
    >
      {children}
    </DialogContent>
  );
}

export function ResponsiveDialogHeader({
  className,
  children,
}: React.ComponentProps<'div'>) {
  const isMobile = useResponsiveDialogIsMobile();

  if (isMobile) {
    return (
      <DrawerHeader
        className={cn(
          'shrink-0 gap-0.5 bg-muted/50 px-4 py-2 pr-12 text-left',
          className,
          'border-b-0',
        )}
      >
        {children}
      </DrawerHeader>
    );
  }

  return (
    <DialogHeader
      className={cn(
        'shrink-0 gap-0.5 bg-muted/50 px-4 py-2 pr-12',
        className,
        'border-b-0',
      )}
    >
      {children}
    </DialogHeader>
  );
}

export function ResponsiveDialogTitle({
  className,
  children,
}: React.ComponentProps<'h2'>) {
  const isMobile = useResponsiveDialogIsMobile();

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

export function ResponsiveDialogDescription({
  className,
  children,
}: React.ComponentProps<'p'>) {
  const isMobile = useResponsiveDialogIsMobile();

  if (isMobile) {
    return (
      <DrawerDescription className={className}>{children}</DrawerDescription>
    );
  }

  return (
    <DialogDescription className={className}>{children}</DialogDescription>
  );
}

export function ResponsiveDialogBody({
  className,
  children,
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-3', className)}>
      {children}
    </div>
  );
}

export function ResponsiveDialogFooter({
  className,
  children,
}: React.ComponentProps<'div'>) {
  const isMobile = useResponsiveDialogIsMobile();

  if (isMobile) {
    return (
      <DrawerFooter
        className={cn(
          'shrink-0 bg-muted/50 px-4 py-2',
          className,
          'border-t-0',
        )}
      >
        {children}
      </DrawerFooter>
    );
  }

  return (
    <DialogFooter
      className={cn('shrink-0 bg-muted/50 px-4 py-2', className, 'border-t-0')}
    >
      {children}
    </DialogFooter>
  );
}

export function ResponsiveDialogClose(
  props: React.ComponentProps<typeof DialogClose>,
) {
  const isMobile = useResponsiveDialogIsMobile();
  return isMobile ? <DrawerClose {...props} /> : <DialogClose {...props} />;
}
