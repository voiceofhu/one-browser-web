"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

import { getRoleMenuIds } from "@/api/system/role"
import { listMenus } from "@/api/system/menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { systemQueryKeys } from "@/lib/query-keys"
import { cn } from "@/lib/utils"
import type { MenuResource } from "@/types/admin"

type CheckedState = boolean | "indeterminate"

type MenuTreeNode = {
  menu: MenuResource
  children: MenuTreeNode[]
}

type RoleMenuPermissionTreeProps = {
  value: number[]
  roleId?: number
  disabled: boolean
  invalid: boolean
  onChange: (menuIds: number[]) => void
}

export function RoleMenuPermissionTree({
  value,
  roleId,
  disabled,
  invalid,
  onChange,
}: RoleMenuPermissionTreeProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set())
  const [linked, setLinked] = React.useState(true)
  const menusQuery = useQuery({
    queryKey: [...systemQueryKeys.menus, "permission-tree"],
    queryFn: () => listMenus({ page: 1, page_size: 1_000 }),
    staleTime: 30_000,
  })
  const roleMenusQuery = useQuery({
    queryKey: [...systemQueryKeys.roles, "menus", roleId],
    queryFn: () => getRoleMenuIds(roleId ?? 0),
    enabled: roleId != null,
    staleTime: 30_000,
  })

  React.useEffect(() => {
    if (roleMenusQuery.data) {
      onChange(roleMenusQuery.data.ids)
    }
  }, [onChange, roleMenusQuery.data])

  const menus = React.useMemo(
    () => menusQuery.data?.list ?? [],
    [menusQuery.data]
  )
  const tree = React.useMemo(() => buildMenuTree(menus), [menus])
  const allMenuIds = React.useMemo(
    () => menus.map((menu) => menu.menu_id),
    [menus]
  )
  const parentById = React.useMemo(() => buildParentMap(menus), [menus])
  const childrenById = React.useMemo(() => buildChildrenMap(tree), [tree])
  const expandableIds = React.useMemo(
    () =>
      Array.from(childrenById.entries())
        .filter(([, childIds]) => childIds.length > 0)
        .map(([menuId]) => menuId),
    [childrenById]
  )
  const selectedIds = React.useMemo(
    () => new Set(value.filter((item) => typeof item === "number")),
    [value]
  )
  const allSelected =
    allMenuIds.length > 0 && allMenuIds.every((id) => selectedIds.has(id))
  const allExpanded =
    expandableIds.length > 0 && expandableIds.every((id) => expandedIds.has(id))
  const isLoading = menusQuery.isLoading || roleMenusQuery.isLoading

  function updateSelection(next: Set<number>) {
    onChange(Array.from(next).sort((left, right) => left - right))
  }

  function toggleExpandAll(checked: boolean) {
    setExpandedIds(checked ? new Set(expandableIds) : new Set())
  }

  function toggleSelectAll(checked: boolean) {
    updateSelection(checked ? new Set(allMenuIds) : new Set())
  }

  function toggleLinked(checked: boolean) {
    setLinked(checked)
    if (checked) {
      updateSelection(normalizeLinkedSelection(selectedIds, tree, parentById))
    }
  }

  function toggleExpanded(menuId: number) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(menuId)) {
        next.delete(menuId)
      } else {
        next.add(menuId)
      }
      return next
    })
  }

  function toggleNode(node: MenuTreeNode, checked: boolean) {
    const next = new Set(selectedIds)
    const nodeIds = collectNodeIds(node)

    if (linked) {
      if (checked) {
        nodeIds.forEach((id) => next.add(id))
        getAncestorIds(node.menu.menu_id, parentById).forEach((id) =>
          next.add(id)
        )
      } else {
        nodeIds.forEach((id) => next.delete(id))
        removeEmptyAncestors(next, node.menu.menu_id, parentById, childrenById)
      }
    } else if (checked) {
      next.add(node.menu.menu_id)
    } else {
      next.delete(node.menu.menu_id)
    }

    updateSelection(next)
  }

  return (
    <div
      aria-invalid={invalid}
      className="overflow-hidden rounded-lg border bg-background aria-invalid:border-destructive"
    >
      <div className="flex flex-wrap items-center gap-3 border-b px-3 py-2 text-sm">
        <CheckboxOption
          label="展开/折叠"
          checked={allExpanded}
          disabled={disabled || isLoading || expandableIds.length === 0}
          onCheckedChange={toggleExpandAll}
        />
        <CheckboxOption
          label="全选/全不选"
          checked={allSelected}
          disabled={disabled || isLoading || allMenuIds.length === 0}
          onCheckedChange={toggleSelectAll}
        />
        <CheckboxOption
          label="父子联动"
          checked={linked}
          disabled={disabled || isLoading}
          onCheckedChange={toggleLinked}
        />
      </div>
      <ScrollArea className="h-64">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Spinner />
              正在加载权限...
            </div>
          ) : tree.length > 0 ? (
            tree.map((node) => (
              <MenuTreeItem
                key={node.menu.menu_id}
                node={node}
                depth={0}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                disabled={disabled}
                onToggleNode={toggleNode}
                onToggleExpanded={toggleExpanded}
              />
            ))
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              暂无权限
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function CheckboxOption({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const id = React.useId()

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-50"
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span>{label}</span>
    </label>
  )
}

function MenuTreeItem({
  node,
  depth,
  selectedIds,
  expandedIds,
  disabled,
  onToggleNode,
  onToggleExpanded,
}: {
  node: MenuTreeNode
  depth: number
  selectedIds: Set<number>
  expandedIds: Set<number>
  disabled: boolean
  onToggleNode: (node: MenuTreeNode, checked: boolean) => void
  onToggleExpanded: (menuId: number) => void
}) {
  const hasChildren = node.children.length > 0
  const expanded = expandedIds.has(node.menu.menu_id)
  const checked = getNodeCheckedState(node, selectedIds)
  const inputId = React.useId()

  return (
    <div>
      <div
        className="flex min-h-8 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
        style={{ paddingLeft: 8 + depth * 18 }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={!hasChildren}
          aria-label={expanded ? "收起权限节点" : "展开权限节点"}
          onClick={() => onToggleExpanded(node.menu.menu_id)}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDownIcon />
            ) : (
              <ChevronRightIcon />
            )
          ) : null}
        </Button>
        <Checkbox
          id={inputId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onToggleNode(node, value === true)}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <span className="truncate">{node.menu.menu_name}</span>
          <Badge variant="outline">{menuTypeLabel(node.menu.menu_type)}</Badge>
        </label>
      </div>
      {hasChildren && expanded
        ? node.children.map((child) => (
            <MenuTreeItem
              key={child.menu.menu_id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              disabled={disabled}
              onToggleNode={onToggleNode}
              onToggleExpanded={onToggleExpanded}
            />
          ))
        : null}
    </div>
  )
}

function getNodeCheckedState(
  node: MenuTreeNode,
  selectedIds: Set<number>
): CheckedState {
  if (selectedIds.has(node.menu.menu_id)) {
    return true
  }
  if (node.children.some((child) => getNodeCheckedState(child, selectedIds))) {
    return "indeterminate"
  }
  return false
}

function buildMenuTree(menus: MenuResource[]) {
  const nodeMap = new Map<number, MenuTreeNode>()
  const roots: MenuTreeNode[] = []

  menus.forEach((menu) => {
    nodeMap.set(menu.menu_id, { menu, children: [] })
  })

  menus.forEach((menu) => {
    const node = nodeMap.get(menu.menu_id)
    if (!node) {
      return
    }
    if (menu.parent_id && nodeMap.has(menu.parent_id)) {
      nodeMap.get(menu.parent_id)?.children.push(node)
    } else {
      roots.push(node)
    }
  })

  sortMenuTree(roots)
  return roots
}

function sortMenuTree(nodes: MenuTreeNode[]) {
  nodes.sort((left, right) => {
    if (left.menu.order_num !== right.menu.order_num) {
      return left.menu.order_num - right.menu.order_num
    }
    return left.menu.menu_id - right.menu.menu_id
  })
  nodes.forEach((node) => sortMenuTree(node.children))
}

function buildParentMap(menus: MenuResource[]) {
  const parentById = new Map<number, number>()
  menus.forEach((menu) => {
    if (menu.parent_id) {
      parentById.set(menu.menu_id, menu.parent_id)
    }
  })
  return parentById
}

function buildChildrenMap(tree: MenuTreeNode[]) {
  const childrenById = new Map<number, number[]>()
  function walk(node: MenuTreeNode) {
    childrenById.set(
      node.menu.menu_id,
      node.children.map((child) => child.menu.menu_id)
    )
    node.children.forEach(walk)
  }
  tree.forEach(walk)
  return childrenById
}

function collectNodeIds(node: MenuTreeNode): number[] {
  return [
    node.menu.menu_id,
    ...node.children.flatMap((child) => collectNodeIds(child)),
  ]
}

function getAncestorIds(
  menuId: number,
  parentById: Map<number, number>
): number[] {
  const ancestorIds: number[] = []
  let parentId = parentById.get(menuId)
  while (parentId) {
    ancestorIds.push(parentId)
    parentId = parentById.get(parentId)
  }
  return ancestorIds
}

function normalizeLinkedSelection(
  selectedIds: Set<number>,
  tree: MenuTreeNode[],
  parentById: Map<number, number>
): Set<number> {
  const next = new Set(selectedIds)

  function walk(node: MenuTreeNode) {
    if (selectedIds.has(node.menu.menu_id)) {
      collectNodeIds(node).forEach((id) => next.add(id))
    }
    node.children.forEach(walk)
  }

  tree.forEach(walk)
  selectedIds.forEach((id) => {
    getAncestorIds(id, parentById).forEach((ancestorId) => next.add(ancestorId))
  })
  return next
}

function removeEmptyAncestors(
  selectedIds: Set<number>,
  menuId: number,
  parentById: Map<number, number>,
  childrenById: Map<number, number[]>
) {
  getAncestorIds(menuId, parentById).forEach((ancestorId) => {
    if (!hasSelectedDescendant(ancestorId, selectedIds, childrenById)) {
      selectedIds.delete(ancestorId)
    }
  })
}

function hasSelectedDescendant(
  menuId: number,
  selectedIds: Set<number>,
  childrenById: Map<number, number[]>
): boolean {
  return (childrenById.get(menuId) ?? []).some(
    (childId) =>
      selectedIds.has(childId) ||
      hasSelectedDescendant(childId, selectedIds, childrenById)
  )
}

function menuTypeLabel(type: MenuResource["menu_type"]) {
  if (type === "M") {
    return "目录"
  }
  if (type === "C") {
    return "菜单"
  }
  return "按钮"
}
