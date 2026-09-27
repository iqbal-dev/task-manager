import type { User } from '../users/entities/user.entity.js';

/**
 * Permissions live in code, next to the checks that enforce them; roles (in
 * the database) are named bundles of these. Adding one here grants it to the
 * admin role on the next boot.
 */
export enum Permission {
  UsersRead = 'users:read',
  UsersWrite = 'users:write',
  UsersDelete = 'users:delete',
  RolesRead = 'roles:read',
  RolesManage = 'roles:manage',
}

export const ALL_PERMISSIONS = Object.values(Permission);

export function hasPermission(user: User, permission: Permission): boolean {
  return (user.roles ?? []).some((role) =>
    role.permissions.includes(permission),
  );
}
