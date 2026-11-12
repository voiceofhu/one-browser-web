import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Moon02Icon, Sun02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { type MouseEvent } from 'react';

import { useTheme } from './runtime';
import {
  type ThemeName,
  applyThemeToRoot,
  getDomTheme,
  resolveThemeName,
} from './shared';

type ViewTransition = {
  ready: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => ViewTransition;
};

type ThemeToggleButtonProps = {
  className?: string;
  label?: string;
  size?: 'icon-sm' | 'icon' | 'icon-lg';
};

const THEME_TOGGLE_VIEW_TRANSITION_CSS = `
  @supports (view-transition-name: none) {
    :root {
      view-transition-name: root;
    }

    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none;
      mix-blend-mode: normal;
    }

    ::view-transition-old(root) {
      z-index: 1;
    }

    ::view-transition-new(root) {
      z-index: 9999;
    }

    [data-theme-switching='dark']::view-transition-old(root) {
      z-index: 9999;
    }

    [data-theme-switching='dark']::view-transition-new(root) {
      z-index: 1;
    }
  }
`;

function ThemeToggleViewTransitionStyles() {
  return <style>{THEME_TOGGLE_VIEW_TRANSITION_CSS}</style>;
}

export function ThemeToggleButton({
  className,
  label = '切换主题',
  size = 'icon-sm',
}: ThemeToggleButtonProps) {
  const { resolvedTheme, setTheme } = useTheme();

  function updateTheme(nextTheme: ThemeName) {
    applyThemeToRoot(nextTheme);
    setTheme(nextTheme);
  }

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    const currentTheme = resolveThemeName(resolvedTheme) || getDomTheme();
    const nextTheme: ThemeName = currentTheme === 'dark' ? 'light' : 'dark';
    const transitionDocument = document as DocumentWithViewTransition;
    const supportsTransition =
      typeof transitionDocument.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!supportsTransition) {
      updateTheme(nextTheme);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    if (nextTheme === 'dark') {
      document.documentElement.dataset.themeSwitching = 'dark';
    } else {
      delete document.documentElement.dataset.themeSwitching;
    }

    const transition = transitionDocument.startViewTransition(() => {
      updateTheme(nextTheme);
    });

    void transition.ready
      .then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];

        document.documentElement.animate(
          {
            clipPath: nextTheme === 'dark' ? [...clipPath].reverse() : clipPath,
          },
          {
            duration: 500,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards',
            pseudoElement:
              nextTheme === 'dark'
                ? '::view-transition-old(root)'
                : '::view-transition-new(root)',
          },
        );
      })
      .catch(() => {
        delete document.documentElement.dataset.themeSwitching;
      });

    window.setTimeout(() => {
      delete document.documentElement.dataset.themeSwitching;
    }, 550);
  }

  return (
    <>
      <ThemeToggleViewTransitionStyles />
      <Button
        aria-label={label}
        className={cn(
          'border-border/60 bg-muted text-foreground hover:bg-muted dark:bg-muted dark:hover:bg-muted shrink-0 shadow-none',
          className,
        )}
        onClick={handleToggle}
        size={size}
        title={label}
        variant="outline"
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={Moon02Icon}
          strokeWidth={2}
          className="dark:hidden"
        />
        <HugeiconsIcon
          aria-hidden="true"
          icon={Sun02Icon}
          strokeWidth={2}
          className="hidden dark:block"
        />
      </Button>
    </>
  );
}
