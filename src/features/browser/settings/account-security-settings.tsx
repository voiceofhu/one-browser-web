import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialogActionButton,
  AlertDialogCancelButton,
} from '@/components/ui/dialog-action-button';
import { FieldGroup } from '@/components/ui/field';
import { openOneUserPasswordPage } from '@/features/account/one-user-account';
import { useAuth } from '@/features/auth/auth-gate';
import { useLogout } from '@/features/auth/use-logout';
import {
  ArrowUpRight01Icon,
  Logout03Icon,
  UserSwitchIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { SettingsDivider, SettingsGroup, SettingsRow } from './settings-group';

const actionButtonClass = 'min-w-24 px-2.5 text-[12px] font-medium';

export function AccountSecuritySettings() {
  const { user } = useAuth();
  const { isLoggingOut, logout, switchAccount } = useLogout();
  const identity = user.email || user.user_name || '当前账号';

  return (
    <FieldGroup className="gap-3">
      <SettingsGroup title="登录凭据">
        <SettingsRow
          label="登录密码"
          description="在 One User 修改，修改后所有 One 应用一起生效"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={actionButtonClass}
            onClick={() =>
              void openOneUserPasswordPage().catch((error) =>
                toast.error(
                  error instanceof Error
                    ? error.message
                    : '无法打开 One User 修改密码页面',
                ),
              )
            }
          >
            前往修改
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              strokeWidth={2}
              data-icon="inline-end"
            />
          </Button>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="当前登录">
        <SettingsRow
          label="切换账号"
          description={`当前为 ${identity}，切换后需要重新选择 One User 账号`}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={actionButtonClass}
            disabled={isLoggingOut}
            onClick={switchAccount}
          >
            <HugeiconsIcon
              icon={UserSwitchIcon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            切换账号
          </Button>
        </SettingsRow>

        <SettingsDivider />

        <SettingsRow
          label="退出登录"
          description="只退出 One Browser，One User 和其他应用保持登录"
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`${actionButtonClass} text-destructive hover:text-destructive`}
                disabled={isLoggingOut}
              >
                <HugeiconsIcon
                  icon={Logout03Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                退出登录
              </Button>
            </AlertDialogTrigger>
            <LogoutConfirmContent
              isLoggingOut={isLoggingOut}
              onConfirm={logout}
            />
          </AlertDialog>
        </SettingsRow>
      </SettingsGroup>
    </FieldGroup>
  );
}

/** Shared by the settings page and the sidebar user menu. */
export function LogoutConfirmContent({
  isLoggingOut,
  onConfirm,
}: {
  isLoggingOut: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia>
          <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
        </AlertDialogMedia>
        <AlertDialogTitle>退出登录？</AlertDialogTitle>
        <AlertDialogDescription>
          只退出 One Browser，One User
          和其他应用保持登录。再次登录时可选择账号。
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
            onConfirm();
          }}
        >
          确认退出
        </AlertDialogActionButton>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
