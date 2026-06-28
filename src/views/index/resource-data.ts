import type {
  IndexOverviewResourceGroup,
  IndexOverviewResources,
} from "@/api/index"

type ResourceCountKey = keyof IndexOverviewResources

type ResourceGroupDefinition = {
  key: string
  title: string
  items: Array<{
    key: ResourceCountKey
    title: string
    description: string
  }>
}

export type ResourceItemView = {
  key: string
  title: string
  description: string
  total: number
  error: string | null
  isLoading: boolean
}

export type ResourceGroupView = {
  key: string
  title: string
  items: ResourceItemView[]
}

const resourceGroupDefinitions: ResourceGroupDefinition[] = [
  {
    key: "account_access",
    title: "账号权限",
    items: [
      { key: "users", title: "用户", description: "后台账号" },
      { key: "roles", title: "角色", description: "权限角色" },
      { key: "menus", title: "权限", description: "菜单与按钮权限" },
    ],
  },
  {
    key: "dictionary_content",
    title: "基础配置",
    items: [
      { key: "dict_types", title: "字典类型", description: "字典定义" },
      { key: "dict_data", title: "字典数据", description: "字典键值" },
      { key: "notices", title: "通知", description: "通知公告" },
    ],
  },
]

export function buildResourceGroups({
  groups,
  resources,
  isLoading,
  fallbackErrorMessage,
}: {
  groups?: IndexOverviewResourceGroup[]
  resources?: IndexOverviewResources
  isLoading: boolean
  fallbackErrorMessage: string | null
}): ResourceGroupView[] {
  if (groups?.length) {
    return groups.map((group) => ({
      key: group.key,
      title: group.title,
      items: group.items.map((item) => ({
        key: item.key,
        title: item.title,
        description: item.description,
        total: item.total,
        error: fallbackErrorMessage ?? item.error,
        isLoading,
      })),
    }))
  }

  return resourceGroupDefinitions.map((group) => ({
    key: group.key,
    title: group.title,
    items: group.items.map((item) => {
      const count = resources?.[item.key]

      return {
        key: item.key,
        title: item.title,
        description: item.description,
        total: count?.total ?? 0,
        error: fallbackErrorMessage ?? count?.error ?? null,
        isLoading,
      }
    }),
  }))
}
