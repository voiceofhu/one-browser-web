import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  ApiIcon,
  BrowserIcon,
  Link04Icon,
  PaintBoardIcon,
  Refresh01Icon,
  Route01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { CSSProperties, ComponentProps, ReactNode } from 'react';

export type SettingsSectionId =
  | 'general'
  | 'egress'
  | 'pre-proxy'
  | 'appearance'
  | 'local-api'
  | 'client';

type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  icon: ComponentProps<typeof HugeiconsIcon>['icon'];
};

const sections: SettingsSection[] = [
  {
    id: 'general',
    label: '常规',
    icon: BrowserIcon,
  },
  {
    id: 'egress',
    label: '线路',
    icon: Route01Icon,
  },
  {
    id: 'pre-proxy',
    label: '前置代理',
    icon: Link04Icon,
  },
  {
    id: 'appearance',
    label: '外观与语言',
    icon: PaintBoardIcon,
  },
  {
    id: 'local-api',
    label: '本地 API',
    icon: ApiIcon,
  },
  {
    id: 'client',
    label: '客户端',
    icon: Refresh01Icon,
  },
];

export function SettingsWorkspace({
  children,
  onSectionChange,
  section,
}: {
  children: ReactNode;
  onSectionChange: (section: SettingsSectionId) => void;
  section: SettingsSectionId;
}) {
  const activeSection =
    sections.find((candidate) => candidate.id === section) ?? sections[0];

  return (
    <SidebarProvider
      className="h-full min-h-0 items-stretch overflow-hidden"
      style={{ '--sidebar-width': '152px' } as CSSProperties}
    >
      <Sidebar
        collapsible="none"
        className="hidden border-r border-sidebar-border md:flex"
      >
        <SidebarHeader className="h-10 justify-center border-b px-3 py-0">
          <span className="font-heading text-[12px] font-semibold">设置</span>
        </SidebarHeader>
        <SidebarContent className="px-1.5 py-1.5">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {sections.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      className="h-8 rounded-sm px-2 text-xs font-normal data-active:font-medium"
                      isActive={item.id === activeSection.id}
                      onClick={() => onSectionChange(item.id)}
                    >
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-10 shrink-0 items-center border-b px-3 pr-12 md:px-4">
          <h2 className="font-heading text-[13px] font-semibold">
            {activeSection.label}
          </h2>
        </header>
        <div className="shrink-0 border-b px-3 py-1.5 md:hidden">
          <Select
            value={activeSection.id}
            onValueChange={(value) =>
              onSectionChange(value as SettingsSectionId)
            }
          >
            <SelectTrigger className="h-8 w-full rounded-sm shadow-none" aria-label="设置分类">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectGroup>
                {sections.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 py-3 [scrollbar-gutter:stable] md:px-4">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
