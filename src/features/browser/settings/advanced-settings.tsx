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
import { desktopInvoke } from '@/lib/desktop';
import { reloadClient } from '@/lib/desktop/reload-client';
import { FileViewIcon, Refresh01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SettingsDivider, SettingsGroup, SettingsRow } from './settings-group';
import { NotificationSettings } from './notification-settings';

export function AdvancedSettings() {
  const [openingLog, setOpeningLog] = useState(false);

  async function openSystemLog() {
    if (openingLog) {
      return;
    }

    setOpeningLog(true);
    try {
      await desktopInvoke<void>('open_system_log');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '打开系统日志失败');
    } finally {
      setOpeningLog(false);
    }
  }

  return (
    <FieldGroup className="gap-3">
      <NotificationSettings />
      <SettingsGroup title="诊断与维护">
        <SettingsRow
          label="系统日志"
          description="打开当前用户的 One Browser 日志目录"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-24 px-2.5 text-[12px] font-medium"
            onClick={() => void openSystemLog()}
            disabled={openingLog}
          >
            <HugeiconsIcon
              icon={FileViewIcon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            {openingLog ? '打开中' : '查看详细'}
          </Button>
        </SettingsRow>

        <SettingsDivider />

        <SettingsRow
          label="重载客户端"
          description="重新加载界面并恢复本地状态，不会关闭正在运行的浏览器环境"
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-24 px-2.5 text-[12px] font-medium"
              >
                <HugeiconsIcon
                  icon={Refresh01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                重新加载
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
                </AlertDialogMedia>
                <AlertDialogTitle>确认重载客户端？</AlertDialogTitle>
                <AlertDialogDescription>
                  当前界面会立即重新加载，正在运行的浏览器环境不受影响。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancelButton />
                <AlertDialogActionButton onClick={reloadClient}>
                  立即重载
                </AlertDialogActionButton>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingsRow>
      </SettingsGroup>
    </FieldGroup>
  );
}
