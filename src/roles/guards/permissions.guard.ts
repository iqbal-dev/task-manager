import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { User } from '../../users/entities/user.entity.js';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';
import { hasPermission, Permission } from '../permission.enum.js';

/** Registered globally after JwtAuthGuard, so `request.user` is already set. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      Permission[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();
    if (user && required.every((p) => hasPermission(user, p))) return true;
    throw new ForbiddenException('Insufficient permissions');
  }
}
