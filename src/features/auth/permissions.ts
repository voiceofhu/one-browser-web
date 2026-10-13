import type { AuthPermissions, AuthTeamPermissionEntry } from './types';

const ALL_PERMISSION = '*';

export function hasPermission(
  access: AuthPermissions | undefined,
  permission?: string,
  teamId?: number | null,
) {
  if (!permission) {
    return true;
  }
  if (!access) {
    return false;
  }
  if (access.is_super_admin) {
    return true;
  }

  if (
    !isBrowserPermission(permission) &&
    hasPermissionCode(access.permissions, permission)
  ) {
    return true;
  }

  if (hasPermissionCode(access.global_permissions, permission)) {
    return true;
  }

  if (hasAllTeamPermissions(access)) {
    return true;
  }

  const scope = getTeamPermissionScope(access, teamId);
  return hasPermissionCode(scope?.permissions, permission);
}

export function hasButtonPermission(
  access: AuthPermissions | undefined,
  permission?: string,
  teamId?: number | null,
) {
  if (!permission) {
    return true;
  }
  if (!access) {
    return false;
  }
  if (access.is_super_admin) {
    return true;
  }

  if (
    !isBrowserPermission(permission) &&
    hasPermissionCode(access.buttons, permission)
  ) {
    return true;
  }

  if (hasPermissionCode(access.global_buttons, permission)) {
    return true;
  }

  if (hasAllTeamPermissions(access)) {
    return true;
  }

  const scope = getTeamPermissionScope(access, teamId);
  return hasPermissionCode(scope?.buttons, permission);
}

export function hasTeamPermission(
  access: AuthPermissions | undefined,
  permission?: string,
  teamId?: number | null,
) {
  if (!permission) {
    return true;
  }
  if (!access) {
    return false;
  }
  if (access.is_super_admin) {
    return true;
  }

  if (hasPermissionCode(access.global_permissions, permission)) {
    return true;
  }

  if (hasAllTeamPermissions(access)) {
    return true;
  }

  const scope = getTeamPermissionScope(access, teamId);
  return hasPermissionCode(scope?.permissions, permission);
}

export function hasAnyTeamPermission(
  access: AuthPermissions | undefined,
  permission?: string,
) {
  if (!permission) {
    return true;
  }
  if (!access) {
    return false;
  }
  if (access.is_super_admin) {
    return true;
  }

  return (
    hasAllTeamPermissions(access) ||
    hasPermissionCode(access.global_permissions, permission) ||
    getTeamPermissionScopes(access).some((scope) =>
      hasPermissionCode(scope.permissions, permission),
    )
  );
}

export function hasAnyTeamButtonPermission(
  access: AuthPermissions | undefined,
  permission?: string,
) {
  if (!permission) {
    return true;
  }
  if (!access) {
    return false;
  }
  if (access.is_super_admin) {
    return true;
  }

  return (
    hasAllTeamPermissions(access) ||
    hasPermissionCode(access.global_buttons, permission) ||
    getTeamPermissionScopes(access).some((scope) =>
      hasPermissionCode(scope.buttons, permission),
    )
  );
}

function hasPermissionCode(codes: string[] | undefined, permission: string) {
  return Boolean(
    codes?.includes(ALL_PERMISSION) || codes?.includes(permission),
  );
}

function isBrowserPermission(permission: string) {
  return permission.startsWith('browser:');
}

function getTeamPermissionScope(
  access: AuthPermissions,
  teamId: number | null | undefined,
) {
  if (!isValidTeamId(teamId)) {
    return undefined;
  }

  return getTeamPermissionScopes(access).find(
    (scope) => scope.team_id === teamId,
  );
}

function hasAllTeamPermissions(access: AuthPermissions) {
  return (access.team_permissions ?? []).some(
    (scope) => typeof scope === 'string' && scope === ALL_PERMISSION,
  );
}

function getTeamPermissionScopes(
  access: AuthPermissions,
): AuthTeamPermissionEntry[] {
  return (access.team_permissions ?? []).filter(
    (scope): scope is AuthTeamPermissionEntry => typeof scope !== 'string',
  );
}

function isValidTeamId(teamId: number | null | undefined): teamId is number {
  return Number.isSafeInteger(teamId) && (teamId ?? 0) > 0;
}
