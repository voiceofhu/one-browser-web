export const authQueryKeys = {
  all: ["auth"] as const,
  currentUser: ["auth", "current-user"] as const,
  permissions: ["auth", "permissions"] as const,
  teamInvite: (token: string) => ["auth", "team-invite", token] as const,
  referralCodeCheck: (aff: string) =>
    ["auth", "referral-code-check", aff] as const,
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

export const appDownloadQueryKeys = {
  all: ["app-downloads"] as const,
  latest: (platform: string, arch: string) =>
    ["app-downloads", "latest", platform, arch] as const,
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
