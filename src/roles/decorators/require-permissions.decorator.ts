import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permission.enum.js';

export const PERMISSIONS_KEY = 'permissions';

/** The caller must hold every listed permission (enforced by PermissionsGuard). */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
