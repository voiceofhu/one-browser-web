export const authQueryKeys = {
  all: ["auth"] as const,
  currentUser: ["auth", "current-user"] as const,
  permissions: ["auth", "permissions"] as const,
  teamInvite: (token: string) => ["auth", "team-invite", token] as const,
}

export const monitorQueryKeys = {
  all: ["monitor"] as const,
  health: ["monitor", "health"] as const,
  onlineUsers: ["monitor", "online-users"] as const,
  jobs: ["monitor", "jobs"] as const,
  jobLogs: ["monitor", "job-logs"] as const,
}

export const indexQueryKeys = {
  all: ["index"] as const,
  overview: ["index", "overview"] as const,
}

export const browserQueryKeys = {
  all: ["browser"] as const,
  environments: ["browser", "environments"] as const,
  environmentDetail: (environmentId: number) =>
    ["browser", "environments", "detail", environmentId] as const,
  environmentAction: (environmentId: number, action: string) =>
    ["browser", "environments", "action", environmentId, action] as const,
  proxies: ["browser", "proxies"] as const,
  proxyDetail: (proxyId: number) =>
    ["browser", "proxies", "detail", proxyId] as const,
  proxyAction: (proxyId: number, action: string) =>
    ["browser", "proxies", "action", proxyId, action] as const,
  members: ["browser", "members"] as const,
  memberDetail: (memberId: number) =>
    ["browser", "members", "detail", memberId] as const,
  memberRoles: (memberId: number) =>
    ["browser", "members", "roles", memberId] as const,
  memberAction: (memberId: number, action: string) =>
    ["browser", "members", "action", memberId, action] as const,
  teams: ["browser", "teams"] as const,
  teamDetail: (teamId: number) =>
    ["browser", "teams", "detail", teamId] as const,
  teamAction: (teamId: number, action: string) =>
    ["browser", "teams", "action", teamId, action] as const,
  assets: ["browser", "assets"] as const,
  assetUploads: ["browser", "assets", "uploads"] as const,
  assetAction: (assetId: number, action: string) =>
    ["browser", "assets", "action", assetId, action] as const,
}

export const systemQueryKeys = {
  all: ["system"] as const,
  users: ["system", "users"] as const,
  roles: ["system", "roles"] as const,
  menus: ["system", "menus"] as const,
  dictTypes: ["system", "dict-types"] as const,
  dictData: ["system", "dict-data"] as const,
  notices: ["system", "notices"] as const,
  operationLogs: ["system", "logs", "operation"] as const,
  loginLogs: ["system", "logs", "login"] as const,
}
