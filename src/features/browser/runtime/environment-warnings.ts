import { toast } from '@/components/ui/toast';

const environmentWarningMessages: Record<string, string> = {
  network_location_unavailable: '未取得有效出口 IP，无法确认网络环境',
  time_zone_unavailable: '未取得出口网络时区，无法确认时区一致性',
  time_zone_mismatch: '浏览器时区与出口网络时区不一致',
  country_unavailable: '未取得出口国家或地区，无法确认语言一致性',
  locale_country_mismatch: '浏览器语言与出口国家或地区不一致',
  accept_language_mismatch: 'Accept-Language 与浏览器语言不一致',
  host_system_mismatch: '系统、UA 或 UA-CH 与当前电脑系统不一致',
  udp_proxy_bypass_risk: 'UDP 未强制通过代理，WebRTC 可能暴露不同网络出口',
  manual_webrtc_ip_unsupported:
    '手动 WebRTC IP 当前不会改写候选地址，已使用网络隔离策略',
  font_override_unsupported: '手动字体名单当前尚未覆盖 Chromium 字体枚举',
  password_controls_unsupported:
    '独立的密码填充与保存开关当前尚未接入 Chromium',
};

export function toastEnvironmentWarnings(warnings: string[] | undefined) {
  if (!warnings?.length) {
    return;
  }

  const messages = [
    ...new Set(
      warnings.map(
        (warning) =>
          environmentWarningMessages[warning] ?? `未知检查项：${warning}`,
      ),
    ),
  ];

  toast.warning('环境一致性检查发现风险', {
    description: messages.join('；'),
    duration: 10_000,
  });
}
