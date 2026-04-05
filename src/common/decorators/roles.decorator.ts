import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Marks a route as requiring specific roles.
 * Works with RolesGuard to enforce access control.
 * @example
 * @Roles('admin', 'manager')
 * @Get('admin-only')
 * findAll() {}
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
