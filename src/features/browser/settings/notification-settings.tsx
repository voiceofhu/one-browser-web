import { Button } from '@/components/ui/button';
import { desktopInvoke, isTauriRuntime } from '@/lib/desktop';
import { onDesktopForeground } from '@/lib/desktop/foreground';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { SettingsGroup, SettingsRow } from './settings-group';

type Permission =
  'prompt' | 'granted' | 'denied' | 'limited' | 'system' | 'unknown';

type NotificationStatus = {
  permission: Permission;
  alertsEnabled: boolean | null;
  soundEnabled: boolean | null;
};

const labels: Record<Permission, string> = {
  prompt: '尚未授权，请允许 One Browser 发送系统通知。',
  granted: '已允许系统通知，横幅和声音由系统设置控制。',
  denied: '系统通知已被禁止，请在系统设置中允许 One Browser。',
  limited: '系统仅允许静默通知，请在系统设置中开启提醒。',
  system: '通知由系统管理，可发送测试通知确认。',
  unknown: '无法确定通知权限，可发送测试通知确认。',
};

const CHECK_TIMEOUT_MS = 12_000;

function messageOf(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : String(error || fallback);
}

async function readStatus() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      desktopInvoke<NotificationStatus>('get_notification_permission'),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('通知检查超时，请重试或打开系统设置。')),
          CHECK_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export function NotificationSettings() {
  const [status, setStatus] = useState<NotificationStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const pending = useRef(false);

  // The first check relies on the initial `checking` state; later ones set it.
  const check = useCallback(() => {
    pending.current = true;
    return readStatus()
      .then(
        (next) => active.current && setStatus(next),
        (reason) =>
          active.current && setError(messageOf(reason, '读取通知权限失败')),
      )
      .finally(() => {
        pending.current = false;
        if (active.current) setChecking(false);
      });
  }, []);

  const refresh = useCallback(() => {
    if (!active.current || pending.current) return;
    setChecking(true);
    setError('');
    void check();
  }, [check]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    active.current = true;
    void check();
    // Coming back from System Settings refreshes the row.
    const stop = onDesktopForeground(refresh);
    return () => {
      active.current = false;
      stop();
    };
  }, [check, refresh]);

  if (!isTauriRuntime()) return null;

  const permission = status?.permission;

  async function allow() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const next = await desktopInvoke<NotificationStatus>(
        'request_notification_permission',
      );
      if (!active.current) return;
      setStatus(next);
      if (next.permission !== 'granted' && next.permission !== 'system') {
        await desktopInvoke('open_notification_settings');
      }
    } catch (reason) {
      if (active.current) setError(messageOf(reason, '请求通知权限失败'));
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }

  async function run(action: 'settings' | 'test') {
    setBusy(true);
    try {
      if (action === 'settings') {
        await desktopInvoke('open_notification_settings');
      } else {
        await desktopInvoke('send_system_notification', {
          title: 'One Browser',
          body: '系统通知已开启 / Notifications are enabled',
        });
        toast.success('测试通知已发送，请查看系统通知中心');
      }
    } catch (reason) {
      toast.error(messageOf(reason, '通知操作失败'));
    } finally {
      if (active.current) setBusy(false);
    }
  }

  const description = checking ? (
    '正在读取通知权限…'
  ) : error ? (
    <span className="text-destructive">{error}</span>
  ) : (
    <>
      {labels[permission ?? 'unknown']}
      {status?.alertsEnabled === false && (
        <span className="text-destructive block">
          系统设置中关闭了通知提醒，横幅不会出现。
        </span>
      )}
      {status?.soundEnabled === false && (
        <span className="text-destructive block">
          系统设置中关闭了通知声音。
        </span>
      )}
    </>
  );

  return (
    <SettingsGroup title="系统通知">
      <SettingsRow label="通知权限" description={description}>
        <div className="flex flex-wrap justify-end gap-2">
          {error && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={checking || busy}
              onClick={refresh}
            >
              重试
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || (checking && permission === 'prompt')}
            onClick={() =>
              void (permission === 'prompt' ? allow() : run('settings'))
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
              checking ||
              // A failed or unknown check still allows a real test notification.
              permission === 'denied' ||
              permission === 'prompt' ||
              status?.alertsEnabled === false
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
