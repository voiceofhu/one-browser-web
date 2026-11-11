import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRouter } from '@/router/compat';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import {
  type SettingsNavGroup,
  type SettingsSection,
  settingsPath,
} from './settings-sections';

/**
 * One settings surface for account, app and device settings: a grouped nav on
 * the left (a select on narrow screens) and the active section on the right.
 * The section lives in the URL, so every section can be linked to.
 */
export function SettingsWorkspace({
  children,
  groups,
  section,
}: {
  children: ReactNode;
  groups: SettingsNavGroup[];
  section: SettingsSection;
}) {
  const router = useRouter();

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <nav
        aria-label="设置分类"
        className="bg-sidebar hidden w-44 shrink-0 flex-col gap-3 overflow-y-auto border-r px-2 py-3 md:flex"
      >
        <h1 className="font-heading px-2 text-sm font-semibold">设置</h1>
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            <div className="text-muted-foreground px-2 pb-0.5 text-[0.6875rem] font-semibold">
              {group.title}
            </div>
            {group.sections.map((item) => {
              const active = item.id === section.id;
              return (
                <Link
                  key={item.id}
                  to={settingsPath(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'text-sidebar-foreground hover:bg-sidebar-accent focus-visible:ring-ring flex h-7 items-center gap-2 rounded-sm px-2 text-[0.8125rem] outline-none focus-visible:ring-2 [&_svg]:size-4 [&_svg]:shrink-0',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-primary font-medium'
                      : '[&_svg]:text-muted-foreground',
                  )}
                >
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-b px-3 py-2 md:hidden">
        <Select
          value={section.id}
          onValueChange={(value) =>
            router.push(settingsPath(value as SettingsSection['id']))
          }
        >
          <SelectTrigger
            className="h-11 w-full rounded-sm shadow-none"
            aria-label="设置分类"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            {groups.map((group) => (
              <SelectGroup key={group.title}>
                <SelectLabel>{group.title}</SelectLabel>
                {group.sections.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <main className="min-h-0 min-w-0 flex-1 touch-pan-y [scrollbar-gutter:stable] overflow-y-auto overscroll-y-contain">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-4 px-3 py-4 md:px-6 md:py-5">
          <header className="flex flex-col gap-1">
            <h2 className="font-heading text-base font-semibold">
              {section.label}
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {section.description}
            </p>
          </header>
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </main>
    </div>
  );
}
