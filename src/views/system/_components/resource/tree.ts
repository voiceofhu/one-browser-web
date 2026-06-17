export type ResourceTreeConfig<TData> = {
  columnId: string
  getParentId: (record: TData) => number | null
  getOrder?: (record: TData) => number
  pageSize?: number
}

export type ResourceTreeRow<TData> = TData & {
  children?: ResourceTreeRow<TData>[]
}

export function buildResourceTree<TData>(
  records: TData[],
  getId: (record: TData) => number,
  config: ResourceTreeConfig<TData>
) {
  const nodeMap = new Map<number, ResourceTreeRow<TData>>()
  const roots: ResourceTreeRow<TData>[] = []

  for (const record of records) {
    nodeMap.set(getId(record), {
      ...(record as object),
      children: [],
    } as ResourceTreeRow<TData>)
  }

  for (const record of records) {
    const node = nodeMap.get(getId(record))
    if (!node) {
      continue
    }

    const parentId = config.getParentId(record)
    const parent = parentId == null ? undefined : nodeMap.get(parentId)
    if (parent && parent !== node) {
      parent.children?.push(node)
      continue
    }

    roots.push(node)
  }

  sortTree(roots, getId, config.getOrder)
  return roots
}

export function getResourceTreeSubRows<TData>(record: TData) {
  const children = (record as ResourceTreeRow<TData>).children
  return children?.length ? (children as TData[]) : undefined
}

function sortTree<TData>(
  nodes: ResourceTreeRow<TData>[],
  getId: (record: TData) => number,
  getOrder?: (record: TData) => number
) {
  nodes.sort((left, right) => {
    const leftOrder = getOrder?.(left) ?? 0
    const rightOrder = getOrder?.(right) ?? 0
    return leftOrder - rightOrder || getId(left) - getId(right)
  })

  for (const node of nodes) {
    if (node.children?.length) {
      sortTree(node.children, getId, getOrder)
    }
  }
}
