export const authQueryKeys = {
  all: ["auth"] as const,
  currentUser: ["auth", "current-user"] as const,
  permissions: ["auth", "permissions"] as const,
}

export const monitorQueryKeys = {
  all: ["monitor"] as const,
  health: ["monitor", "health"] as const,
}

export const systemQueryKeys = {
  all: ["system"] as const,
  users: ["system", "users"] as const,
  roles: ["system", "roles"] as const,
  menus: ["system", "menus"] as const,
  depts: ["system", "depts"] as const,
  posts: ["system", "posts"] as const,
  dictTypes: ["system", "dict-types"] as const,
  dictData: ["system", "dict-data"] as const,
  operationLogs: ["system", "logs", "operation"] as const,
  loginLogs: ["system", "logs", "login"] as const,
}
