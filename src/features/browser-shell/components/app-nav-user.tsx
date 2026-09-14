import { ThemeModeToggle } from '@/components/theme/theme-mode-toggle';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialogActionButton,
  AlertDialogCancelButton,
} from '@/components/ui/dialog-action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DefaultUserAvatar,
  getDefaultUserAvatarSeed,
} from '@/features/account/avatar';
import { openOneUserPasswordPage } from '@/features/account/one-user-account';
import type { CurrentUser } from '@/features/auth/types';
import { type Locale } from '@/i18n';
import { useI18n } from '@/i18n/provider';
import { reloadClient } from '@/lib/desktop/reload-client';
import { useDesktopAppGate } from '@/lib/desktop/app-gate';
import {
  EllipsisVerticalIcon,
  LanguageCircleIcon,
  Logout03Icon,
  PaintBrush01Icon,
  Refresh01Icon,
  Settings02Icon,
  Shield01Icon,
  UserAdd01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from 'react-router-dom';
import * as React from 'react';
import { toast } from 'sonner';

const SettingsDialog = React.lazy(() =>
  import('@/features/browser/settings/page').then((module) => ({
    default: module.SettingsDialog,
  })),
);

const accountMenuItems = [
  {
    label: '个人信息',
    href: '/account/profile',
    icon: UserIcon,
  },
  {
    label: '修改密码',
    href: 'one-user-password',
    icon: Shield01Icon,
    external: true,
  },
  {
    label: '邀请好友',
    href: '/account/invite',
    icon: UserAdd01Icon,
    external: false,
  },
] as const;

export function AppNavUser({
  isLoggingOut,
  onLogout,
  onSwitchAccount,
  user,
}: {
  isLoggingOut?: boolean;
  onLogout: () => void;
  onSwitchAccount: () => void;
  user: CurrentUser;
}) {
  const { isMobile } = useSidebar();
  const { locale, setLocale } = useI18n();
  const { requireDesktopApp } = useDesktopAppGate();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const displayName = user.nick_name || user.user_name || '未登录';
  const email = user.email || '未绑定邮箱';
  const avatar = user.avatar || '';
  const avatarSeed = getDefaultUserAvatarSeed(
    user.user_id,
    user.email,
    user.user_name,
    displayName,
  );

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-10 gap-2 px-2 py-1">
                <UserAvatar
                  avatar={avatar}
                  avatarSeed={avatarSeed}
                  displayName={displayName}
                  size="sm"
                />
                <div className="grid min-w-0 flex-1 gap-0.5 text-left leading-none">
                  <span
                    className="block truncate text-xs leading-4 font-medium"
                    title={displayName}
                  >
                    {displayName}
                  </span>
                  <span
                    className="text-muted-foreground block truncate text-[0.625rem] leading-3"
                    title={email}
                  >
                    {email}
                  </span>
                </div>
                <HugeiconsIcon
                  icon={EllipsisVerticalIcon}
                  strokeWidth={2}
                  className="size-3.5 shrink-0"
                />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-64"
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>账户</DropdownMenuLabel>
                {accountMenuItems.map((item) =>
                  'external' in item && item.external ? (
                    <DropdownMenuItem
                      key={item.href}
                      onSelect={(event) => {
                        event.preventDefault();
                        setMenuOpen(false);
                        void openOneUserPasswordPage().catch((error) =>
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : '无法打开 One User 修改密码页面',
                          ),
                        );
                      }}
                    >
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      {item.label}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link to={item.href}>
                        <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>偏好设置</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setMenuOpen(false);
                    if (
                      !requireDesktopApp({
                        title: '在 App 中打开客户端设置',
                        description:
                          '客户端设置会修改本机浏览器、节点与系统能力，请在 One Browser App 中继续。',
                      })
                    ) {
                      return;
                    }
                    setSettingsOpen(true);
                  }}
                >
                  <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
                  设置
                </DropdownMenuItem>
                <div className="flex min-h-6 items-center gap-2 rounded-md px-2 py-0.5 text-xs/relaxed">
                  <HugeiconsIcon
                    icon={PaintBrush01Icon}
                    strokeWidth={2}
                    className="size-3.5 shrink-0"
                  />
                  <span>主题</span>
                  <ThemeModeToggle className="ml-auto" />
                </div>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <HugeiconsIcon icon={LanguageCircleIcon} strokeWidth={2} />
                    <span className="min-w-0 flex-1">语言</span>
                    <span className="text-muted-foreground">
                      {locale === 'zh-CN' ? '简体中文' : 'English'}
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={locale}
                      onValueChange={(value) => {
                        setLocale(value as Locale);
                        setMenuOpen(false);
                      }}
                    >
                      <DropdownMenuRadioItem value="zh-CN">
                        简体中文
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="en-US">
                        English
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setMenuOpen(false);
                    if (
                      requireDesktopApp({
                        title: '在 App 中重载客户端',
                        description:
                          '重载客户端需要 One Browser App 的本机运行环境。',
                      })
                    ) {
                      reloadClient();
                    }
                  }}
                >
                  <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
                  重载客户端
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={isLoggingOut}
                  onSelect={onSwitchAccount}
                >
                  <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
                  切换账号
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isLoggingOut}
                  onSelect={() => setConfirmOpen(true)}
                >
                  <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
                  退出当前应用
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {settingsOpen ? (
        <React.Suspense fallback={null}>
          <SettingsDialog open onOpenChange={setSettingsOpen} />
        </React.Suspense>
      ) : null}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isLoggingOut) {
            setConfirmOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>退出当前应用？</AlertDialogTitle>
            <AlertDialogDescription>
              退出 One Browser 后，One User 和其他应用将保持登录。再次登录时可选择账号。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton disabled={isLoggingOut} />
            <AlertDialogActionButton
              variant="destructive"
              disabled={isLoggingOut}
              loading={isLoggingOut}
              loadingText="退出中..."
              onClick={(event) => {
                event.preventDefault();
                onLogout();
              }}
            >
              确认退出
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function UserAvatar({
  avatar,
  avatarSeed,
  displayName,
  size = 'default',
}: {
  avatar: string;
  avatarSeed: string;
  displayName: string;
  size?: 'default' | 'sm' | 'lg';
}) {
  return (
    <Avatar className="rounded-full" size={size}>
      <AvatarImage
        src={avatar || undefined}
        alt={displayName}
        className="rounded-full"
      />
      <AvatarFallback className="overflow-hidden rounded-full p-0">
        <DefaultUserAvatar seed={avatarSeed} />
      </AvatarFallback>
    </Avatar>
  );
}
