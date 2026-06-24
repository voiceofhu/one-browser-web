import {
  ActivityIcon,
  AlarmClockIcon,
  ArchiveIcon,
  BadgeCheckIcon,
  BarChart3Icon,
  BellIcon,
  BookOpenTextIcon,
  BoxIcon,
  BoxesIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarClockIcon,
  CalendarIcon,
  ChartColumnIcon,
  ChartNoAxesColumnIcon,
  CircleGaugeIcon,
  ClipboardListIcon,
  CogIcon,
  CpuIcon,
  CreditCardIcon,
  DatabaseIcon,
  DatabaseZapIcon,
  DownloadIcon,
  FileBadgeIcon,
  FileClockIcon,
  FileCogIcon,
  FileSearchIcon,
  FileTextIcon,
  FingerprintIcon,
  FolderIcon,
  FolderOpenIcon,
  GaugeIcon,
  GlobeIcon,
  HardDriveIcon,
  HashIcon,
  HandshakeIcon,
  HeartPulseIcon,
  HistoryIcon,
  HomeIcon,
  IdCardIcon,
  KeyRoundIcon,
  LayersIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  ListTreeIcon,
  LockKeyholeIcon,
  LogInIcon,
  LogsIcon,
  MenuIcon,
  MonitorIcon,
  NetworkIcon,
  PackageIcon,
  PanelLeftIcon,
  PlugIcon,
  ScrollTextIcon,
  ServerCogIcon,
  Settings2Icon,
  SettingsIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  TablePropertiesIcon,
  TagIcon,
  UploadIcon,
  UserCheckIcon,
  UserCogIcon,
  UserRoundCogIcon,
  UserRoundCheckIcon,
  UsersRoundIcon,
  UsersIcon,
  WorkflowIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react"

export type MenuIconCategory =
  | "common"
  | "system"
  | "organization"
  | "content"
  | "monitor"
  | "tools"

export type MenuIconCategoryValue = "all" | MenuIconCategory

export type MenuIconCategoryOption = {
  value: MenuIconCategoryValue
  label: string
}

export type MenuIconOption = {
  value: string
  label: string
  category: MenuIconCategory
  Icon: LucideIcon
}

export const MENU_ICON_CATEGORIES: MenuIconCategoryOption[] = [
  { value: "all", label: "全部" },
  { value: "common", label: "常用" },
  { value: "system", label: "系统" },
  { value: "organization", label: "组织" },
  { value: "content", label: "内容" },
  { value: "monitor", label: "监控" },
  { value: "tools", label: "工具" },
]

export const MENU_ICON_OPTIONS: MenuIconOption[] = [
  { value: "#", label: "默认", category: "common", Icon: HashIcon },
  { value: "home", label: "主页", category: "common", Icon: HomeIcon },
  {
    value: "layout-dashboard",
    label: "首页",
    category: "common",
    Icon: LayoutDashboardIcon,
  },
  { value: "menu", label: "菜单", category: "common", Icon: MenuIcon },
  { value: "settings", label: "设置", category: "common", Icon: SettingsIcon },
  {
    value: "settings-2",
    label: "配置",
    category: "common",
    Icon: Settings2Icon,
  },
  { value: "cog", label: "系统配置", category: "common", Icon: CogIcon },
  {
    value: "panel-left",
    label: "侧栏",
    category: "common",
    Icon: PanelLeftIcon,
  },
  { value: "layers", label: "分层", category: "common", Icon: LayersIcon },
  { value: "workflow", label: "流程", category: "common", Icon: WorkflowIcon },
  { value: "tag", label: "标签", category: "common", Icon: TagIcon },
  { value: "shield", label: "角色", category: "system", Icon: ShieldIcon },
  { value: "key-round", label: "权限", category: "system", Icon: KeyRoundIcon },
  {
    value: "lock-keyhole",
    label: "安全",
    category: "system",
    Icon: LockKeyholeIcon,
  },
  {
    value: "fingerprint",
    label: "身份认证",
    category: "system",
    Icon: FingerprintIcon,
  },
  { value: "log-in", label: "登录", category: "system", Icon: LogInIcon },
  {
    value: "badge-check",
    label: "审核",
    category: "system",
    Icon: BadgeCheckIcon,
  },
  {
    value: "sliders-horizontal",
    label: "参数",
    category: "system",
    Icon: SlidersHorizontalIcon,
  },
  {
    value: "file-cog",
    label: "系统文件",
    category: "system",
    Icon: FileCogIcon,
  },
  { value: "users", label: "用户", category: "organization", Icon: UsersIcon },
  {
    value: "user-check",
    label: "用户验证",
    category: "organization",
    Icon: UserCheckIcon,
  },
  {
    value: "user-round-check",
    label: "在线用户",
    category: "organization",
    Icon: UserRoundCheckIcon,
  },
  {
    value: "user-cog",
    label: "用户配置",
    category: "organization",
    Icon: UserCogIcon,
  },
  {
    value: "user-round-cog",
    label: "账号设置",
    category: "organization",
    Icon: UserRoundCogIcon,
  },
  {
    value: "handshake",
    label: "团队",
    category: "organization",
    Icon: HandshakeIcon,
  },
  {
    value: "users-round",
    label: "成员",
    category: "organization",
    Icon: UsersRoundIcon,
  },
  {
    value: "building-2",
    label: "部门",
    category: "organization",
    Icon: Building2Icon,
  },
  {
    value: "file-badge",
    label: "岗位",
    category: "organization",
    Icon: FileBadgeIcon,
  },
  {
    value: "briefcase-business",
    label: "职位",
    category: "organization",
    Icon: BriefcaseBusinessIcon,
  },
  {
    value: "id-card",
    label: "身份卡",
    category: "organization",
    Icon: IdCardIcon,
  },
  {
    value: "book-open-text",
    label: "字典",
    category: "content",
    Icon: BookOpenTextIcon,
  },
  { value: "database", label: "数据", category: "content", Icon: DatabaseIcon },
  {
    value: "database-zap",
    label: "数据服务",
    category: "content",
    Icon: DatabaseZapIcon,
  },
  {
    value: "file-text",
    label: "文档",
    category: "content",
    Icon: FileTextIcon,
  },
  {
    value: "scroll-text",
    label: "日志文档",
    category: "content",
    Icon: ScrollTextIcon,
  },
  {
    value: "clipboard-list",
    label: "操作日志",
    category: "content",
    Icon: ClipboardListIcon,
  },
  {
    value: "file-clock",
    label: "登录日志",
    category: "content",
    Icon: FileClockIcon,
  },
  {
    value: "list-tree",
    label: "树列表",
    category: "content",
    Icon: ListTreeIcon,
  },
  {
    value: "list-checks",
    label: "清单",
    category: "content",
    Icon: ListChecksIcon,
  },
  {
    value: "table-properties",
    label: "数据表",
    category: "content",
    Icon: TablePropertiesIcon,
  },
  { value: "folder", label: "目录", category: "content", Icon: FolderIcon },
  {
    value: "folder-open",
    label: "展开目录",
    category: "content",
    Icon: FolderOpenIcon,
  },
  { value: "archive", label: "归档", category: "content", Icon: ArchiveIcon },
  { value: "package", label: "包", category: "content", Icon: PackageIcon },
  { value: "box", label: "盒子", category: "content", Icon: BoxIcon },
  { value: "boxes", label: "资源包", category: "content", Icon: BoxesIcon },
  {
    value: "heart-pulse",
    label: "监控",
    category: "monitor",
    Icon: HeartPulseIcon,
  },
  { value: "monitor", label: "服务", category: "monitor", Icon: MonitorIcon },
  {
    value: "server-cog",
    label: "服务器",
    category: "monitor",
    Icon: ServerCogIcon,
  },
  { value: "activity", label: "活动", category: "monitor", Icon: ActivityIcon },
  { value: "gauge", label: "仪表盘", category: "monitor", Icon: GaugeIcon },
  {
    value: "circle-gauge",
    label: "性能",
    category: "monitor",
    Icon: CircleGaugeIcon,
  },
  { value: "cpu", label: "CPU", category: "monitor", Icon: CpuIcon },
  {
    value: "hard-drive",
    label: "存储",
    category: "monitor",
    Icon: HardDriveIcon,
  },
  { value: "network", label: "网络", category: "monitor", Icon: NetworkIcon },
  { value: "logs", label: "日志", category: "monitor", Icon: LogsIcon },
  { value: "history", label: "历史", category: "monitor", Icon: HistoryIcon },
  {
    value: "alarm-clock",
    label: "计划任务",
    category: "monitor",
    Icon: AlarmClockIcon,
  },
  {
    value: "calendar-clock",
    label: "定时任务",
    category: "monitor",
    Icon: CalendarClockIcon,
  },
  { value: "bell", label: "通知", category: "tools", Icon: BellIcon },
  { value: "calendar", label: "日历", category: "tools", Icon: CalendarIcon },
  { value: "globe", label: "全局", category: "tools", Icon: GlobeIcon },
  { value: "plug", label: "插件", category: "tools", Icon: PlugIcon },
  { value: "wrench", label: "工具", category: "tools", Icon: WrenchIcon },
  {
    value: "file-search",
    label: "检索",
    category: "tools",
    Icon: FileSearchIcon,
  },
  { value: "upload", label: "上传", category: "tools", Icon: UploadIcon },
  { value: "download", label: "下载", category: "tools", Icon: DownloadIcon },
  {
    value: "credit-card",
    label: "支付",
    category: "tools",
    Icon: CreditCardIcon,
  },
  {
    value: "bar-chart-3",
    label: "统计",
    category: "tools",
    Icon: BarChart3Icon,
  },
  {
    value: "chart-column",
    label: "柱状图",
    category: "tools",
    Icon: ChartColumnIcon,
  },
  {
    value: "chart-no-axes-column",
    label: "报表",
    category: "tools",
    Icon: ChartNoAxesColumnIcon,
  },
]

export function findMenuIconOption(value: string | null | undefined) {
  const normalizedValue = value?.trim()

  if (!normalizedValue || normalizedValue === "#") {
    return null
  }

  return MENU_ICON_OPTIONS.find((option) => option.value === normalizedValue)
}

export function getMenuIconOption(value: string) {
  return findMenuIconOption(value) ?? MENU_ICON_OPTIONS[0]
}

export function filterMenuIconOptions(
  keyword: string,
  category: MenuIconCategoryValue
) {
  const normalizedKeyword = keyword.trim().toLowerCase()
  const categoryOptions =
    category === "all"
      ? MENU_ICON_OPTIONS
      : MENU_ICON_OPTIONS.filter((option) => option.category === category)

  if (!normalizedKeyword) {
    return categoryOptions
  }

  return categoryOptions.filter((option) =>
    [option.value, option.label, getMenuIconCategoryLabel(option.category)]
      .join(" ")
      .toLowerCase()
      .includes(normalizedKeyword)
  )
}

export function getMenuIconCategoryLabel(category: MenuIconCategory) {
  return (
    MENU_ICON_CATEGORIES.find((item) => item.value === category)?.label ??
    category
  )
}
