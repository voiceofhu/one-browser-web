import { ThemeModeToggle } from '@/components/theme/theme-mode-toggle';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
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
import type { CurrentUser } from '@/features/auth/types';
import { useLogout } from '@/features/auth/use-logout';
import { LogoutConfirmContent } from '@/features/browser/settings/account-security-settings';
import {
  type SettingsSectionId,
  settingsPath,
} from '@/features/browser/settings/settings-sections';
import { settingsShortcutLabel } from '@/features/browser-shell/use-settings-shortcut';
import { isTauriRuntime } from '@/lib/desktop';
import {
  Logout03Icon,
  PaintBrush01Icon,
  Settings02Icon,
  UnfoldMoreIcon,
  UserAdd01Icon,
  UserIcon,
  UserSwitchIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';
import { Link } from 'react-router-dom';

type UserMenuItem = {
  label: string;
  section: SettingsSectionId;
  icon: typeof UserIcon;
};

const userMenuItems: UserMenuItem[] = [
  { label: '个人信息', section: 'profile', icon: UserIcon },
  { label: '邀请好友', section: 'invite', icon: UserAdd01Icon },
];

/**
 * Sidebar footer identity: who is signed in, the way into settings, and the
 * session actions. Everything else lives on the settings page.
 */
export function AppNavUser({ user }: { user: CurrentUser }) {
  const { isMobile } = useSidebar();
  const { isLoggingOut, logout, switchAccount } = useLogout();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const isDesktop = isTauriRuntime();
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                aria-label={`账户菜单：${displayName}`}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-11 gap-2 px-2 py-1 md:h-10"
              >
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
                  icon={UnfoldMoreIcon}
                  strokeWidth={2}
                  className="size-3.5 shrink-0"
                />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56"
              side={isMobile ? 'top' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                {userMenuItems.map((item) => (
                  <DropdownMenuItem key={item.section} asChild>
                    <Link to={settingsPath(item.section)}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link to={settingsPath()}>
                    <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
                    设置
                    {isDesktop ? (
                      <DropdownMenuShortcut>
                        {settingsShortcutLabel}
                      </DropdownMenuShortcut>
                    ) : null}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <div className="flex min-h-6 items-center gap-2 rounded-md px-2 py-0.5 text-xs/relaxed">
                <HugeiconsIcon
                  icon={PaintBrush01Icon}
                  strokeWidth={2}
                  className="size-3.5 shrink-0"
                />
                <span>主题</span>
                <ThemeModeToggle className="ml-auto" />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={isLoggingOut}
                  onSelect={switchAccount}
                >
                  <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2} />
                  切换账号
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isLoggingOut}
                  onSelect={() => setConfirmOpen(true)}
                >
                  <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isLoggingOut) {
            setConfirmOpen(open);
          }
        }}
      >
        <LogoutConfirmContent isLoggingOut={isLoggingOut} onConfirm={logout} />
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
