"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

import { listAppPermissions } from "@/api/system/app-permission"
import { listMenus } from "@/api/system/menu"
import { getRolePermissions } from "@/api/system/role"
import { useTranslation } from "@/components/providers/language-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { translateAdminText } from "@/local"
import { systemQueryKeys } from "@/lib/query-keys"
import { cn } from "@/lib/utils"
import type { MenuTypeFlag } from "@/types/admin"

type CheckedState = boolean | "indeterminate"
type PermissionTreeSource = "system" | "system-app"

type PermissionTreeEntry = {
  id: number
  name: string
  parentId: number | null
  order: number
  type: MenuTypeFlag
  assignable: boolean
}

type PermissionTreeNode = {
  permission: PermissionTreeEntry
  children: PermissionTreeNode[]
}

type RoleMenuPermissionTreeProps = {
  value: number[]
  roleId?: number
  source?: PermissionTreeSource
  disabled: boolean
  invalid: boolean
  onChange: (permissionIds: number[]) => void
}

export function RoleMenuPermissionTree({
  value,
  roleId,
  source = "system",
  disabled,
  invalid,
  onChange,
}: RoleMenuPermissionTreeProps) {
  const { locale } = useTranslation()
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set())
  const [linked, setLinked] = React.useState(true)
  const permissionsQuery = useQuery({
    queryKey:
      source !== "system"
        ? [...systemQueryKeys.appPermissions, "permission-tree"]
        : [...systemQueryKeys.menus, "permission-tree"],
    queryFn: async (): Promise<PermissionTreeEntry[]> => {
      if (source !== "system") {
        return (await listAppPermissions()).map((permission) => ({
          id: permission.permission_id,
          name: permission.permission_name,
          parentId: permission.parent_id,
          order: permission.order_num,
          type: permission.permission_type,
          assignable: permission.assignable,
        }))
      }

      const response = await listMenus({ page: 1, page_size: 1_000 })
      return response.list.map((menu) => ({
        id: menu.menu_id,
        name: menu.menu_name,
        parentId: menu.parent_id,
        order: menu.order_num,
        type: menu.menu_type,
        assignable: true,
      }))
    },
    staleTime: 30_000,
  })
  const rolePermissionsQuery = useQuery({
    queryKey: [...systemQueryKeys.roles, source, "permissions", roleId],
    queryFn: async () => {
      const permissions = await getRolePermissions(roleId ?? 0)
      return {
        ids:
          source === "system-app"
            ? permissions.app_permission_ids
            : permissions.menu_ids,
      }
    },
    enabled: roleId != null,
    staleTime: 30_000,
  })
  const onChangeRef = React.useRef(onChange)
  const appliedRolePermissionIdsKeyRef = React.useRef<string | null>(null)
  const permissions = React.useMemo(
    () => permissionsQuery.data ?? [],
    [permissionsQuery.data]
  )
  const tree = React.useMemo(
    () => buildPermissionTree(permissions),
    [permissions]
  )
  const allAssignableIds = React.useMemo(
    () =>
      permissions
        .filter((permission) => permission.assignable)
        .map((permission) => permission.id),
    [permissions]
  )
  const assignableIds = React.useMemo(
    () => new Set(allAssignableIds),
    [allAssignableIds]
  )
  const parentById = React.useMemo(
    () => buildParentMap(permissions),
    [permissions]
  )
  const childrenById = React.useMemo(() => buildChildrenMap(tree), [tree])
  const expandableIds = React.useMemo(
    () =>
      Array.from(childrenById.entries())
        .filter(([, childIds]) => childIds.length > 0)
        .map(([permissionId]) => permissionId),
    [childrenById]
  )
  const effectiveValue = React.useMemo(
    () =>
      value.filter(
        (item): item is number =>
          typeof item === "number" && assignableIds.has(item)
      ),
    [assignableIds, value]
  )
  const selectedIds = React.useMemo(
    () => new Set(effectiveValue),
    [effectiveValue]
  )
  const allSelected =
    allAssignableIds.length > 0 &&
    allAssignableIds.every((id) => selectedIds.has(id))
  const allExpanded =
    expandableIds.length > 0 && expandableIds.every((id) => expandedIds.has(id))
  const isLoading = permissionsQuery.isLoading || rolePermissionsQuery.isLoading

  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  React.useEffect(() => {
    if (!rolePermissionsQuery.data) {
      appliedRolePermissionIdsKeyRef.current = null
      return
    }

    const nextIds = normalizePermissionIds(rolePermissionsQuery.data.ids)
    const nextKey = `${source}:${roleId ?? "create"}:${nextIds.join(",")}`
    if (appliedRolePermissionIdsKeyRef.current === nextKey) {
      return
    }

    appliedRolePermissionIdsKeyRef.current = nextKey
    if (createPermissionIdsKey(value) !== nextIds.join(",")) {
      onChangeRef.current(nextIds)
    }
  }, [roleId, rolePermissionsQuery.data, source, value])

  function updateSelection(next: Set<number>) {
    onChange(
      Array.from(next)
        .filter((id) => assignableIds.has(id))
        .sort((left, right) => left - right)
    )
  }

  function toggleExpandAll(checked: boolean) {
    setExpandedIds(checked ? new Set(expandableIds) : new Set())
  }

  function toggleSelectAll(checked: boolean) {
    updateSelection(checked ? new Set(allAssignableIds) : new Set())
  }

  function toggleLinked(checked: boolean) {
    setLinked(checked)
    if (checked) {
      updateSelection(
        normalizeLinkedSelection(selectedIds, tree, parentById, assignableIds)
      )
    }
  }

  function toggleExpanded(permissionId: number) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(permissionId)) {
        next.delete(permissionId)
      } else {
        next.add(permissionId)
      }
      return next
    })
  }

  function toggleNode(node: PermissionTreeNode, checked: boolean) {
    const next = new Set(selectedIds)
    const nodeIds = collectAssignableNodeIds(node)
    const toggledIds =
      linked || !node.permission.assignable ? nodeIds : [node.permission.id]

    if (checked) {
      toggledIds.forEach((id) => next.add(id))
      if (linked && node.permission.assignable) {
        getAncestorIds(node.permission.id, parentById)
          .filter((id) => assignableIds.has(id))
          .forEach((id) => next.add(id))
      }
    } else {
      toggledIds.forEach((id) => next.delete(id))
      if (linked) {
        removeEmptyAncestors(
          next,
          node.permission.id,
          parentById,
          childrenById,
          assignableIds
        )
      }
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
          label={translateAdminText(locale, "展开/折叠")}
          checked={allExpanded}
          disabled={disabled || isLoading || expandableIds.length === 0}
          onCheckedChange={toggleExpandAll}
        />
        <CheckboxOption
          label={translateAdminText(locale, "全选/全不选")}
          checked={allSelected}
          disabled={disabled || isLoading || allAssignableIds.length === 0}
          onCheckedChange={toggleSelectAll}
        />
        <CheckboxOption
          label={translateAdminText(locale, "父子联动")}
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
              {translateAdminText(locale, "正在加载权限...")}
            </div>
          ) : tree.length > 0 ? (
            tree.map((node) => (
              <PermissionTreeItem
                key={node.permission.id}
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
              {translateAdminText(locale, "暂无权限")}
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
      className="flex cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed"
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        className="data-checked:disabled:opacity-100"
        onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
      />
      <span className={cn(disabled && !checked && "text-muted-foreground")}>
        {label}
      </span>
    </label>
  )
}

function PermissionTreeItem({
  node,
  depth,
  selectedIds,
  expandedIds,
  disabled,
  onToggleNode,
  onToggleExpanded,
}: {
  node: PermissionTreeNode
  depth: number
  selectedIds: Set<number>
  expandedIds: Set<number>
  disabled: boolean
  onToggleNode: (node: PermissionTreeNode, checked: boolean) => void
  onToggleExpanded: (permissionId: number) => void
}) {
  const { locale } = useTranslation()
  const hasChildren = node.children.length > 0
  const assignableNodeIds = collectAssignableNodeIds(node)
  const nodeDisabled = disabled || assignableNodeIds.length === 0
  const expanded = expandedIds.has(node.permission.id)
  const checked = getNodeCheckedState(assignableNodeIds, selectedIds)
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
          aria-label={
            expanded
              ? translateAdminText(locale, "收起权限节点")
              : translateAdminText(locale, "展开权限节点")
          }
          onClick={() => onToggleExpanded(node.permission.id)}
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
          disabled={nodeDisabled}
          className="data-checked:disabled:opacity-100"
          onCheckedChange={(nextChecked) =>
            onToggleNode(node, nextChecked === true)
          }
        />
        <label
          htmlFor={inputId}
          className={cn(
            "flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1",
            nodeDisabled && "cursor-not-allowed text-muted-foreground"
          )}
        >
          <span className="truncate">{node.permission.name}</span>
          <Badge variant="outline">
            {translateAdminText(
              locale,
              permissionTypeLabel(node.permission.type)
            )}
          </Badge>
        </label>
      </div>
      {hasChildren && expanded
        ? node.children.map((child) => (
            <PermissionTreeItem
              key={child.permission.id}
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
  assignableNodeIds: number[],
  selectedIds: Set<number>
): CheckedState {
  if (assignableNodeIds.length === 0) {
    return false
  }
  const selectedCount = assignableNodeIds.filter((id) =>
    selectedIds.has(id)
  ).length
  if (selectedCount === assignableNodeIds.length) {
    return true
  }
  return selectedCount > 0 ? "indeterminate" : false
}

function buildPermissionTree(permissions: PermissionTreeEntry[]) {
  const nodeMap = new Map<number, PermissionTreeNode>()
  const roots: PermissionTreeNode[] = []

  permissions.forEach((permission) => {
    nodeMap.set(permission.id, { permission, children: [] })
  })

  permissions.forEach((permission) => {
    const node = nodeMap.get(permission.id)
    if (!node) {
      return
    }
    if (permission.parentId && nodeMap.has(permission.parentId)) {
      nodeMap.get(permission.parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  })

  sortPermissionTree(roots)
  return roots
}

function sortPermissionTree(nodes: PermissionTreeNode[]) {
  nodes.sort((left, right) => {
    if (left.permission.order !== right.permission.order) {
      return left.permission.order - right.permission.order
    }
    return left.permission.id - right.permission.id
  })
  nodes.forEach((node) => sortPermissionTree(node.children))
}

function buildParentMap(permissions: PermissionTreeEntry[]) {
  const parentById = new Map<number, number>()
  permissions.forEach((permission) => {
    if (permission.parentId) {
      parentById.set(permission.id, permission.parentId)
    }
  })
  return parentById
}

function buildChildrenMap(tree: PermissionTreeNode[]) {
  const childrenById = new Map<number, number[]>()
  function walk(node: PermissionTreeNode) {
    childrenById.set(
      node.permission.id,
      node.children.map((child) => child.permission.id)
    )
    node.children.forEach(walk)
  }
  tree.forEach(walk)
  return childrenById
}

function collectAssignableNodeIds(node: PermissionTreeNode): number[] {
  return [
    ...(node.permission.assignable ? [node.permission.id] : []),
    ...node.children.flatMap((child) => collectAssignableNodeIds(child)),
  ]
}

function normalizePermissionIds(ids: number[]) {
  return Array.from(new Set(ids)).sort((left, right) => left - right)
}

function createPermissionIdsKey(ids: number[]) {
  return normalizePermissionIds(ids).join(",")
}

function getAncestorIds(
  permissionId: number,
  parentById: Map<number, number>
): number[] {
  const ancestorIds: number[] = []
  let parentId = parentById.get(permissionId)
  while (parentId) {
    ancestorIds.push(parentId)
    parentId = parentById.get(parentId)
  }
  return ancestorIds
}

function normalizeLinkedSelection(
  selectedIds: Set<number>,
  tree: PermissionTreeNode[],
  parentById: Map<number, number>,
  assignableIds: Set<number>
): Set<number> {
  const next = new Set(selectedIds)

  function walk(node: PermissionTreeNode) {
    if (node.permission.assignable && selectedIds.has(node.permission.id)) {
      collectAssignableNodeIds(node).forEach((id) => next.add(id))
    }
    node.children.forEach(walk)
  }

  tree.forEach(walk)
  selectedIds.forEach((id) => {
    getAncestorIds(id, parentById)
      .filter((ancestorId) => assignableIds.has(ancestorId))
      .forEach((ancestorId) => next.add(ancestorId))
  })
  return next
}

function removeEmptyAncestors(
  selectedIds: Set<number>,
  permissionId: number,
  parentById: Map<number, number>,
  childrenById: Map<number, number[]>,
  assignableIds: Set<number>
) {
  getAncestorIds(permissionId, parentById).forEach((ancestorId) => {
    if (
      assignableIds.has(ancestorId) &&
      !hasSelectedDescendant(ancestorId, selectedIds, childrenById)
    ) {
      selectedIds.delete(ancestorId)
    }
  })
}

function hasSelectedDescendant(
  permissionId: number,
  selectedIds: Set<number>,
  childrenById: Map<number, number[]>
): boolean {
  return (childrenById.get(permissionId) ?? []).some(
    (childId) =>
      selectedIds.has(childId) ||
      hasSelectedDescendant(childId, selectedIds, childrenById)
  )
}

function permissionTypeLabel(type: MenuTypeFlag) {
  if (type === "M") {
    return "目录"
  }
  if (type === "C") {
    return "菜单"
  }
  return "按钮"
}
