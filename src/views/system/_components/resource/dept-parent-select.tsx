"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
} from "lucide-react"

import { listDepts } from "@/api/system/dept"
import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { translateAdminText } from "@/local"
import { systemQueryKeys } from "@/lib/query-keys"
import { cn } from "@/lib/utils"
import type { DeptResource } from "@/types/admin"

type DeptParentSelectProps = {
  controlId: string
  value: unknown
  currentDeptId?: number
  invalid: boolean
  disabled: boolean
  placeholder: string
  title?: string
  hideWhenEmpty?: boolean
  onChange: (dept: DeptResource | null) => void
}

type DeptTreeNode = {
  dept: DeptResource
  children: DeptTreeNode[]
}

export function DeptParentSelect({
  controlId,
  value,
  currentDeptId,
  invalid,
  disabled,
  placeholder,
  title = "选择上级部门",
  hideWhenEmpty = false,
  onChange,
}: DeptParentSelectProps) {
  const { locale } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [collapsedIds, setCollapsedIds] = React.useState<Set<number>>(new Set())
  const selectedId = typeof value === "number" ? value : null
  const query = useQuery({
    queryKey: [...systemQueryKeys.depts, "parent-tree"],
    queryFn: () => listDepts({ page: 1, page_size: 500 }),
    staleTime: 30_000,
  })
  const depts = React.useMemo(() => query.data?.list ?? [], [query.data])
  const selectableDepts = React.useMemo(
    () => filterSelectableDepts(depts, currentDeptId),
    [currentDeptId, depts]
  )
  const tree = React.useMemo(
    () => buildDeptTree(selectableDepts),
    [selectableDepts]
  )
  const selectedDept = depts.find((dept) => dept.dept_id === selectedId) ?? null
  const shouldHide =
    hideWhenEmpty &&
    !query.isLoading &&
    !selectedDept &&
    selectableDepts.length === 0

  function toggleExpanded(deptId: number) {
    setCollapsedIds((current) => {
      const next = new Set(current)
      if (next.has(deptId)) {
        next.delete(deptId)
      } else {
        next.add(deptId)
      }
      return next
    })
  }

  function selectDept(dept: DeptResource | null) {
    onChange(dept)
    setOpen(false)
  }

  if (shouldHide) {
    return <span data-dept-parent-empty="true" className="hidden" />
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
            !selectedDept && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selectedDept?.dept_name ?? placeholder}
          </span>
          <ChevronsUpDownIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[60] w-(--radix-popover-trigger-width) gap-0 overflow-hidden p-0"
      >
        <div className="border-b px-2.5 py-2 text-sm text-muted-foreground">
          {translateAdminText(locale, title)}
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {query.isLoading ? (
            <div className="flex items-center justify-center gap-2 px-2 py-6 text-sm text-muted-foreground">
              <Spinner />
              {translateAdminText(locale, "正在加载部门...")}
            </div>
          ) : tree.length > 0 ? (
            tree.map((node) => (
              <DeptTreeItem
                key={node.dept.dept_id}
                node={node}
                depth={0}
                selectedId={selectedId}
                collapsedIds={collapsedIds}
                onToggle={toggleExpanded}
                onSelect={selectDept}
              />
            ))
          ) : (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              {translateAdminText(locale, "暂无可选部门")}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DeptTreeItem({
  node,
  depth,
  selectedId,
  collapsedIds,
  onToggle,
  onSelect,
}: {
  node: DeptTreeNode
  depth: number
  selectedId: number | null
  collapsedIds: Set<number>
  onToggle: (deptId: number) => void
  onSelect: (dept: DeptResource) => void
}) {
  const hasChildren = node.children.length > 0
  const expanded = !collapsedIds.has(node.dept.dept_id)
  const selected = selectedId === node.dept.dept_id
  const { locale } = useTranslation()

  return (
    <div>
      <div
        className={cn(
          "flex items-center rounded-md text-sm hover:bg-muted",
          selected && "bg-muted text-foreground"
        )}
      >
        <div style={{ width: depth * 18 }} />
        <button
          type="button"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:bg-muted [&_svg:not([class*='size-'])]:size-4"
          aria-label={
            expanded
              ? translateAdminText(locale, "收起部门")
              : translateAdminText(locale, "展开部门")
          }
          disabled={!hasChildren}
          onClick={() => onToggle(node.dept.dept_id)}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDownIcon />
            ) : (
              <ChevronRightIcon />
            )
          ) : null}
        </button>
        <button
          type="button"
          className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md pr-2 text-left outline-none focus-visible:bg-muted [&_svg:not([class*='size-'])]:size-4"
          onClick={() => onSelect(node.dept)}
        >
          <span className="truncate">{node.dept.dept_name}</span>
          {selected ? <CheckIcon className="ml-auto" /> : null}
        </button>
      </div>
      {hasChildren && expanded
        ? node.children.map((child) => (
            <DeptTreeItem
              key={child.dept.dept_id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              collapsedIds={collapsedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  )
}

function filterSelectableDepts(depts: DeptResource[], currentDeptId?: number) {
  if (currentDeptId == null) {
    return depts
  }

  return depts.filter(
    (dept) =>
      dept.dept_id !== currentDeptId &&
      dept.parent_id !== currentDeptId &&
      !ancestorsContain(dept.ancestors, currentDeptId)
  )
}

function buildDeptTree(depts: DeptResource[]) {
  const nodeMap = new Map<number, DeptTreeNode>()
  const roots: DeptTreeNode[] = []

  depts.forEach((dept) => {
    nodeMap.set(dept.dept_id, { dept, children: [] })
  })
  depts.forEach((dept) => {
    const node = nodeMap.get(dept.dept_id)
    if (!node) {
      return
    }

    const parent =
      dept.parent_id == null ? undefined : nodeMap.get(dept.parent_id)
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

function ancestorsContain(ancestors: string, deptId: number) {
  return ancestors
    .split(",")
    .map((item) => Number(item.trim()))
    .some((ancestorId) => ancestorId === deptId)
}
