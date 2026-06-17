"use client"

import * as React from "react"
import {
  BellIcon,
  BookOpenTextIcon,
  Building2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
  DatabaseIcon,
  FileBadgeIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  HashIcon,
  HeartPulseIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  ListTreeIcon,
  MenuIcon,
  MonitorIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  UserRoundCogIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type MenuIconSelectProps = {
  controlId: string
  value: unknown
  invalid: boolean
  disabled: boolean
  onChange: (icon: string) => void
}

type MenuIconOption = {
  value: string
  label: string
  Icon: LucideIcon
}

const MENU_ICON_OPTIONS: MenuIconOption[] = [
  { value: "#", label: "默认", Icon: HashIcon },
  { value: "layout-dashboard", label: "首页", Icon: LayoutDashboardIcon },
  { value: "users", label: "用户", Icon: UsersIcon },
  { value: "shield", label: "角色", Icon: ShieldIcon },
  { value: "menu", label: "菜单", Icon: MenuIcon },
  { value: "building-2", label: "部门", Icon: Building2Icon },
  { value: "file-badge", label: "岗位", Icon: FileBadgeIcon },
  { value: "book-open-text", label: "字典", Icon: BookOpenTextIcon },
  { value: "database", label: "数据", Icon: DatabaseIcon },
  { value: "heart-pulse", label: "监控", Icon: HeartPulseIcon },
  { value: "settings", label: "设置", Icon: SettingsIcon },
  { value: "bell", label: "通知", Icon: BellIcon },
  { value: "folder", label: "目录", Icon: FolderIcon },
  { value: "folder-open", label: "展开目录", Icon: FolderOpenIcon },
  { value: "file-text", label: "文档", Icon: FileTextIcon },
  { value: "list-tree", label: "树列表", Icon: ListTreeIcon },
  { value: "key-round", label: "权限", Icon: KeyRoundIcon },
  { value: "user-round-cog", label: "账号设置", Icon: UserRoundCogIcon },
  { value: "monitor", label: "服务", Icon: MonitorIcon },
]

export function MenuIconSelect({
  controlId,
  value,
  invalid,
  disabled,
  onChange,
}: MenuIconSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [keyword, setKeyword] = React.useState("")
  const iconValue = typeof value === "string" && value ? value : "#"
  const selectedOption = getMenuIconOption(iconValue)
  const filteredOptions = React.useMemo(
    () => filterIconOptions(keyword),
    [keyword]
  )

  function selectIcon(nextValue: string) {
    onChange(nextValue)
    setOpen(false)
    setKeyword("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={controlId}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          aria-expanded={open}
          className="h-8 w-full justify-between px-2.5 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <MenuIconPreview value={selectedOption.value} />
            <span className="truncate">{selectedOption.label}</span>
          </span>
          <ChevronsUpDownIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[60] w-(--radix-popover-trigger-width) gap-0 overflow-hidden p-0"
      >
        <div className="border-b p-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              placeholder="搜索图标..."
              className="pl-8"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>
        <div className="grid max-h-72 grid-cols-2 gap-1 overflow-y-auto p-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted [&_svg:not([class*='size-'])]:size-4",
                  iconValue === option.value && "bg-muted text-foreground"
                )}
                onClick={() => selectIcon(option.value)}
              >
                <option.Icon className="text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {iconValue === option.value ? (
                  <CheckIcon className="text-primary" />
                ) : null}
              </button>
            ))
          ) : (
            <div className="col-span-2 px-2 py-6 text-center text-sm text-muted-foreground">
              没有匹配的图标
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function MenuIconPreview({ value }: { value: string }) {
  const option = getMenuIconOption(value)

  return <option.Icon aria-hidden="true" />
}

function getMenuIconOption(value: string) {
  return (
    MENU_ICON_OPTIONS.find((option) => option.value === value) ??
    MENU_ICON_OPTIONS[0]
  )
}

function filterIconOptions(keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) {
    return MENU_ICON_OPTIONS
  }

  return MENU_ICON_OPTIONS.filter((option) =>
    [option.value, option.label]
      .join(" ")
      .toLowerCase()
      .includes(normalizedKeyword)
  )
}
