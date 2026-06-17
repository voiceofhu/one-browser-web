"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  CheckIcon,
  ChevronsUpDownIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { listMenus } from "@/api/system/menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { systemQueryKeys } from "@/lib/query-keys"
import { cn } from "@/lib/utils"
import type { MenuResource } from "@/types/admin"

type MenuParentSelectProps = {
  controlId: string
  value: unknown
  currentMenuId?: number
  invalid: boolean
  disabled: boolean
  placeholder: string
  onChange: (menu: MenuResource | null) => void
}

type FlatMenu = {
  menu: MenuResource
  depth: number
}

export function MenuParentSelect({
  controlId,
  value,
  currentMenuId,
  invalid,
  disabled,
  placeholder,
  onChange,
}: MenuParentSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [keyword, setKeyword] = React.useState("")
  const selectedId = typeof value === "number" ? value : null
  const query = useQuery({
    queryKey: [...systemQueryKeys.menus, "parent-tree"],
    queryFn: () => listMenus({ page: 1, page_size: 1_000 }),
    staleTime: 30_000,
  })
  const menus = React.useMemo(() => query.data?.items ?? [], [query.data])
  const selectableMenus = React.useMemo(
    () => filterSelectableMenus(menus, currentMenuId),
    [currentMenuId, menus]
  )
  const flatMenus = React.useMemo(
    () => flattenMenus(selectableMenus),
    [selectableMenus]
  )
  const filteredMenus = React.useMemo(
    () => filterFlatMenus(flatMenus, keyword),
    [flatMenus, keyword]
  )
  const selectedMenu =
    menus.find((menu) => menu.menu_id === selectedId) ?? null

  function selectMenu(menu: MenuResource | null) {
    onChange(menu)
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
          className={cn(
            "h-8 w-full justify-between px-2.5 font-normal",
            !selectedMenu && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selectedMenu?.menu_name ?? (selectedId == null ? "顶级菜单" : placeholder)}
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
              placeholder="搜索菜单..."
              className="pl-8"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          <MenuParentOption
            label="顶级菜单"
            selected={selectedId == null}
            onSelect={() => selectMenu(null)}
          >
            <XIcon className="text-muted-foreground" />
          </MenuParentOption>
          {query.isLoading ? (
            <div className="flex items-center justify-center gap-2 px-2 py-6 text-sm text-muted-foreground">
              <Spinner />
              正在加载菜单...
            </div>
          ) : filteredMenus.length > 0 ? (
            filteredMenus.map((item) => (
              <MenuParentOption
                key={item.menu.menu_id}
                label={item.menu.menu_name}
                selected={selectedId === item.menu.menu_id}
                depth={keyword.trim() ? 0 : item.depth}
                description={item.menu.path}
                onSelect={() => selectMenu(item.menu)}
              />
            ))
          ) : (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              没有匹配的菜单
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MenuParentOption({
  label,
  description,
  selected,
  depth = 0,
  children,
  onSelect,
}: {
  label: string
  description?: string
  selected: boolean
  depth?: number
  children?: React.ReactNode
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted [&_svg:not([class*='size-'])]:size-4",
        selected && "bg-muted text-foreground"
      )}
      style={{ paddingInlineStart: 8 + depth * 18 }}
      onClick={onSelect}
    >
      {children}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {description ? (
          <span className="block truncate text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      {selected ? <CheckIcon className="text-primary" /> : null}
    </button>
  )
}

function filterSelectableMenus(menus: MenuResource[], currentMenuId?: number) {
  if (currentMenuId == null) {
    return menus
  }

  const blockedIds = collectDescendantIds(menus, currentMenuId)
  blockedIds.add(currentMenuId)
  return menus.filter((menu) => !blockedIds.has(menu.menu_id))
}

function collectDescendantIds(menus: MenuResource[], menuId: number) {
  const ids = new Set<number>()
  const childrenByParent = new Map<number, MenuResource[]>()

  menus.forEach((menu) => {
    if (menu.parent_id == null) {
      return
    }

    const siblings = childrenByParent.get(menu.parent_id) ?? []
    siblings.push(menu)
    childrenByParent.set(menu.parent_id, siblings)
  })

  function visit(parentId: number) {
    childrenByParent.get(parentId)?.forEach((child) => {
      ids.add(child.menu_id)
      visit(child.menu_id)
    })
  }

  visit(menuId)
  return ids
}

function flattenMenus(menus: MenuResource[]) {
  const nodesById = new Map<number, MenuResource>()
  const childrenByParent = new Map<number | null, MenuResource[]>()
  const result: FlatMenu[] = []

  menus.forEach((menu) => {
    nodesById.set(menu.menu_id, menu)
    const parentId = menu.parent_id ?? null
    const siblings = childrenByParent.get(parentId) ?? []
    siblings.push(menu)
    childrenByParent.set(parentId, siblings)
  })
  childrenByParent.forEach((children) =>
    children.sort((left, right) => left.order_num - right.order_num)
  )

  function visit(parentId: number | null, depth: number) {
    childrenByParent.get(parentId)?.forEach((menu) => {
      result.push({ menu, depth })
      visit(menu.menu_id, depth + 1)
    })
  }

  visit(null, 0)
  menus.forEach((menu) => {
    if (menu.parent_id != null && !nodesById.has(menu.parent_id)) {
      result.push({ menu, depth: 0 })
      visit(menu.menu_id, 1)
    }
  })

  return result
}

function filterFlatMenus(items: FlatMenu[], keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) {
    return items
  }

  return items.filter(({ menu }) =>
    [menu.menu_name, menu.path, menu.perms ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(normalizedKeyword)
  )
}
