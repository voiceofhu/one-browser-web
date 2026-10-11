import { Button } from '@/components/ui/button';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { onDesktopForeground } from '@/lib/desktop/foreground';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { SettingsGroup, SettingsRow } from './settings-group';

type Permission = 'prompt' | 'granted' | 'denied' | 'system' | 'unknown';
const labels: Record<Permission, string> = {
  prompt: '尚未授权，请允许 One Browser 发送系统通知。',
  granted: '已允许发送通知，横幅和声音由系统设置控制。',
  denied: '通知已关闭，请在系统设置中允许 One Browser 发送通知。',
  system: '通知由系统管理，可发送测试通知确认。',
  unknown: '暂时无法确定通知权限，请检查系统设置。',
};

export function NotificationSettings() {
  const [permission, setPermission] = useState<Permission | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    const refresh = async () => {
      try {
        const result = await desktopInvoke<Permission>(
          'get_notification_permission',
        );
        if (active) {
          setPermission(result);
          setError('');
        }
      } catch (error) {
        if (active)
          setError(error instanceof Error ? error.message : '读取通知权限失败');
      }
    };
    void refresh();
    const stop = onDesktopForeground(() => void refresh());
    return () => {
      active = false;
      stop();
    };
  }, []);

  if (!isTauriRuntime()) return null;

  async function run(action: 'permission' | 'settings' | 'test') {
    setBusy(true);
    try {
      if (action === 'permission') {
        setPermission(
          await desktopInvoke<Permission>('request_notification_permission'),
        );
      } else if (action === 'settings') {
        await desktopInvoke('open_notification_settings');
      } else {
        await desktopInvoke('send_system_notification', {
          title: 'One Browser',
          body: '这是一条测试通知，系统通知已接通。',
        });
        toast.success('测试通知已提交，请查看系统通知中心');
      }
      setError('');
    } catch (error) {
      const message = error instanceof Error ? error.message : '通知操作失败';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsGroup title="系统通知">
      <SettingsRow
        label="通知权限"
        description={
          error || (permission ? labels[permission] : '正在读取通知权限…')
        }
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              void run(permission === 'prompt' ? 'permission' : 'settings')
            }
          >
            {permission === 'prompt' ? '允许通知' : '系统设置'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              busy ||
              !['granted', 'system'].includes(permission ?? '') ||
              Boolean(error)
            }
            onClick={() => void run('test')}
          >
            测试通知
          </Button>
        </div>
      </SettingsRow>
    </SettingsGroup>
  );
}
