import {
  ApiIcon,
  BrowserIcon,
  ComputerIcon,
  Link04Icon,
  PaintBoardIcon,
  Refresh01Icon,
  Shield01Icon,
  UserAdd01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';

export type SettingsSectionId =
  | 'profile'
  | 'security'
  | 'invite'
  | 'appearance'
  | 'browser'
  | 'pre-proxy'
  | 'local-api'
  | 'client'
  | 'desktop';

/**
 * Where a setting lives decides where it can be edited:
 * - `account` follows the signed-in user on every device, web or App;
 * - `app` is saved per browser / App install and works in both;
 * - `device` drives the local Chromium, network and system, so App only;
 * - `web` is the web page's stand-in for the whole `device` group.
 */
export type SettingsScope = 'account' | 'app' | 'device' | 'web';

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: typeof UserIcon;
  scope: SettingsScope;
};

const allSections: SettingsSection[] = [
  {
    id: 'profile',
    label: '个人信息',
    description: '头像、昵称和联系方式，对所有设备和团队成员生效。',
    icon: UserIcon,
    scope: 'account',
  },
  {
    id: 'security',
    label: '登录与安全',
    description: '登录密码由 One User 统一管理；也可以在这里切换账号或退出。',
    icon: Shield01Icon,
    scope: 'account',
  },
  {
    id: 'invite',
    label: '邀请好友',
    description: '复制邀请链接或二维码，并查看已经邀请的好友。',
    icon: UserAdd01Icon,
    scope: 'account',
  },
  {
    id: 'appearance',
    label: '外观与语言',
    description: '语言、主题和显示密度，只保存在当前设备。',
    icon: PaintBoardIcon,
    scope: 'app',
  },
  {
    id: 'browser',
    label: '浏览器',
    description: '本机 Chromium、默认启动页和环境数据的存放位置。',
    icon: BrowserIcon,
    scope: 'device',
  },
  {
    id: 'pre-proxy',
    label: '前置代理',
    description: '本机连接环境代理之前先经过的网络出口。',
    icon: Link04Icon,
    scope: 'device',
  },
  {
    id: 'local-api',
    label: '本地 API',
    description: '供本机自动化脚本和 SDK 调用的接口。',
    icon: ApiIcon,
    scope: 'device',
  },
  {
    id: 'client',
    label: '更新与诊断',
    description: '客户端版本、系统通知和排查问题用的工具。',
    icon: Refresh01Icon,
    scope: 'device',
  },
  {
    id: 'desktop',
    label: '桌面客户端',
    description: '启动环境和本机设置都在 One Browser App 中完成。',
    icon: ComputerIcon,
    scope: 'web',
  },
];

export type SettingsNavGroup = {
  title: string;
  sections: SettingsSection[];
};

/** The sections this runtime can actually use, grouped for the nav. */
export function getSettingsNavGroups(isDesktop: boolean): SettingsNavGroup[] {
  const pick = (scope: SettingsScope) =>
    allSections.filter((section) => section.scope === scope);

  return [
    { title: '账户', sections: pick('account') },
    { title: '通用', sections: pick('app') },
    isDesktop
      ? { title: '本机客户端', sections: pick('device') }
      : { title: '本机客户端', sections: pick('web') },
  ];
}

/**
 * Resolve a `/settings/:section` param. A link to an App-only section opened
 * on the web lands on the 桌面客户端 page instead of a dead end.
 */
export function resolveSettingsSection(
  value: string | undefined,
  isDesktop: boolean,
): SettingsSection | null {
  const section = allSections.find((candidate) => candidate.id === value);
  if (!section) {
    return null;
  }
  if (isDesktop) {
    return section.scope === 'web' ? null : section;
  }
  return section.scope === 'device'
    ? (allSections.find((candidate) => candidate.scope === 'web') ?? null)
    : section;
}

export function defaultSettingsSection(isDesktop: boolean): SettingsSectionId {
  return isDesktop ? 'browser' : 'appearance';
}

export function settingsPath(section?: SettingsSectionId) {
  return section ? `/settings/${section}` : '/settings';
}
